import { useEffect, useState } from "react";
import { ArrowUpRight, Sprout } from "lucide-react";
import { useNavigate } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import type { ScanResult } from "../lib/scan";

type StoredResult = {
  imageUrl: string;
  result: ScanResult;
};

type CareStatus = "Urgent" | "In progress" | "Scheduled" | "Done";
type Severity = "Severe" | "Moderate" | "Mild" | "Healthy";
type StatusFilter = "All" | CareStatus;

type CarePlanRow = {
  plant: string;
  disease: string;
  severity: Severity;
  instructions: string;
  frequency: string;
  nextDue: string;
  status: CareStatus;
};

const sampleCarePlan: CarePlanRow[] = [
  {
    plant: "Bed A - Siling Labuyo",
    disease: "Anthracnose",
    severity: "Severe",
    instructions:
      "Remove and bag infected fruit. Apply a fungicide labeled for chili, following the label.",
    frequency: "Every 7 days",
    nextDue: "14 Oct 2026",
    status: "Urgent",
  },
  {
    plant: "Bed A - Siling Labuyo",
    disease: "Bacterial leaf spot",
    severity: "Moderate",
    instructions:
      "Water at the base only. Avoid touching wet plants. Disinfect pruning tools.",
    frequency: "Daily check",
    nextDue: "15 Oct 2026",
    status: "In progress",
  },
  {
    plant: "Bed B - Siling Haba",
    disease: "Leaf curl",
    severity: "Mild",
    instructions:
      "Inspect the underside of leaves for mites and whiteflies. Spray with neem oil in the evening.",
    frequency: "Every 5 days",
    nextDue: "16 Oct 2026",
    status: "Scheduled",
  },
  {
    plant: "Bed B - Siling Haba",
    disease: "Cercospora leaf spot",
    severity: "Mild",
    instructions:
      "Prune lower leaves to improve airflow and clear fallen leaves around the plant.",
    frequency: "Once",
    nextDue: "12 Oct 2026",
    status: "Done",
  },
  {
    plant: "Bed C - Siling Labuyo",
    disease: "Powdery mildew",
    severity: "Moderate",
    instructions:
      "Space plants wider. Apply sulfur-based spray if humidity stays high.",
    frequency: "Every 10 days",
    nextDue: "18 Oct 2026",
    status: "Scheduled",
  },
];

const summaryStatuses: CareStatus[] = [
  "Urgent",
  "In progress",
  "Scheduled",
  "Done",
];

const statusFilters: StatusFilter[] = ["All", ...summaryStatuses];

const isStoredResult = (value: unknown): value is StoredResult => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const stored = value as Record<string, unknown>;
  if (
    typeof stored.imageUrl !== "string" ||
    typeof stored.result !== "object" ||
    stored.result === null
  ) {
    return false;
  }

  const result = stored.result as Record<string, unknown>;
  return (
    (result.status === "Healthy" || result.status === "Diseased") &&
    typeof result.confidence === "number" &&
    typeof result.summary === "string" &&
    typeof result.urgency === "string" &&
    Array.isArray(result.recommendations) &&
    result.recommendations.every((item) => typeof item === "string")
  );
};

const getScanCarePlan = (scan: StoredResult): CarePlanRow[] => {
  const healthy = scan.result.status === "Healthy";
  const urgency = scan.result.urgency.toLowerCase();
  const severity: Severity = healthy
    ? "Healthy"
    : urgency.includes("high") || urgency.includes("severe")
      ? "Severe"
      : urgency.includes("medium") || urgency.includes("moderate")
        ? "Moderate"
        : "Mild";

  return [
    {
      plant: "Scanned plant - Siling Labuyo",
      disease: healthy ? "No disease detected" : "Needs attention",
      severity,
      instructions:
        scan.result.recommendations.join(" ") || scan.result.summary,
      frequency: "Follow scan guidance",
      nextDue: "After next check",
      status: "Scheduled",
    },
  ];
};

const statusStyles: Record<CareStatus, string> = {
  Urgent: "bg-red-100 text-red-800",
  "In progress": "bg-amber-100 text-amber-900",
  Scheduled: "bg-sky-100 text-sky-800",
  Done: "bg-emerald-100 text-emerald-800",
};

const severityStyles: Record<Severity, string> = {
  Severe: "bg-red-500",
  Moderate: "bg-amber-500",
  Mild: "bg-emerald-500",
  Healthy: "bg-emerald-500",
};

const statusCardStyles: Record<
  CareStatus,
  { card: string; count: string; dot: string; hint: string }
> = {
  Urgent: {
    card: "border-rose-200 bg-gradient-to-br from-rose-50 to-white",
    count: "text-rose-800",
    dot: "bg-rose-500",
    hint: "Needs attention",
  },
  "In progress": {
    card: "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
    count: "text-amber-800",
    dot: "bg-amber-500",
    hint: "Being handled",
  },
  Scheduled: {
    card: "border-sky-200 bg-gradient-to-br from-sky-50 to-white",
    count: "text-sky-800",
    dot: "bg-sky-500",
    hint: "Upcoming check",
  },
  Done: {
    card: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
    count: "text-emerald-800",
    dot: "bg-emerald-500",
    hint: "Completed",
  },
};

