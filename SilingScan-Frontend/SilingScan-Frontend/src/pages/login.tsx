import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import {
  getCurrentUser,
  getDefaultRouteForRole,
  loginUser,
} from "../lib/auth";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (currentUser) {
      navigate(getDefaultRouteForRole(currentUser.role), { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const user = await loginUser(email, password);
      navigate(getDefaultRouteForRole(user.role), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="chili-auth">
      <section className="chili-auth__card">
        <aside className="chili-auth__brand">
          <div className="chili-auth__brand-copy">
            <span className="chili-auth__eyebrow">SilingScan</span>
            <h1>Healthy plants start with a closer look.</h1>
            <p>
              A little care goes a long way. Keep your siling labuyo growing
              strong with thoughtful crop checks.
            </p>
          </div>
          <span className="chili-auth__pepper" aria-hidden="true">
            🌶️
          </span>
          <span className="chili-auth__brand-caption">
            Rooted in care. Ready to grow.
          </span>
        </aside>

        <div className="chili-auth__content">
          <div className="chili-auth__heading">
            <span className="chili-auth__eyebrow">Welcome back</span>
            <h2>Log in</h2>
            <p>Sign in to continue caring for your crop.</p>
          </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="chili-auth__label">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="chili-auth__input"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="chili-auth__label">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="chili-auth__input"
              placeholder="••••••••"
              required
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="chili-auth__submit"
          >
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </form>

          <p className="chili-auth__switch">
            Don’t have an account?{" "}
            <button type="button" onClick={() => navigate("/signup")}>
              Create one
            </button>
          </p>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
