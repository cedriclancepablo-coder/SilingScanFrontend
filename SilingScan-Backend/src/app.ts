import "dotenv/config";
import { randomUUID } from "node:crypto";
import express, { type ErrorRequestHandler } from "express";
import multer from "multer";
import { and, desc, eq, ne } from "drizzle-orm";
import {
  ApiError,
  logIn,
  requireAdminRole,
  requireAuth,
  requireStaffRole,
  requireUploadRole,
  revokeSession,
  signUp,
} from "./auth.js";
import { db } from "./db/index.js";
import { advisories } from "./db/schema/advisories.js";
import { crops } from "./db/schema/crops.js";
import { users } from "./db/schema/auth.js";
import { scans } from "./db/schema/scans.js";
import { analyzePepperImage } from "./model.js";
import type { PublicUser, ScanHistoryEntry } from "./types.js";

const maximumImageSize = 5 * 1024 * 1024;
const configuredOrigins = new Set(
  (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maximumImageSize, files: 1 },
});

const imageMimeType = (image: Buffer): string | undefined => {
  if (
    image.length >= 8 &&
    image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    return "image/png";
  }
  if (
    image.length >= 3 &&
    image[0] === 0xff &&
    image[1] === 0xd8 &&
    image[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    image.length >= 12 &&
    image.toString("ascii", 0, 4) === "RIFF" &&
    image.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return undefined;
};

const getAuthenticatedUser = (user: PublicUser | undefined): PublicUser => {
  if (!user) {
    throw new ApiError(401, "Please log in to continue.");
  }
  return user;
};

const asyncRoute =
  (
    handler: (
      request: express.Request,
      response: express.Response,
    ) => Promise<void>,
  ): express.RequestHandler =>
  (request, response, next) => {
    void handler(request, response).catch(next);
  };

export const createApp = () => {
  const app = express();

  app.use((request, response, next) => {
    const origin = request.header("origin");
    if (origin) {
      response.header("Vary", "Origin");
      if (
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        configuredOrigins.has(origin)
      ) {
        response.header("Access-Control-Allow-Origin", origin);
      }
    }
    response.header(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type",
    );
    response.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

    if (request.method === "OPTIONS") {
      response.sendStatus(204);
      return;
    }
    next();
  });
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.post(
    "/api/auth/signup",
    asyncRoute(async (request, response) => {
      const session = await signUp(
        request.body?.name,
        request.body?.email,
        request.body?.password,
        request.body?.role,
      );
      response.status(201).json(session);
    }),
  );

  app.post(
    "/api/auth/login",
    asyncRoute(async (request, response) => {
      const session = await logIn(request.body?.email, request.body?.password);
      response.json(session);
    }),
  );

  app.get("/api/auth/me", requireAuth, (request, response) => {
    response.json(getAuthenticatedUser(request.authUser));
  });

  app.post(
    "/api/auth/logout",
    requireAuth,
    asyncRoute(async (request, response) => {
      await revokeSession(request);
      response.sendStatus(204);
    }),
  );

  app.get(
    "/api/scans",
    requireAuth,
    asyncRoute(async (request, response) => {
      const user = getAuthenticatedUser(request.authUser);
      const conditions =
        user.role === "farmer" ? eq(scans.userId, user.id) : undefined;
      const records = await db
        .select()
        .from(scans)
        .where(conditions)
        .orderBy(desc(scans.createdAt));
      const entries: ScanHistoryEntry[] = records.map((scan) => ({
        id: scan.id,
        imageUrl: scan.imageData,
        status: scan.status as ScanHistoryEntry["status"],
        confidence: scan.confidence,
        summary: scan.summary,
        urgency: scan.urgency,
        recommendations: scan.recommendations,
        createdAt: scan.createdAt.toISOString(),
      }));
      response.json(entries);
    }),
  );

  app.get(
    "/api/crops",
    requireAuth,
    asyncRoute(async (request, response) => {
      const user = getAuthenticatedUser(request.authUser);
      if (user.role !== "farmer") {
        throw new ApiError(403, "Crop records are currently available to farmers.");
      }
      response.json(
        await db
          .select()
          .from(crops)
          .where(eq(crops.userId, user.id))
          .orderBy(desc(crops.createdAt)),
      );
    }),
  );

  app.post(
    "/api/crops",
    requireAuth,
    asyncRoute(async (request, response) => {
      const user = getAuthenticatedUser(request.authUser);
      if (user.role !== "farmer") {
        throw new ApiError(403, "Only farmers can add crop records.");
      }
      const { name, variety, location, plantedAt, notes } = request.body ?? {};
      if (
        typeof name !== "string" ||
        !name.trim() ||
        name.trim().length > 100 ||
        typeof variety !== "string" ||
        !variety.trim() ||
        variety.trim().length > 100 ||
        typeof location !== "string" ||
        !location.trim() ||
        location.trim().length > 160 ||
        (notes !== undefined && typeof notes !== "string") ||
        (typeof notes === "string" && notes.length > 2000)
      ) {
        throw new ApiError(
          400,
          "Provide a crop name, variety, location, and notes under the stated length limits.",
        );
      }
      const plantedAtDate =
        typeof plantedAt === "string" && plantedAt
          ? new Date(`${plantedAt}T00:00:00.000Z`)
          : null;
      if (plantedAtDate && Number.isNaN(plantedAtDate.getTime())) {
        throw new ApiError(400, "Planting date is invalid.");
      }
      const [record] = await db
        .insert(crops)
        .values({
          id: randomUUID(),
          userId: user.id,
          name: name.trim(),
          variety: variety.trim(),
          location: location.trim(),
          plantedAt: plantedAtDate,
          notes: typeof notes === "string" ? notes.trim() : "",
        })
        .returning();
      response.status(201).json(record);
    }),
  );

  app.delete(
    "/api/crops/:id",
    requireAuth,
    asyncRoute(async (request, response) => {
      const user = getAuthenticatedUser(request.authUser);
      if (user.role !== "farmer") {
        throw new ApiError(403, "Only farmers can remove their crop records.");
      }
      const cropId = request.params.id;
      if (typeof cropId !== "string" || !cropId) {
        throw new ApiError(400, "A crop record ID is required.");
      }
      const [removed] = await db
        .delete(crops)
        .where(and(eq(crops.id, cropId), eq(crops.userId, user.id)))
        .returning({ id: crops.id });
      if (!removed) {
        throw new ApiError(404, "Crop record not found.");
      }
      response.sendStatus(204);
    }),
  );

  app.get(
    "/api/advisories",
    requireAuth,
    asyncRoute(async (_request, response) => {
      response.json(
        await db.select().from(advisories).orderBy(desc(advisories.createdAt)),
      );
    }),
  );

  app.post(
    "/api/advisories",
    requireAuth,
    requireStaffRole,
    asyncRoute(async (request, response) => {
      const user = getAuthenticatedUser(request.authUser);
      const { title, category, crop, body } = request.body ?? {};
      const categories = ["Pest", "Disease", "Growing", "Weather"];
      if (
        typeof title !== "string" ||
        !title.trim() ||
        title.trim().length > 140 ||
        typeof category !== "string" ||
        !categories.includes(category) ||
        typeof crop !== "string" ||
        !crop.trim() ||
        crop.trim().length > 80 ||
        typeof body !== "string" ||
        !body.trim() ||
        body.trim().length > 5000
      ) {
        throw new ApiError(400, "Enter a valid title, category, crop, and advisory.");
      }
      const [advisory] = await db
        .insert(advisories)
        .values({
          id: randomUUID(),
          title: title.trim(),
          category,
          crop: crop.trim(),
          body: body.trim(),
          authorId: user.id,
        })
        .returning();
      response.status(201).json(advisory);
    }),
  );

  app.get(
    "/api/admin/users",
    requireAuth,
    requireAdminRole,
    asyncRoute(async (_request, response) => {
      const accounts = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt));
      response.json(accounts);
    }),
  );

  app.patch(
    "/api/admin/users/:id/role",
    requireAuth,
    requireAdminRole,
    asyncRoute(async (request, response) => {
      const { role } = request.body ?? {};
      if (
        typeof role !== "string" ||
        !["farmer", "researcher", "agriculturist"].includes(role)
      ) {
        throw new ApiError(400, "Choose a valid non-admin role.");
      }
      const userId = request.params.id;
      if (typeof userId !== "string" || !userId) {
        throw new ApiError(400, "A user ID is required.");
      }
      const [updated] = await db
        .update(users)
        .set({ role: role as "farmer" | "researcher" | "agriculturist" })
        .where(
          and(eq(users.id, userId), ne(users.role, "admin")),
        )
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
        });
      if (!updated) {
        throw new ApiError(404, "Only existing non-admin accounts can be updated.");
      }
      response.json(updated);
    }),
  );

  app.post(
    "/api/scans/analyze",
    requireAuth,
    requireUploadRole,
    upload.single("image"),
    asyncRoute(async (request, response) => {
      const image = request.file;
      if (!image) {
        throw new ApiError(400, "Choose an image file to scan.");
      }
      const mimeType = imageMimeType(image.buffer);
      if (!mimeType) {
        throw new ApiError(400, "Upload a valid JPG, PNG, or WEBP image.");
      }

      const result = await analyzePepperImage(image.buffer);
      const user = getAuthenticatedUser(request.authUser);
      const id = randomUUID();
      const createdAt = new Date();
      const imageData = `data:${mimeType};base64,${image.buffer.toString("base64")}`;

      const [scan] = await db
        .insert(scans)
        .values({
          id,
          userId: user.id,
          imageData,
          ...result,
          createdAt,
        })
        .returning();
      if (!scan) {
        throw new Error("Database did not return the saved scan.");
      }

      const entry: ScanHistoryEntry = {
        id: scan.id,
        imageUrl: scan.imageData,
        status: scan.status as ScanHistoryEntry["status"],
        confidence: scan.confidence,
        summary: scan.summary,
        urgency: scan.urgency,
        recommendations: scan.recommendations,
        createdAt: scan.createdAt.toISOString(),
      };
      response.status(201).json(entry);
    }),
  );

  app.use((_request, response) => {
    response.status(404).json({ message: "Endpoint not found." });
  });

  const errorHandler: ErrorRequestHandler = (
    error,
    _request,
    response,
    _next,
  ) => {
    if (error instanceof multer.MulterError) {
      const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      response.status(status).json({
        message:
          status === 413
            ? "Image must be 5 MB or smaller."
            : "Upload one image file using the image field.",
      });
      return;
    }

    if (error instanceof ApiError) {
      response.status(error.status).json({ message: error.message });
      return;
    }

    console.error("Unhandled backend error:", error);
    response
      .status(500)
      .json({ message: "An unexpected server error occurred." });
  };
  app.use(errorHandler);

  return app;
};