const GuidancePage = () => {
  const navigate = useNavigate();
  const [scan, setScan] = useState<StoredResult | null>(null);
  const [loadError, setLoadError] = useState("");
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("All");

  useEffect(() => {
    const stored = sessionStorage.getItem("silingScanResult");

    if (!stored) {
      return;
    }

    try {
      const parsed: unknown = JSON.parse(stored);
      if (!isStoredResult(parsed)) {
        throw new Error("Saved scan data is incomplete.");
      }
      setScan(parsed);
    } catch {
      sessionStorage.removeItem("silingScanResult");
      setLoadError(
        "Saved scan data could not be read. Sample care plan data is shown.",
      );
    }
  }, []);

  const carePlan = scan ? getScanCarePlan(scan) : sampleCarePlan;
  const visibleRows =
    activeFilter === "All"
      ? carePlan
      : carePlan.filter((row) => row.status === activeFilter);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 pb-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-800 shadow-sm shadow-emerald-900/5">
            <Sprout aria-hidden="true" size={24} strokeWidth={1.8} />
          </span>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-emerald-800">
              SilingScan · Field care
            </p>
            <h1 className="mt-0.5 font-serif text-3xl font-bold tracking-tight text-stone-900">
              Care plan
            </h1>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-800 bg-emerald-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-900"
        >
          Scan a plant
          <ArrowUpRight aria-hidden="true" size={16} />
        </button>
      </header>

      {loadError ? (
        <p className="workspace-error" role="alert">
          {loadError}
        </p>
      ) : null}

      <div
        className="flex items-center gap-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/80 px-4 py-3 text-xs leading-5 text-emerald-950 shadow-sm shadow-emerald-900/[0.025]"
        role="note"
      >
        <span
          aria-hidden="true"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 font-serif text-sm font-bold text-emerald-800"
        >
          i
        </span>
        <p>
          {scan ? (
            <>
              <strong className="font-bold">Based on your latest scan.</strong>{" "}
              Follow product labels and local agricultural guidance.
            </>
          ) : (
            <>
              <strong className="font-bold">Sample data shown.</strong> Your
              real care plan will appear here after a scan is diagnosed by the
              SilingScan model.
            </>
          )}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-2.5">
        {summaryStatuses.map((status) => {
          const count = carePlan.filter((row) => row.status === status).length;
          const styles = statusCardStyles[status];
          return (
            <div
              key={status}
              className={`rounded-xl border px-4 py-3 shadow-sm shadow-stone-900/[0.025] transition-transform hover:-translate-y-0.5 ${styles.card}`}
            >
              <div className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-2 text-xs font-medium text-stone-600">
                  <span
                    aria-hidden="true"
                    className={`h-2 w-2 rounded-full ${styles.dot}`}
                  />
                  {status}
                </dt>
                <dd
                  className={`font-serif text-2xl font-bold leading-6 ${styles.count}`}
                >
                  {count}
                </dd>
              </div>
              <p className="mt-1.5 text-[11px] text-stone-500">{styles.hint}</p>
            </div>
          );
        })}
      </dl>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-lg font-bold text-stone-900">
              Care tasks
            </h2>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600">
              {visibleRows.length} of {carePlan.length}
            </span>
          </div>
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone-400">
            Filter by status
          </span>
        </div>
        <div
          className="flex flex-wrap gap-1.5"
          aria-label="Filter care plan by status"
        >
          {statusFilters.map((status) => (
            <button
              key={status}
              type="button"
              aria-pressed={activeFilter === status}
              onClick={() => setActiveFilter(status)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                activeFilter === status
                  ? "border-stone-900 bg-stone-900 text-white shadow-sm shadow-stone-900/15"
                  : "border-stone-300 bg-white text-stone-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-900/[0.04]">
        <Table
          aria-label="Care plan for chili plants"
          className="min-w-[880px] table-fixed text-xs"
        >
          <TableHeader>
            <TableRow className="bg-stone-100 hover:bg-stone-100">
              <TableHead className="w-[14%] px-3 py-2.5 font-medium text-stone-600">
                Plant
              </TableHead>
              <TableHead className="w-[15%] px-3 py-2.5 font-medium text-stone-600">
                Disease
              </TableHead>
              <TableHead className="w-[11%] px-3 py-2.5 font-medium text-stone-600">
                Severity
              </TableHead>
              <TableHead className="w-[25%] px-3 py-2.5 font-medium text-stone-600">
                What to do
              </TableHead>
              <TableHead className="w-[12%] px-3 py-2.5 font-medium text-stone-600">
                How often
              </TableHead>
              <TableHead className="w-[12%] px-3 py-2.5 font-medium text-stone-600">
                Next due
              </TableHead>
              <TableHead className="w-[11%] px-3 py-2.5 font-medium text-stone-600">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.length > 0 ? (
              visibleRows.map((row) => (
                <TableRow
                  key={`${row.plant}-${row.disease}`}
                  className="align-top hover:bg-emerald-50/35"
                >
                  <TableCell className="whitespace-normal px-3 py-3 font-medium leading-4 text-stone-800">
                    {row.plant}
                  </TableCell>
                  <TableCell className="whitespace-normal px-3 py-3 leading-4 text-stone-800">
                    {row.disease}
                  </TableCell>
                  <TableCell className="px-3 py-3 text-stone-800">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className={`h-2 w-2 shrink-0 rounded-full ${severityStyles[row.severity]}`}
                      />
                      {row.severity}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-normal px-3 py-3 leading-4 text-stone-700">
                    {row.instructions}
                  </TableCell>
                  <TableCell className="whitespace-normal px-3 py-3 leading-4 text-stone-700">
                    {row.frequency}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-stone-700">
                    {row.nextDue}
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium leading-4 ${statusStyles[row.status]}`}
                    >
                      {row.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="whitespace-normal px-4 py-8 text-center text-stone-500"
                >
                  No care plan items with this status.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>

      <p className="text-[11px] leading-5 text-stone-500">
        Treatment notes are general guidance. Always follow product labels and
        local agriculture office advice.
      </p>
    </div>
  );
};

export default GuidancePage;
