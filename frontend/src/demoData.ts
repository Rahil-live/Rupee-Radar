import type { Analytics, Insight, RecurringGroup, Transaction } from "./api/client";

export const DEMO_SESSION_ID = "demo";

function row(
  id: string,
  date: string,
  description: string,
  amount: number,
  category: string,
  recurring = false,
): Transaction {
  return {
    id,
    date,
    description_raw: description,
    description_clean: description,
    amount,
    type: amount < 0 ? "debit" : "credit",
    balance: null,
    category,
    category_confidence: 0.92,
    category_overridden: false,
    is_recurring: recurring,
    payment_mode: "UPI",
    merchant: description,
  };
}

export const DEMO_TRANSACTIONS: Transaction[] = [
  row("d1", "2024-11-01", "NEFT CR SALARY", 85000, "Salary"),
  row("d2", "2024-11-02", "RENT NOBROKER", -22000, "Rent", true),
  row("d3", "2024-11-04", "SWIGGY BANGALORE", -486, "Food"),
  row("d4", "2024-11-08", "UBER INDIA", -312, "Travel"),
  row("d5", "2024-11-09", "SPOTIFY INDIA", -119, "Subscriptions", true),
  row("d6", "2024-11-12", "HOME LOAN EMI HDFC", -28500, "EMI", true),
  row("d7", "2024-11-14", "BESCOM ELECTRICITY", -2140, "Bills"),
  row("d8", "2024-11-18", "ZERODHA SIP", -5000, "Investments"),
  row("d9", "2024-11-22", "BIGBASKET", -1640, "Food"),
  row("d10", "2024-12-01", "NEFT CR SALARY", 85000, "Salary"),
  row("d11", "2024-12-02", "RENT NOBROKER", -22000, "Rent", true),
  row("d12", "2024-12-06", "SWIGGY BANGALORE", -540, "Food"),
  row("d13", "2024-12-08", "HOME LOAN EMI HDFC", -28500, "EMI", true),
  row("d14", "2024-12-09", "SPOTIFY INDIA", -119, "Subscriptions", true),
  row("d15", "2024-12-15", "AMAZON PAY INDIA", -3499, "Shopping"),
  row("d16", "2024-12-19", "MAKEMYTRIP FLIGHT", -8900, "Travel"),
];

export const DEMO_INSIGHTS: Insight[] = [
  {
    text: "Rent and the home-loan EMI are the two largest outflows, together more than half of spending.",
    source: "template",
  },
  {
    text: "Food delivery shows up in both months. A weekly grocery run would likely cost less than Swiggy plus BigBasket.",
    source: "ai",
  },
  {
    text: "Spotify, rent, and the EMI repeat every month. Those commitments are about ₹50,619 before any other spending.",
    source: "template",
  },
];

export const DEMO_RECURRING_MONTHLY = 50619;

export const DEMO_RECURRING: RecurringGroup[] = [
  {
    id: "r1",
    label: "Home loan EMI",
    category: "EMI",
    frequency: "monthly",
    typical_amount: 28500,
    last_seen_date: "2024-12-08",
    transaction_ids: ["d6", "d13"],
    confidence: 0.95,
  },
  {
    id: "r2",
    label: "Rent",
    category: "Rent",
    frequency: "monthly",
    typical_amount: 22000,
    last_seen_date: "2024-12-02",
    transaction_ids: ["d2", "d11"],
    confidence: 0.93,
  },
  {
    id: "r3",
    label: "Spotify",
    category: "Subscriptions",
    frequency: "monthly",
    typical_amount: 119,
    last_seen_date: "2024-12-09",
    transaction_ids: ["d5", "d14"],
    confidence: 0.9,
  },
];

export function demoAnalytics(transactions: Transaction[]): Analytics {
  const income = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const spend = transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const savings = income - spend;
  const categoryMap: Record<string, { amount: number; count: number }> = {};
  const monthly: Record<string, number> = {};
  let biggest: Transaction | null = null;

  for (const txn of transactions) {
    if (txn.amount >= 0) continue;
    const amount = Math.abs(txn.amount);
    if (!categoryMap[txn.category]) categoryMap[txn.category] = { amount: 0, count: 0 };
    categoryMap[txn.category].amount += amount;
    categoryMap[txn.category].count += 1;
    const month = txn.date.slice(0, 7);
    monthly[month] = (monthly[month] ?? 0) + amount;
    if (!biggest || amount > Math.abs(biggest.amount)) biggest = txn;
  }

  const dates = transactions.map((t) => t.date).sort();
  return {
    total_income: income,
    total_spend: spend,
    savings,
    savings_rate: income > 0 ? Math.round((savings / income) * 1000) / 10 : null,
    top_categories: Object.entries(categoryMap)
      .map(([category, value]) => ({ category, amount: value.amount, count: value.count }))
      .sort((a, b) => b.amount - a.amount),
    biggest_debit: biggest
      ? {
          id: biggest.id,
          date: biggest.date,
          description_clean: biggest.description_clean,
          amount: biggest.amount,
          category: biggest.category,
        }
      : null,
    transaction_count: transactions.length,
    period_start: dates[0] ?? null,
    period_end: dates[dates.length - 1] ?? null,
    monthly_spend: Object.keys(monthly)
      .sort()
      .map((month) => ({ month, amount: Math.round(monthly[month] * 100) / 100 })),
    recurring_total_monthly: DEMO_RECURRING_MONTHLY,
  };
}

const demoCheck = demoAnalytics(DEMO_TRANSACTIONS);
if (
  demoCheck.transaction_count !== DEMO_TRANSACTIONS.length ||
  demoCheck.monthly_spend.length < 2 ||
  demoCheck.top_categories[0]?.category !== "EMI" ||
  demoCheck.savings <= 0
) {
  throw new Error("demo sample failed self-check");
}
