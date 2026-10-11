import { useEffect, useState, type FormEvent } from "react";
import { apiRequest } from "../lib/api";
import { getCurrentUser, getRoleLabel } from "../lib/auth";

type Advisory = {
  id: string;
  title: string;
  category: string;
  crop: string;
  body: string;
  authorId: string;
  createdAt: string;
};

const categories = ["Pest", "Disease", "Growing", "Weather"];

const AdvisoriesPage = () => {
  const user = getCurrentUser();
  const canPublish = user?.role === "agriculturist" || user?.role === "researcher" || user?.role === "admin";
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [title, setTitle] = useState("");
  const [crop, setCrop] = useState("Siling labuyo");
  const [category, setCategory] = useState(categories[0]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void apiRequest<Advisory[]>("/advisories")
      .then((items) => { if (active) setAdvisories(items); })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Unable to load advisories."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const publish = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const created = await apiRequest<Advisory>("/advisories", {
        method: "POST",
        body: JSON.stringify({ title, crop, category, body }),
      });
      setAdvisories((items) => [created, ...items]);
      setTitle("");
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to publish advisory.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-7 pb-12">
      <header className="workspace-hero workspace-hero--advisory">
        <div>
          <p className="workspace-eyebrow">{getRoleLabel(user?.role ?? "farmer")} workspace</p>
          <h1>Field notes & advisories</h1>
          <p>Practical, shared guidance for growing siling labuyo through changing field conditions.</p>
        </div>
        <span className="workspace-hero__stamp" aria-hidden="true">🌿</span>
      </header>

      {error ? <p className="workspace-error" role="alert">{error}</p> : null}
      <div className={`grid gap-6 ${canPublish ? "lg:grid-cols-[0.8fr_1.2fr]" : ""}`}>
        {canPublish ? (
          <section className="workspace-card h-fit">
            <div className="workspace-card__heading">
              <div><p className="workspace-eyebrow">Specialist tools</p><h2>Publish field guidance</h2></div>
              <span className="workspace-card__icon" aria-hidden="true">✎</span>
            </div>
            <form className="mt-5 space-y-4" onSubmit={publish}>
              <label className="workspace-label">Headline<input className="workspace-input" maxLength={140} required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Watch for leaf spot after heavy rain" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="workspace-label">Category<select className="workspace-input" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label className="workspace-label">Crop<input className="workspace-input" maxLength={80} required value={crop} onChange={(event) => setCrop(event.target.value)} /></label>
              </div>
              <label className="workspace-label">Guidance<textarea className="workspace-input min-h-36 resize-y" maxLength={5000} required value={body} onChange={(event) => setBody(event.target.value)} placeholder="Share practical steps and observations for growers…" /></label>
              <button className="workspace-button" disabled={saving} type="submit">{saving ? "Publishing…" : "Publish advisory"}</button>
            </form>
          </section>
        ) : null}

        <section className="space-y-4">
          <div className="workspace-section-heading">
            <div><p className="workspace-eyebrow">Shared library</p><h2>Latest advisories <span className="workspace-count">{advisories.length}</span></h2></div>
          </div>
          {loading ? <div className="workspace-empty">Loading field guidance…</div> : advisories.length === 0 ? (
            <div className="workspace-empty"><span aria-hidden="true">📒</span><h3>The field library is ready</h3><p>Specialists can publish crop guidance here for growers to reference.</p></div>
          ) : advisories.map((item) => (
            <article className="workspace-advisory" key={item.id}>
              <div className="workspace-advisory__meta"><span>{item.category}</span><span>{item.crop}</span><time>{new Date(item.createdAt).toLocaleDateString()}</time></div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
};

export default AdvisoriesPage;
