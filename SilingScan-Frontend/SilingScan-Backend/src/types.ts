export const userRoles = [
  "farmer",
  "researcher",
  "agriculturist",
  "admin",
] as const;

export type UserRole = (typeof userRoles)[number];

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type ScanResult = {
  status: "Healthy" | "Diseased";
  confidence: number;
  summary: string;
  urgency: string;
  recommendations: string[];
};

export type ScanHistoryEntry = ScanResult & {
  id: string;
  imageUrl: string;
  createdAt: string;
};
