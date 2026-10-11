import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getCurrentUser } from "../lib/auth";
import type { ScanResult } from "../lib/scan";

type StoredResult = {
  imageUrl: string;
  result: ScanResult;
};

const ResultPage = () => {
  const navigate = useNavigate();
  const [scan, setScan] = useState<StoredResult | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      navigate("/login", { replace: true });
      return;
    }

    const stored = sessionStorage.getItem("silingScanResult");

    if (!stored) {
      navigate("/", { replace: true });
      return;
    }

    try {
      setScan(JSON.parse(stored) as StoredResult);
    } catch {
      sessionStorage.removeItem("silingScanResult");
      navigate("/", { replace: true });
    }
  }, [navigate]);

  if (!scan) {
    return null;
  }

  const statusClass =
    scan.result.status === "Healthy"
      ? "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-600/20"
      : "bg-red-500/15 text-red-700 ring-1 ring-red-600/20";

  return (
    <div className="chili-page min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Scan complete
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">
              Your detection result
            </h1>
          </div>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
          >
            Scan another plant
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-emerald-100/60">
            <img
              src={scan.imageUrl}
              alt="Uploaded chili plant"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-xl shadow-slate-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-300">Status</p>
                <h2 className="mt-1 text-3xl font-black">
                  {scan.result.status}
                </h2>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${statusClass}`}
              >
                {scan.result.confidence}% confidence
              </span>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-800/80 p-4">
              <p className="text-sm text-slate-300">Diagnosis</p>
              <p className="mt-2 text-sm leading-6 text-slate-100">
                {scan.result.summary}
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-800/80 p-4">
              <p className="text-sm text-slate-300">Urgency</p>
              <p className="mt-2 text-lg font-semibold text-amber-300">
                {scan.result.urgency}
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => navigate("/guidance")}
                className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                View prevention & cure methods
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="w-full rounded-2xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-700"
              >
                Back to upload
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
