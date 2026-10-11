import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  getCurrentUser,
  getRoleLabel,
  getScanHistory,
  logoutUser,
  type ScanHistoryEntry,
} from "../lib/auth";

const HistoryPage = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<ScanHistoryEntry[]>([]);
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getCurrentUser();

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    setCurrentUser(user);
    let isActive = true;
    void getScanHistory(user.id)
      .then((history) => {
        if (isActive) {
          setEntries(history);
        }
      })
      .catch((err: unknown) => {
        if (isActive) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load scan history.",
          );
        }
      });

    return () => {
      isActive = false;
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      setError(
        err instanceof Error
          ? `Signed out locally, but the server could not revoke the session: ${err.message}`
          : "Signed out locally, but the server could not revoke the session.",
      );
    } finally {
      navigate("/login", { replace: true });
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="chili-page min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="workspace-eyebrow">{getRoleLabel(currentUser.role)} workspace</p>
            <h1 className="workspace-page-title">Scan history</h1>
            <p className="mt-2 text-sm text-slate-600">Your crop health records and diagnosis notes.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
            >
              Back to scan
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
            >
              Log out
            </button>
          </div>
        </header>

        {error ? (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {entries.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-700">No scans yet</p>
            <p className="mt-2 text-sm text-slate-600">
              Upload a plant image to create your first diagnosis record.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {entries.map((entry) => (
              <article
                key={entry.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-emerald-100/60"
              >
                <img
                  src={entry.imageUrl}
                  alt="Saved chili scan"
                  className="h-48 w-full object-cover"
                />
                <div className="p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        entry.status === "Healthy"
                          ? "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-600/20"
                          : "bg-red-500/15 text-red-700 ring-1 ring-red-600/20"
                      }`}
                    >
                      {entry.status}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-slate-900">
                    {entry.confidence}% confidence
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {entry.summary}
                  </p>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                      Urgency
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {entry.urgency}
                    </p>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                      Next steps
                    </p>
                    <ul className="mt-2 space-y-2 text-sm text-slate-600">
                      {entry.recommendations
                        .slice(0, 3)
                        .map((recommendation) => (
                          <li key={recommendation} className="flex gap-2">
                            <span className="mt-2 h-2 w-2 rounded-full bg-emerald-500" />
                            <span>{recommendation}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
