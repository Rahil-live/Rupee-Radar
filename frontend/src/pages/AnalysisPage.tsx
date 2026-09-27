import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  deleteSession,
  getAnalytics,
  getInsights,
  getRecurring,
  getSession,
  getTransactions,
  type Analytics,
  type Insight,
  type RecurringGroup,
  type Transaction,
} from "../api/client";
import AppHeader from "../components/AppHeader";
import CategoryChart from "../components/CategoryChart";
import InsightCards from "../components/InsightCards";
import MonthlyTrendChart from "../components/MonthlyTrendChart";
import ProcessingStatus from "../components/ProcessingStatus";
import RecurringList from "../components/RecurringList";
import ReportExport from "../components/ReportExport";
import SummaryCards from "../components/SummaryCards";
import TransactionTable from "../components/TransactionTable";
import {
  DEMO_INSIGHTS,
  DEMO_SESSION_ID,
  DEMO_RECURRING,
  DEMO_RECURRING_MONTHLY,
  DEMO_TRANSACTIONS,
  demoAnalytics,
} from "../demoData";
import { formatINR } from "../utils/format";

type Tab = "summary" | "transactions" | "recurring" | "insights";

const TABS: { id: Tab; label: string }[] = [
  { id: "summary", label: "Summary" },
  { id: "transactions", label: "Transactions" },
  { id: "recurring", label: "Recurring" },
  { id: "insights", label: "Insights" },
];

