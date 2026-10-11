import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getCurrentUser } from "../lib/auth";
import type { ScanResult } from "../lib/scan";

type StoredResult = {
  imageUrl: string;
  result: ScanResult;
};

const GuidancePage = () => {
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

  const preventionSteps =
    scan.result.status === "Healthy"
      ? [
          "Keep the soil evenly moist without overwatering.",
          "Monitor leaf color and plant growth weekly for early signs of stress.",
          "Use compost or a balanced chili fertilizer to support strong reproduction and fruit quality.",
        ]
      : [
          "Remove and discard infected leaves and fruits immediately to reduce spread.",
          "Improve spacing and airflow so leaves dry faster after rain or watering.",
          "Clean pruning tools and avoid moving infected plants near healthy ones.",
        ];

  const cureSteps =
    scan.result.status === "Healthy"
      ? [
          "Continue current care and keep nutrient levels balanced.",
          "Routine checking is enough while the crop remains healthy.",
          "Apply mulch and maintain good drainage to prevent later stress.",
        ]
      : [
          "Apply a recommended fungicide or bactericide following the label instructions.",
          "Use targeted treatment for affected areas, not the whole field unless needed.",
          "Repeat treatment as advised by the product and continue monitoring after application.",
        ];

  return (
    <div className="chili-page min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Prevention & cure
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">
              What to do next
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/result")}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
            >
              Back to result
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Scan another image
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-emerald-100/60">
            <img
              src={scan.imageUrl}
              alt="Uploaded chili plant"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-100/60">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Status
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-900">
                {scan.result.status}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {scan.result.summary}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                <h3 className="text-lg font-bold text-emerald-900">
                  Prevention steps
                </h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-emerald-950">
                  {preventionSteps.map((step) => (
                    <li key={step} className="flex gap-2">
                      <span className="mt-2 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                <h3 className="text-lg font-bold text-amber-900">
                  Cure & treatment
                </h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-amber-950">
                  {cureSteps.map((step) => (
                    <li key={step} className="flex gap-2">
                      <span className="mt-2 h-2.5 w-2.5 rounded-full bg-amber-500" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-900 p-5 text-white shadow-xl shadow-slate-200">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Recommended next step
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-100">
                {scan.result.recommendations.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidancePage;
