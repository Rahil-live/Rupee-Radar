import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FileUpload from "../components/FileUpload";
import { checkHealth } from "../api/client";
import { DEMO_SESSION_ID } from "../demoData";

export default function HomePage() {
  const navigate = useNavigate();
  const [apiStatus, setApiStatus] = useState<"loading" | "ok" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkHealth()
      .then((data) => setApiStatus(data.status === "ok" ? "ok" : "error"))
      .catch(() => setApiStatus("error"));
  }, []);

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-brand-700">RupeeRadar</h1>
            <p className="text-sm text-slate-500">Personal finance insights from bank statements</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              apiStatus === "ok"
                ? "bg-green-100 text-green-800"
                : apiStatus === "loading"
                  ? "bg-slate-100 text-slate-600"
                  : "bg-red-100 text-red-800"
            }`}
          >
            {apiStatus === "loading"
              ? "Connecting…"
              : apiStatus === "ok"
                ? "Backend connected"
                : "Backend not connected"}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-slate-800">Understand where your money goes</h2>
          <p className="mt-2 text-slate-500">
            Upload HDFC, ICICI, or generic CSV/Excel bank statements for categorized spending insights.
          </p>
        </div>

        {apiStatus === "error" && (
          <div className="mb-6 text-center">
            <button
              type="button"
              onClick={() => navigate(`/analysis/${DEMO_SESSION_ID}`)}
              className="rounded-lg bg-amber-600 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
            >
              Backend not connected, click here to check the project
            </button>
            <p className="mt-3 text-sm text-slate-500">
              Opens a sample statement. No Excel upload needed.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        )}

        {apiStatus === "loading" && (
          <p className="text-center text-sm text-slate-500">Checking backend…</p>
        )}

        {apiStatus === "ok" && (
          <FileUpload
            onUploaded={(sessionId) => navigate(`/analysis/${sessionId}`)}
            onError={setError}
          />
        )}

        <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
          <strong className="text-slate-700">Privacy:</strong> Your uploaded file is processed in memory
          and deleted immediately after parsing. Analysis data is stored temporarily (default 72 hours)
          and can be deleted anytime. We do not share your statement with third parties — only
          anonymized transaction descriptions are sent to the LLM for categorization when enabled.
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Sample fixtures: <code>backend/tests/fixtures/hdfc_messy.csv</code>,{" "}
          <code>icici_sample.csv</code> · Template: <code>docs/sample-statement-template.csv</code>
        </p>
      </main>
    </div>
  );
}