export default function AnalysisPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const isDemo = sessionId === DEMO_SESSION_ID;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [thisMonthOnly, setThisMonthOnly] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringGroups, setRecurringGroups] = useState<RecurringGroup[]>([]);
  const [recurringTotal, setRecurringTotal] = useState(0);
  const [filename, setFilename] = useState("");

  const baseAnalytics = isDemo ? (transactions.length ? demoAnalytics(transactions) : null) : analytics;

  const latestMonth = useMemo(() => {
    if (!baseAnalytics?.period_end) return null;
    return baseAnalytics.period_end.slice(0, 7);
  }, [baseAnalytics?.period_end]);

  const filteredAnalytics = useMemo(() => {
    if (!baseAnalytics || !thisMonthOnly || !latestMonth) return baseAnalytics;

    const monthTxns = transactions.filter((t) => t.date.startsWith(latestMonth) && t.amount < 0);
    const spend = monthTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const categoryMap: Record<string, { amount: number; count: number }> = {};
    for (const t of monthTxns) {
      if (!categoryMap[t.category]) categoryMap[t.category] = { amount: 0, count: 0 };
      categoryMap[t.category].amount += Math.abs(t.amount);
      categoryMap[t.category].count += 1;
    }
    const top_categories = Object.entries(categoryMap)
      .map(([category, { amount, count }]) => ({ category, amount, count }))
      .sort((a, b) => b.amount - a.amount);

    return {
      ...baseAnalytics,
      total_spend: spend,
      top_categories,
      monthly_spend: baseAnalytics.monthly_spend.filter((m) => m.month === latestMonth),
    };
  }, [baseAnalytics, thisMonthOnly, latestMonth, transactions]);

  const refreshData = useCallback(async () => {
    if (!sessionId) return;
    const [analyticsData, insightsData, txnData, recurringData] = await Promise.all([
      getAnalytics(sessionId),
      getInsights(sessionId),
      getTransactions(sessionId, 1, 100),
      getRecurring(sessionId),
    ]);
    setAnalytics(analyticsData);
    setInsights(insightsData.insights);
    setTransactions(txnData.items);
    setRecurringGroups(recurringData.groups);
    setRecurringTotal(recurringData.recurring_total_monthly);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    if (isDemo) {
      setFilename("sample-statement.csv");
      setInsights(DEMO_INSIGHTS);
      setTransactions(DEMO_TRANSACTIONS);
      setRecurringGroups(DEMO_RECURRING);
      setRecurringTotal(DEMO_RECURRING_MONTHLY);
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const session = await getSession(sessionId!);
        setFilename(session.filename);

        if (session.status !== "ready") {
          setError(session.error_message || "Session is not ready");
          setLoading(false);
          return;
        }

        await refreshData();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load analysis");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [sessionId, isDemo, refreshData]);

  async function handleDeleteSession() {
    if (!sessionId) return;
    if (!window.confirm("Delete this analysis and all associated data?")) return;
    try {
      await deleteSession(sessionId);
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete session");
    }
  }

  async function handleCategoryUpdated(txn?: Transaction) {
    if (isDemo && txn) {
      setTransactions((prev) => prev.map((item) => (item.id === txn.id ? txn : item)));
      return;
    }
    await refreshData();
  }

  if (loading) {
    return (
      <PageShell>
        <ProcessingStatus />
      </PageShell>
    );
  }

  if (error || !baseAnalytics || !filteredAnalytics) {
    return (
      <PageShell>
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-800">{error || "Analysis not found"}</p>
          <Link to="/" className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline">
            Upload another statement
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mb-8">
        <Link to="/" className="text-sm font-medium text-brand-700 hover:underline">
          {isDemo ? "← Back" : "← Upload another"}
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Spending analysis</h1>
            <p className="mt-1 text-sm text-slate-500">
              {filename} · {baseAnalytics.transaction_count} transactions
              {baseAnalytics.period_start && baseAnalytics.period_end && (
                <> · {baseAnalytics.period_start} to {baseAnalytics.period_end}</>
              )}
            </p>
          </div>
          {isDemo && (
            <p className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
              Sample preview · edits stay in this browser
            </p>
          )}
        </div>
        {!isDemo && (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {sessionId && <ReportExport sessionId={sessionId} />}
            <button
              type="button"
              onClick={handleDeleteSession}
              className="text-sm font-medium text-red-600 hover:text-red-800"
            >
              Delete my data
            </button>
          </div>
        )}
      </div>

      <div className="mb-8 grid w-full grid-cols-2 gap-1 rounded-xl bg-slate-200/70 p-1 sm:inline-grid sm:w-auto sm:grid-cols-4" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
            {tab.id === "recurring" && recurringGroups.length > 0 && (
              <span className="ml-1.5 rounded-full bg-brand-100 px-1.5 py-0.5 text-xs text-brand-900">
                {recurringGroups.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "summary" && (
        <section className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-800">Overview</h2>
            {latestMonth && (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={thisMonthOnly}
                  onChange={(e) => setThisMonthOnly(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                This month only ({latestMonth})
              </label>
            )}
          </div>

          <SummaryCards analytics={thisMonthOnly ? filteredAnalytics : baseAnalytics} />

          {baseAnalytics.recurring_total_monthly > 0 && !thisMonthOnly && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-800">
              Recurring commitments:{" "}
              <span className="font-semibold">{formatINR(baseAnalytics.recurring_total_monthly)}/month</span>
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-base font-semibold text-slate-800">Spend by Category</h3>
              <CategoryChart analytics={filteredAnalytics} />
            </div>
            <div>
              <h3 className="mb-3 text-base font-semibold text-slate-800">Monthly Trend</h3>
              <MonthlyTrendChart
                analytics={thisMonthOnly ? baseAnalytics : filteredAnalytics}
                highlightMonth={thisMonthOnly ? latestMonth : null}
              />
            </div>
          </div>
        </section>
      )}

      {activeTab === "transactions" && sessionId && (
        <section>
          <p className="mb-4 text-sm text-slate-500">
            Click a category dropdown to override — totals and charts update automatically.
          </p>
          <TransactionTable
            sessionId={sessionId}
            transactions={transactions}
            onCategoryUpdated={handleCategoryUpdated}
          />
        </section>
      )}

      {activeTab === "recurring" && (
        <section>
          <RecurringList groups={recurringGroups} totalMonthly={recurringTotal} />
        </section>
      )}

      {activeTab === "insights" && (
        <section>
          <InsightCards insights={insights} />
        </section>
      )}
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
