# SilingScan backend

Express API and Drizzle ORM schema for the SilingScan frontend. PostgreSQL is
the source of truth for accounts, sessions, and scan history.

## Setup

1. Create a PostgreSQL database (Neon is supported) and copy its connection
   string.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`. Keep `.env` private.
   Set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` (12+ characters) to
   provision the private administrator account on the next server start.
   Admin is not a signup role; only the configured account can sign in as
   administrator.
3. From this folder, install dependencies and create the database tables:

   ```sh
   npm install
   npm run db:push
   npm run dev
   ```

The API listens on `http://localhost:8000` by default. Create an account from
the frontend signup form; accounts are stored in PostgreSQL and passwords are
hashed before storage.

## API

- `GET /api/health` — health check
- `POST /api/auth/signup` — create an account and session
- `POST /api/auth/login` — sign in
- `GET /api/auth/me` — get the current account
- `POST /api/auth/logout` — revoke the current session
- `GET /api/scans` — list scans allowed for the current role
- `POST /api/scans/analyze` — accept an image upload and run diagnosis
- `GET/POST /api/crops` — view and add the signed-in farmer's crop records
- `GET/POST /api/advisories` — browse and publish specialist field guidance
- `GET /api/admin/users` — administrator-only account directory
- `PATCH /api/admin/users/:id/role` — administrator-only role assignment

Image diagnosis intentionally returns `503` until the trained disease-detection
model is connected. The frontend displays this as an explicit unavailable
message rather than presenting fabricated predictions.

For production, run `npm run build` and `npm start`. Set `VITE_API_URL` in the
frontend to the deployed API's `/api` URL. The API allows local development
origins and any exact origins listed in the comma-separated `CORS_ORIGINS`
environment variable.

## Deploying the API to Render

The frontend is hosted separately on GitHub Pages. To deploy this API:

1. Create a Neon PostgreSQL database and copy its connection string.
2. In Render, create a new Blueprint and connect the SilingScan GitHub
   repository. Render reads the root `render.yaml` and creates the API service.
3. Set the service's `DATABASE_URL` to the Neon connection string. Keep this
   value private. Optionally set both `ADMIN_EMAIL` and `ADMIN_PASSWORD` to
   provision the private administrator account.
4. Initialize the database schema by running `npm run db:push` from this
   directory with `DATABASE_URL` set to the Neon database.
5. Wait for the Render service to deploy, then check
   `https://<your-render-service>.onrender.com/api/health`. It should return
   `{"status":"ok"}`.
6. In GitHub, open **Settings > Secrets and variables > Actions > Variables**
   for the repository and create `VITE_API_URL` with the value
   `https://<your-render-service>.onrender.com/api`.
7. Run the **Deploy SilingScan to GitHub Pages** workflow from the Actions tab
   to rebuild the frontend with the deployed API URL.

The Render Blueprint allows the GitHub Pages origin for browser requests.
Image diagnosis remains unavailable until a trained disease-detection model
is connected.
