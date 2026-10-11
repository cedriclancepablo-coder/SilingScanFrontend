import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, verifyDatabaseConnection } from "./db/index.js";
import { users } from "./db/schema/auth.js";
import { hashPassword } from "./password.js";

export const initializeDatabase = async (): Promise<void> => {
  await verifyDatabaseConnection();

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME?.trim() || "SilingScan Administrator";

  if (Boolean(adminEmail) !== Boolean(adminPassword)) {
    throw new Error(
      "Set both ADMIN_EMAIL and ADMIN_PASSWORD to provision a private admin account.",
    );
  }
  if (!adminEmail || !adminPassword) {
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    throw new Error("ADMIN_EMAIL must be a valid email address.");
  }
  if (adminPassword.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  if (existingUser) {
    if (existingUser.role !== "admin") {
      throw new Error(
        "ADMIN_EMAIL already belongs to a non-admin account. Use a separate private admin email.",
      );
    }
    return;
  }

  const password = await hashPassword(adminPassword);
  await db.insert(users).values({
    id: randomUUID(),
    name: adminName,
    email: adminEmail,
    role: "admin",
    ...password,
  });
};
