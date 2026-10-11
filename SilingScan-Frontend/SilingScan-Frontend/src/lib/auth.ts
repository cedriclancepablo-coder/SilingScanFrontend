import {
  apiRequest,
  clearSessionToken,
  getSessionToken,
  setSessionToken,
} from "./api";

const CURRENT_USER_KEY = "siling-scan-current-user";

export const USER_ROLES = [
  "farmer",
  "researcher",
  "agriculturist",
  "admin",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type ScanHistoryEntry = {
  id: string;
  imageUrl: string;
  status: "Healthy" | "Diseased";
  confidence: number;
  summary: string;
  urgency: string;
  recommendations: string[];
  createdAt: string;
};

type SessionResponse = {
  token: string;
  user: CurrentUser;
};

const isUserRole = (value: unknown): value is UserRole =>
  typeof value === "string" &&
  USER_ROLES.includes(value as UserRole);

const registrationRoles: UserRole[] = ["farmer", "researcher", "agriculturist"];

const isCurrentUser = (value: unknown): value is CurrentUser => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return (
    "id" in value &&
    typeof value.id === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "email" in value &&
    typeof value.email === "string" &&
    "role" in value &&
    isUserRole(value.role)
  );
};

const saveSession = (session: SessionResponse): CurrentUser => {
  setSessionToken(session.token);
  window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(session.user));
  return session.user;
};

export const getRoleLabel = (role: UserRole): string => {
  const labels: Record<UserRole, string> = {
    farmer: "Farmer",
    researcher: "Researcher",
    agriculturist: "Agriculturist",
    admin: "Administrator",
  };

  return labels[role];
};

export const getDefaultRouteForRole = (role: UserRole): string => {
  const routes: Record<UserRole, string> = {
    farmer: "/",
    researcher: "/research",
    agriculturist: "/advisories",
    admin: "/admin",
  };
  return routes[role];
};

export const canAccessPath = (role: UserRole, pathname: string): boolean => {
  const authorizedPaths: Record<UserRole, string[]> = {
    farmer: ["/", "/crops", "/history", "/result", "/guidance", "/advisories"],
    researcher: ["/", "/research", "/history", "/result", "/guidance", "/advisories"],
    agriculturist: ["/advisories", "/history"],
    admin: ["/admin", "/history", "/advisories"],
  };

  return authorizedPaths[role].includes(pathname);
};

export const getCurrentUser = (): CurrentUser | null => {
  const storedUser = window.localStorage.getItem(CURRENT_USER_KEY);
  if (!storedUser || !getSessionToken()) {
    window.localStorage.removeItem(CURRENT_USER_KEY);
    clearSessionToken();
    return null;
  }

  try {
    const user: unknown = JSON.parse(storedUser);
    if (isCurrentUser(user)) {
      return user;
    }
  } catch {
    window.localStorage.removeItem(CURRENT_USER_KEY);
    clearSessionToken();
    return null;
  }

  window.localStorage.removeItem(CURRENT_USER_KEY);
  clearSessionToken();
  return null;
};

export const loginUser = async (
  email: string,
  password: string,
): Promise<CurrentUser> => {
  if (!email.trim() || !password) {
    throw new Error("Email and password are required.");
  }

  const session = await apiRequest<SessionResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return saveSession(session);
};

export const signUpUser = async (
  name: string,
  email: string,
  password: string,
  role: UserRole = "farmer",
): Promise<CurrentUser> => {
  if (!name.trim() || !email.trim() || !password) {
    throw new Error("Name, email, and password are required.");
  }
  if (!registrationRoles.includes(role)) {
    throw new Error("Administrator accounts cannot be created through signup.");
  }

  const session = await apiRequest<SessionResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password, role }),
  });
  return saveSession(session);
};

export const logoutUser = async (): Promise<void> => {
  try {
    if (getSessionToken()) {
      await apiRequest<void>("/auth/logout", { method: "POST" });
    }
  } finally {
    window.localStorage.removeItem(CURRENT_USER_KEY);
    clearSessionToken();
    sessionStorage.removeItem("silingScanResult");
  }
};

export const getScanHistory = async (
  _userId: string,
): Promise<ScanHistoryEntry[]> =>
  apiRequest<ScanHistoryEntry[]>("/scans");
