import { useEffect, useState, type FormEvent } from "react";
import { apiRequest } from "../lib/api";
import { getCurrentUser } from "../lib/auth";

type CropRecord = {
  id: string;
  name: string;
  variety: string;
  location: string;
  plantedAt: string | null;
  notes: string;
  createdAt: string;
};

const plantingMethods = [
  "Papunlaan (Seedbed)",
  "Taniman / Kamada (Raised Planting Beds)",
  "Bambang (Furrows/Trenches)",
  "Tudling (Rows)",
] as const;

const chiliVarieties = [
  "Siling Labuyo (True Native)",
  "Siling Tingala / Pinatubo / Siling Taiwan",
  "Siling Haba / Siling Panigang",
  "Siling Lara / Kampana",
] as const;

const CropsPage = () => {
  const user = getCurrentUser();
  const [records, setRecords] = useState<CropRecord[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [plantingMethod, setPlantingMethod] = useState("");
  const [customName, setCustomName] = useState("");
  const [variety, setVariety] = useState("");
  const [customVariety, setCustomVariety] = useState("");
  const [location, setLocation] = useState("");
  const [plantedAt, setPlantedAt] = useState("");
  const [notes, setNotes] = useState("");

  const loadCrops = async () => {
    try {
      setRecords(await apiRequest<CropRecord[]>("/crops"));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load crop records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCrops();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    const name = plantingMethod === "other" ? customName.trim() : plantingMethod;
    const selectedVariety = variety === "other" ? customVariety.trim() : variety;
    try {
      const record = await apiRequest<CropRecord>("/crops", {
        method: "POST",
        body: JSON.stringify({ name, variety: selectedVariety, location, plantedAt, notes }),
      });
      setRecords((previous) => [record, ...previous]);
      setPlantingMethod("");
      setCustomName("");
      setVariety("");
      setCustomVariety("");
      setLocation("");
      setPlantedAt("");
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save this crop.");
    } finally {
      setIsSaving(false);
    }
  };

  const removeCrop = async (id: string) => {
    setError("");
    try {
      await apiRequest<void>(`/crops/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      setRecords((previous) => previous.filter((record) => record.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove this crop.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-7 pb-12">
      <header className="workspace-hero">
        <div>
          <p className="workspace-eyebrow">Farmer workspace</p>
          <h1>My chili garden</h1>
          <p>Keep your siling labuyo beds, planting dates, and field notes together.</p>
        </div>
        <span className="workspace-hero__stamp" aria-hidden="true">🌱</span>
      </header>

      {error ? <p className="workspace-error" role="alert">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="workspace-card h-fit">
          <div className="workspace-card__heading">
            <div>
              <p className="workspace-eyebrow">Field notes</p>
              <h2>Add a crop record</h2>
            </div>
            <span className="workspace-card__icon" aria-hidden="true">＋</span>
          </div>
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <label className="workspace-label">
              Bed or crop name
              <select
                className="workspace-input"
                required
                value={plantingMethod}
                onChange={(event) => setPlantingMethod(event.target.value)}
              >
                <option value="" disabled>Choose a planting method</option>
                {plantingMethods.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
                <option value="other">Other (specify)</option>
              </select>
            </label>
            {plantingMethod === "other" ? (
              <label className="workspace-label">
                Specify bed or crop name
                <input
                  className="workspace-input"
                  maxLength={100}
                  required
                  value={customName}
                  onChange={(event) => setCustomName(event.target.value)}
                  placeholder="Enter another planting method"
                />
              </label>
            ) : null}
            <label className="workspace-label">
              Siling labuyo variety
              <select
                className="workspace-input"
                required
                value={variety}
                onChange={(event) => setVariety(event.target.value)}
              >
                <option value="" disabled>Choose a siling variety</option>
                {chiliVarieties.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
                <option value="other">Other (specify)</option>
              </select>
            </label>
            {variety === "other" ? (
              <label className="workspace-label">
                Specify siling labuyo variety
                <input
                  className="workspace-input"
                  maxLength={100}
                  required
                  value={customVariety}
                  onChange={(event) => setCustomVariety(event.target.value)}
                  placeholder="Enter another variety"
                />
              </label>
            ) : null}
            <label className="workspace-label">
              Location
              <input className="workspace-input" maxLength={160} required value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Barangay or field location" />
            </label>
            <label className="workspace-label">
              Planting date
              <input className="workspace-input" type="date" value={plantedAt} onChange={(event) => setPlantedAt(event.target.value)} />
            </label>
            <label className="workspace-label">
              Notes
              <textarea className="workspace-input min-h-24 resize-y" maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Watering, weather, or observations…" />
            </label>
            <button className="workspace-button" disabled={isSaving} type="submit">
              {isSaving ? "Saving crop…" : "Save crop record"}
            </button>
          </form>
        </section>

        <section className="space-y-4">
          <div className="workspace-section-heading">
            <div>
              <p className="workspace-eyebrow">Your records</p>
              <h2>Growing list <span className="workspace-count">{records.length}</span></h2>
            </div>
          </div>
          {isLoading ? (
            <div className="workspace-empty">Loading your garden…</div>
          ) : records.length === 0 ? (
            <div className="workspace-empty">
              <span aria-hidden="true">🌿</span>
              <h3>Your garden starts here</h3>
              <p>Add your first crop record to keep planting notes in one place.</p>
            </div>
          ) : records.map((record) => (
            <article className="workspace-record" key={record.id}>
              <div className="workspace-record__top">
                <span className="workspace-record__icon" aria-hidden="true">🌶</span>
                <div className="min-w-0 flex-1">
                  <h3>{record.name}</h3>
                  <p>{record.variety} · {record.location}</p>
                </div>
                <button className="workspace-text-button" onClick={() => void removeCrop(record.id)} type="button">Remove</button>
              </div>
              <div className="workspace-record__details">
                <span>Planted {record.plantedAt ? new Date(record.plantedAt).toLocaleDateString() : "date not set"}</span>
                <span>Added {new Date(record.createdAt).toLocaleDateString()}</span>
              </div>
              {record.notes ? <p className="workspace-record__notes">{record.notes}</p> : null}
            </article>
          ))}
        </section>
      </div>
      <p className="sr-only">Signed in as {user?.name ?? "farmer"}.</p>
    </div>
  );
};

export default CropsPage;
