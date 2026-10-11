import { useEffect, useMemo, useState } from "react";
import { getScanHistory, type ScanHistoryEntry } from "../lib/auth";

const downloadCsv = (entries: ScanHistoryEntry[]) => {
  const columns = ["id", "status", "confidence", "summary", "urgency", "createdAt"];
  const escapeCell = (value: string | number) =>
    `"${String(value).replaceAll('"', '""')}"`;
  const rows = entries.map((entry) =>
    [entry.id, entry.status, entry.confidence, entry.summary, entry.urgency, entry.createdAt]
      .map(escapeCell)
      .join(","),
  );
  const content = [columns.join(","), ...rows].join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "silingscan-research-scans.csv";
  link.click();
  URL.revokeObjectURL(url);
};

const ResearchPage = () => {
  const [scans, setScans] = useState<ScanHistoryEntry[]>([]);
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getScanHistory("")
      .then((entries) => {
        if (active) setScans(entries);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load scan data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const filteredScans = useMemo(
    () => filter === "All" ? scans : scans.filter((scan) => scan.status === filter),
    [filter, scans],
  );
  const diseased = scans.filter((scan) => scan.status === "Diseased").length;
  const healthy = scans.filter((scan) => scan.status === "Healthy").length;
  const averageConfidence = scans.length
    ? Math.round(scans.reduce((sum, scan) => sum + scan.confidence, 0) / scans.length)
    : 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-7 pb-12">
      <header className="workspace-hero workspace-hero--research">
        <div>
          <p className="workspace-eyebrow">Researcher workspace</p>
          <h1>Crop health observatory</h1>
          <p>Review the shared SilingScan dataset, spot patterns, and export records for analysis.</p>
        </div>
        <button className="workspace-button workspace-button--light" disabled={!filteredScans.length} onClick={() => downloadCsv(filteredScans)} type="button">
          Export filtered CSV
        </button>
      </header>

      {error ? <p className="workspace-error" role="alert">{error}</p> : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="workspace-stat"><span>Total observations</span><strong>{scans.length}</strong><small>Across all farmer accounts</small></article>
        <article className="workspace-stat"><span>Healthy records</span><strong>{healthy}</strong><small>Confirmed healthy scans</small></article>
        <article className="workspace-stat workspace-stat--red"><span>Disease flags</span><strong>{diseased}</strong><small>Records for follow-up</small></article>
        <article className="workspace-stat"><span>Mean confidence</span><strong>{averageConfidence}%</strong><small>Across available predictions</small></article>
      </section>

      <section className="workspace-card">
        <div className="workspace-section-heading">
          <div>
            <p className="workspace-eyebrow">Dataset</p>
            <h2>Scan records</h2>
          </div>
          <label className="workspace-filter">
            <span className="sr-only">Filter scans by status</span>
            <select className="workspace-input" value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option>All</option><option>Healthy</option><option>Diseased</option>
            </select>
          </label>
        </div>
        {loading ? <div className="workspace-empty">Loading shared records…</div> : filteredScans.length === 0 ? (
          <div className="workspace-empty">
            <span aria-hidden="true">🔬</span>
            <h3>No observations yet</h3>
            <p>When the trained detection model is connected, completed scans will appear here for analysis.</p>
          </div>
        ) : (
          <div className="workspace-table-wrap">
            <table className="workspace-table">
              <thead><tr><th>Result</th><th>Confidence</th><th>Urgency</th><th>Summary</th><th>Date</th></tr></thead>
              <tbody>{filteredScans.map((scan) => (
                <tr key={scan.id}>
                  <td><span className={`workspace-status ${scan.status === "Healthy" ? "workspace-status--healthy" : "workspace-status--diseased"}`}>{scan.status}</span></td>
                  <td>{scan.confidence}%</td><td>{scan.urgency}</td>
                  <td className="workspace-table__summary">{scan.summary}</td>
                  <td>{new Date(scan.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default ResearchPage;
