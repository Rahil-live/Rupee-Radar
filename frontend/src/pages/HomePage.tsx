import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import FileUpload from "../components/FileUpload";
import { checkHealth } from "../api/client";
import { DEMO_SESSION_ID } from "../demoData";

const POINTS = [
  { title: "Categories", text: "Food, rent, EMIs, and the rest, sorted from the statement." },
  { title: "Recurring", text: "Subscriptions and monthly commitments pulled out on their own." },
  { title: "Insights", text: "A short read on where the money actually went." },
];

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
      <AppHeader status={apiStatus} />

      <main className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <div className="mb-10">
          <p className="text-sm font-medium text-brand-700">Personal finance</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Understand where your money goes
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-600">
            Upload an HDFC, ICICI, or generic CSV or Excel statement. RupeeRadar turns the rows into
            spending totals, charts, and a short set of notes.
          </p>
        </div>

        <ul className="mb-10 grid gap-3 sm:grid-cols-3">
          {POINTS.map((point) => (
            <li key={point.title} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">{point.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{point.text}</p>
            </li>
          ))}
        </ul>

        {apiStatus === "error" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-slate-600">
              The server is not connected, so a live upload is not available. You can still open a
              sample statement and see the dashboard.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/analysis/${DEMO_SESSION_ID}`)}
              className="mt-4 cursor-pointer rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              Backend not connected, click here to check the project
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {error}
          </div>
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

        <p className="mt-8 text-xs leading-relaxed text-slate-500">
          Uploaded files are parsed in memory and deleted right after. Analysis is kept for a short
          time (72 hours by default) and can be deleted from the dashboard. Only anonymized
          descriptions are sent to the AI when that step is turned on.
        </p>
      </main>
    </div>
  );
}
