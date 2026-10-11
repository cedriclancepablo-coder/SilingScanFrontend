import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import { getRoleLabel, type UserRole } from "../lib/auth";

type Account = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

const manageableRoles: UserRole[] = ["farmer", "researcher", "agriculturist"];

const AdminPage = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");

  useEffect(() => {
    let active = true;
    void apiRequest<Account[]>("/admin/users")
      .then((items) => { if (active) setAccounts(items); })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Unable to load accounts."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const changeRole = async (account: Account, role: UserRole) => {
    setUpdatingId(account.id);
    setError("");
    try {
      const updated = await apiRequest<Account>(`/admin/users/${encodeURIComponent(account.id)}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      setAccounts((items) => items.map((item) => item.id === updated.id ? updated : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update account role.");
    } finally {
      setUpdatingId("");
    }
  };

  const roleCounts = manageableRoles.map((role) => ({
    role,
    count: accounts.filter((account) => account.role === role).length,
  }));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-7 pb-12">
      <header className="workspace-hero workspace-hero--admin">
        <div>
          <p className="workspace-eyebrow">Private administrator workspace</p>
          <h1>People & access</h1>
          <p>Manage account roles for your SilingScan team. Admin access is never available through public signup.</p>
        </div>
        <span className="workspace-hero__stamp" aria-hidden="true">🔐</span>
      </header>

      {error ? <p className="workspace-error" role="alert">{error}</p> : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="workspace-stat"><span>Total accounts</span><strong>{accounts.length}</strong><small>All registered users</small></article>
        {roleCounts.map(({ role, count }) => <article className="workspace-stat" key={role}><span>{getRoleLabel(role)} accounts</span><strong>{count}</strong><small>Current assigned role</small></article>)}
      </section>

      <section className="workspace-card">
        <div className="workspace-section-heading">
          <div><p className="workspace-eyebrow">Account directory</p><h2>Registered accounts</h2></div>
          <span className="workspace-count">{accounts.length} total</span>
        </div>
        {loading ? <div className="workspace-empty">Loading accounts…</div> : accounts.length === 0 ? (
          <div className="workspace-empty"><h3>No accounts found</h3><p>New user signups will appear here.</p></div>
        ) : (
          <div className="workspace-table-wrap">
            <table className="workspace-table">
              <thead><tr><th>Name</th><th>Email</th><th>Created</th><th>Access role</th></tr></thead>
              <tbody>{accounts.map((account) => (
                <tr key={account.id}>
                  <td className="font-semibold text-slate-800">{account.name}</td>
                  <td>{account.email}</td>
                  <td>{new Date(account.createdAt).toLocaleDateString()}</td>
                  <td>{account.role === "admin" ? <span className="workspace-status workspace-status--admin">Administrator</span> : (
                    <select aria-label={`Role for ${account.email}`} className="workspace-input workspace-role-select" disabled={updatingId === account.id} value={account.role} onChange={(event) => void changeRole(account, event.target.value as UserRole)}>
                      {manageableRoles.map((role) => <option key={role} value={role}>{getRoleLabel(role)}</option>)}
                    </select>
                  )}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminPage;
