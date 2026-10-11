import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { db } from "./db/index.js";
import { sessions, users } from "./db/schema/index.js";
import { hashPassword, verifyPassword } from "./password.js";
import type { PublicUser, UserRole } from "./types.js";

const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const signupRoles = ["farmer", "researcher", "agriculturist"] as const;
type SignupRole = (typeof signupRoles)[number];
const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

declare global {
  namespace Express {
    interface Request {
      authUser?: PublicUser;
    }
  }
}

export const toPublicUser = (user: typeof users.$inferSelect): PublicUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const isUserRole = (value: unknown): value is SignupRole =>
  typeof value === "string" &&
  (signupRoles as readonly string[]).includes(value);

const validateCredentials = (
  name: unknown,
  email: unknown,
  password: unknown,
): { name: string; email: string; password: string } => {
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new ApiError(400, "Enter a valid email address.");
  }
  if (typeof password !== "string" || password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters.");
  }

  const trimmedName = typeof name === "string" ? name.trim() : "";
  if (trimmedName.length > 100) {
    throw new ApiError(400, "Name must be 100 characters or fewer.");
  }

  return {
    name: trimmedName,
    email: email.trim().toLowerCase(),
    password,
  };
};

const createSession = async (user: typeof users.$inferSelect) => {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);

  await db.insert(sessions).values({ tokenHash, userId: user.id, expiresAt });

  return { token, user: toPublicUser(user) };
};

export const signUp = async (
  nameInput: unknown,
  emailInput: unknown,
  passwordInput: unknown,
  roleInput: unknown,
) => {
  const { name, email, password } = validateCredentials(
    nameInput,
    emailInput,
    passwordInput,
  );
  if (!name) {
    throw new ApiError(400, "Name, email, and password are required.");
  }
  if (!isUserRole(roleInput)) {
    throw new ApiError(400, "Choose a valid account role.");
  }

  const credentials = await hashPassword(password);
  try {
    const [user] = await db
      .insert(users)
      .values({
        id: randomUUID(),
        name,
        email,
        role: roleInput as SignupRole,
        ...credentials,
      })
      .returning();
    if (!user) {
      throw new Error("Database did not return the newly created account.");
    }
    return createSession(user);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw new ApiError(409, "An account with this email already exists.");
    }
    throw error;
  }
};

export const logIn = async (emailInput: unknown, passwordInput: unknown) => {
  if (typeof emailInput !== "string" || typeof passwordInput !== "string") {
    throw new ApiError(400, "Email and password are required.");
  }

  const email = emailInput.trim().toLowerCase();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (
    !user ||
    !(await verifyPassword(
      passwordInput,
      user.passwordHash,
      user.passwordSalt,
    ))
  ) {
    throw new ApiError(401, "Incorrect email or password.");
  }

  return createSession(user);
};

export const requireAuth = async (
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authorization = request.header("authorization");
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) {
      throw new ApiError(401, "Please log in to continue.");
    }

    const tokenHash = hashToken(token);
    const [session] = await db
      .select({ userId: sessions.userId })
      .from(sessions)
      .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date())))
      .limit(1);
    if (!session) {
      throw new ApiError(401, "Your session has expired. Please log in again.");
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);
    if (!user) {
      throw new ApiError(401, "Your session is invalid. Please log in again.");
    }

    request.authUser = toPublicUser(user);
    next();
  } catch (error) {
    next(error);
  }
};

export const revokeSession = async (request: Request): Promise<void> => {
  const token = request.header("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    return;
  }

  const tokenHash = hashToken(token);
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
};

export const requireUploadRole = (
  request: Request,
  _response: Response,
  next: NextFunction,
): void => {
  if (request.authUser?.role === "agriculturist") {
    next(new ApiError(403, "Agriculturists are not allowed to upload images."));
    return;
  }

  next();
};

export const requireStaffRole = (
  request: Request,
  _response: Response,
  next: NextFunction,
): void => {
  if (
    request.authUser?.role !== "researcher" &&
    request.authUser?.role !== "agriculturist" &&
    request.authUser?.role !== "admin"
  ) {
    next(new ApiError(403, "Only crop specialists can publish advisories."));
    return;
  }
  next();
};

export const requireAdminRole = (
  request: Request,
  _response: Response,
  next: NextFunction,
): void => {
  if (request.authUser?.role !== "admin") {
    next(new ApiError(403, "Administrator access is required."));
    return;
  }
  next();
};
