import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import {
  getCurrentUser,
  getDefaultRouteForRole,
  getRoleLabel,
  signUpUser,
  type UserRole,
} from "../lib/auth";

const roleOptions: UserRole[] = ["farmer", "researcher", "agriculturist"];

const SignupPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("farmer");
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
      const user = await signUpUser(name, email, password, role);
      navigate(getDefaultRouteForRole(user.role), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Account creation failed.");
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
            <h1>Grow better, one healthy plant at a time.</h1>
            <p>
              Create your account to keep your siling labuyo checks and crop
              records close at hand.
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
            <span className="chili-auth__eyebrow">Join SilingScan</span>
            <h2>Create account</h2>
            <p>Set up your account to get started.</p>
          </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="chili-auth__label">
              Full name
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="chili-auth__input"
              placeholder="Juan Dela Cruz"
              required
            />
          </div>

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
              Account role
            </label>
            <div className="grid gap-2 sm:grid-cols-3">
              {roleOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRole(option)}
                  className={`chili-auth__role ${
                    role === option
                      ? "chili-auth__role--selected"
                      : ""
                  }`}
                >
                  {getRoleLabel(option)}
                </button>
              ))}
            </div>
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
              placeholder="Create a password"
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
            {isSubmitting ? "Creating account..." : "Sign up"}
          </button>
        </form>

          <p className="chili-auth__switch">
            Already have an account?{" "}
            <button type="button" onClick={() => navigate("/login")}>
              Log in
            </button>
          </p>
        </div>
      </section>
    </main>
  );
};

export default SignupPage;
