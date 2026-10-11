# SilingScan

SilingScan is a chili pepper crop-management application with a React frontend
and an Express/PostgreSQL backend.

## Repository layout

- `SilingScan-Frontend/` — React application
- `SilingScan-Backend/` — Express API and Drizzle database schema

## Run locally

### Backend

1. Create `SilingScan-Backend/.env` from `.env.example` and set a valid
   `DATABASE_URL`. Keep `.env` private.
2. From `SilingScan-Backend/`, install dependencies and prepare the database:

   ```sh
   npm install
   npm run db:push
   npm run dev
   ```

   The API listens on `http://localhost:8000` by default.

### Frontend

1. Create `SilingScan-Frontend/.env.local` from `.env.example` if the API is
   not running at its default local URL.
2. From `SilingScan-Frontend/`, install dependencies and start the app:

   ```sh
   npm install
   npm run dev
   ```

See each application folder's README for additional setup and available scripts.
