import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  getCurrentUser,
  type UserRole,
} from "../lib/auth";
import { analyzeImage } from "../lib/scan";

const roleAccessText: Record<UserRole, string> = {
  farmer: "Upload photos and view results",
  researcher: "Full access to uploads, diagnostics, and history",
  agriculturist: "View saved data and agricultural records only",
  admin: "Manage user access and review platform records",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (currentUser.role === "agriculturist") {
      setError("Agriculturists can only view data and are not allowed to upload images.");
      return;
    }

    setError("");
    setIsLoading(true);
    const imageUrl = URL.createObjectURL(file);

    try {
      const prediction = await analyzeImage(file);

      sessionStorage.setItem(
        "silingScanResult",
        JSON.stringify({
          imageUrl,
          result: prediction,
        }),
      );

      navigate("/result");
    } catch (err) {
      URL.revokeObjectURL(imageUrl);
      setError(
        err instanceof Error ? err.message : "Unable to scan this image.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-col gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
              SilingScan
            </p>
            <h1 className="mt-3 text-4xl font-black text-slate-900 sm:text-5xl">
              Chili Pepper Disease Checker
            </h1>
            <p className="mt-3 text-base text-slate-600">
              Upload a photo of your siling labuyo to detect disease and get
              next steps.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
            {currentUser ? (
              <>
                {currentUser.role !== "agriculturist" ? (
                  <button
                    type="button"
                    onClick={() => navigate("/history")}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
                  >
                    My scans
                  </button>
                ) : null}
                {currentUser.role === "farmer" ? (
                  <button
                    type="button"
                    onClick={() => navigate("/crops")}
                    className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition hover:border-red-300 hover:text-red-700"
                  >
                    My garden
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => navigate("/advisories")}
                  className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition hover:border-red-300 hover:text-red-700"
                >
                  Field guidance
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Log in
              </button>
            )}
          </div>
        </header>

        {currentUser ? (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {roleAccessText[currentUser.role]}
          </div>
        ) : (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Log in to save your scan history and view your uploaded records.
          </div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-100/60 sm:p-8">
          <label
            className={`group flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-emerald-300 bg-emerald-50/60 p-8 text-center transition sm:p-12 ${
              currentUser && currentUser.role !== "agriculturist"
                ? "hover:border-emerald-500 hover:bg-emerald-50"
                : "cursor-not-allowed opacity-60"
            }`}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={!currentUser || currentUser.role === "agriculturist"}
              onChange={handleImageUpload}
            />

            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600 text-3xl text-white shadow-md shadow-emerald-200">
              ⤴
            </div>
            <p className="text-xl font-bold text-slate-800">
              Upload a photo of the chili plant
            </p>
            <p className="mt-2 max-w-md text-sm text-slate-600">
              JPG, PNG, or WEBP files are accepted. Clear images work best for
              an accurate scan.
            </p>
          </label>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="mt-5 flex items-center justify-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
              Scanning your image for disease markers...
            </div>
          ) : null}
          <p className="mt-5 text-center text-xs text-slate-500">
            Your uploaded image is checked privately. Diagnosis will activate
            when the trained SilingScan model is connected.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
