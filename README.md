# Hotel Business Software

A full-stack hotel management system: front-desk operations, reservations,
guest profiles, billing/invoicing, housekeeping, and a staff-facing
dashboard — with role-based access for admins, managers, receptionists,
housekeeping, and accountants.

## Stack

- **Backend**: Node.js, Express, TypeScript, Prisma ORM, SQLite (dev) /
  PostgreSQL-ready, JWT auth, Zod validation
- **Frontend**: React 18, TypeScript, Vite, React Router, Tailwind CSS, Axios

## Features

- **Auth & roles** — JWT login, ADMIN/MANAGER/RECEPTIONIST/HOUSEKEEPING/ACCOUNTANT roles
- **Dashboard** — occupancy rate, today's arrivals/departures, guests in-house, revenue, upcoming arrivals
- **Rooms & Room Types** — room grid with live status (available/occupied/reserved/cleaning/maintenance/out of service), configurable room types and pricing
- **Reservations** — availability search by date range, booking creation, check-in, check-out (auto-creates a cleaning task), cancellation
- **Guests** — guest directory with search, profiles with full reservation history
- **Billing** — generate invoices from checked-out reservations, itemized charges, discounts, tax, multi-method payments, balance tracking
- **Housekeeping** — Kanban-style task board (pending/in progress/completed/verified), task assignment; completing a cleaning task frees the room for booking
- **Staff management** — admin-only user directory and account creation

## Project Structure

```
backend/    Express + Prisma API (port 4000)
frontend/   React + Vite SPA (port 5173, proxies /api to the backend)
```

## Getting Started

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init   # creates the SQLite DB and applies the schema, runs the seed
npm run dev                          # starts the API on http://localhost:4000
```

The seed script (run automatically by `migrate dev`, or manually via
`npm run seed`) creates demo accounts:

| Role         | Email                   | Password    |
|--------------|-------------------------|-------------|
| Admin        | admin@hotel.com         | Admin@123   |
| Receptionist | reception@hotel.com     | Staff@123   |
| Housekeeping | housekeeping@hotel.com  | Staff@123   |

It also seeds 4 room types, 18 rooms, and a few sample guests.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev   # starts the SPA on http://localhost:5173
```

Open http://localhost:5173 and sign in with one of the demo accounts above.

### Production build

```bash
cd backend && npm run build && npm start
cd frontend && npm run build   # outputs static assets to frontend/dist
```

## Switching to PostgreSQL

SQLite is used by default for zero-config local development. For production:

1. Set `DATABASE_URL` in `backend/.env` to a PostgreSQL connection string.
2. Change `provider = "sqlite"` to `provider = "postgresql"` in `backend/prisma/schema.prisma`.
3. Run `npx prisma migrate dev` to generate a fresh migration for Postgres.

## API Overview

All routes are prefixed with `/api` and (except `/auth/login` and `/health`)
require a `Authorization: Bearer <token>` header.

| Resource | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/register` (admin), `GET /auth/me` |
| Users | `GET/PATCH/DELETE /users` (admin-managed) |
| Room Types | `GET/POST/PATCH/DELETE /room-types` |
| Rooms | `GET/POST/PATCH/DELETE /rooms`, `PATCH /rooms/:id/status` |
| Guests | `GET/POST/PATCH/DELETE /guests` (supports `?q=` search) |
| Reservations | `GET/POST/PATCH /reservations`, `GET /reservations/available-rooms`, `POST /reservations/:id/check-in`, `/check-out`, `/cancel` |
| Invoices | `GET /invoices`, `POST /invoices/generate/:reservationId`, item/discount/payment endpoints, `POST /invoices/:id/void` |
| Housekeeping | `GET/POST/PATCH/DELETE /housekeeping` |
| Dashboard | `GET /dashboard/stats` |

## Notes

- Enum-like fields (statuses, roles, etc.) are stored as validated strings
  rather than native Prisma enums, since the default SQLite datasource
  doesn't support them — this keeps the schema portable to PostgreSQL
  without changes.
- Room availability for a reservation is computed by checking for
  overlapping active reservations (`PENDING`/`CONFIRMED`/`CHECKED_IN`) on
  the same room, so double-booking is prevented at the API layer.
