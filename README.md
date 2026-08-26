# Hotel Business Software

A full-stack hotel property management system: room & rate management, reservations
with availability search, guest CRM, check-in/check-out, payments & invoicing,
housekeeping tracking, and a role-based staff dashboard.

## Stack

| Layer     | Tech |
|-----------|------|
| Backend   | Node.js, Express, TypeScript, Prisma ORM, SQLite, JWT auth, Zod validation |
| Frontend  | React 19, TypeScript, Vite, React Router, Tailwind CSS, Recharts, Axios |
| Database  | SQLite (file-based — zero setup; swap the Prisma datasource for Postgres/MySQL in production) |

## Features

- **Auth & roles** — JWT login/register; `ADMIN`, `MANAGER`, `FRONT_DESK`, `HOUSEKEEPING` roles gate sensitive actions (e.g. only admins manage staff accounts).
- **Room types & rooms** — configurable rate plans (base price, capacity, amenities) and a live room-status grid (available / occupied / cleaning / maintenance / out of service).
- **Reservations** — availability search across date ranges, booking creation, check-in / check-out / cancel, with automatic room-status transitions and a post-checkout housekeeping task.
- **Guests** — searchable guest directory with full stay history.
- **Payments & invoicing** — record payments against a reservation and generate a tax-inclusive invoice.
- **Housekeeping** — task board per room, assignable to staff, status tracked pending → in progress → done → verified.
- **Dashboard** — occupancy rate, arrivals/departures today, in-house guests, month-to-date revenue, and a 14-day revenue chart.

## Project layout

```
server/   Express + Prisma API (port 4000)
client/   React + Vite SPA (port 5173, proxies /api to the server)
```

## Getting started

Requires Node.js 20+.

### 1. Backend

```bash
cd server
cp .env.example .env
npm install
npm run prisma:migrate   # creates dev.db and applies the schema
npm run seed              # optional: demo data (rooms, guests, reservations)
npm run dev                # starts the API on http://localhost:4000
```

Demo login (created by the seed script): `admin@hotel.test` / `password123`

### 2. Frontend

In a second terminal:

```bash
cd client
npm install
npm run dev                # starts the SPA on http://localhost:5173
```

Open http://localhost:5173 — API calls to `/api/*` are proxied to the backend automatically in dev.

### Production build

```bash
cd server && npm run build && npm start      # compiles to dist/ and runs node dist/index.js
cd client && npm run build                    # outputs static assets to client/dist/
```

Serve `client/dist` from any static host (or behind the same reverse proxy as the API), and point
`CLIENT_ORIGIN` in `server/.env` at that origin for CORS.

## Data model

`User`, `RoomType`, `Room`, `Guest`, `Reservation`, `Payment`, `Invoice`, `HousekeepingTask` —
see `server/prisma/schema.prisma`. Status/role fields are plain strings (SQLite has no native enum
type); the allowed values are centralized in `server/src/lib/constants.ts` and mirrored in
`client/src/lib/constants.ts`, and enforced at the API boundary with Zod.

## API overview

All routes are namespaced under `/api` and (aside from `/auth/register` and `/auth/login`) require
a `Bearer` JWT from `/api/auth/login`.

- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `GET/POST /users`, `PATCH /users/:id` (admin only)
- `GET/POST /room-types`, `PATCH/DELETE /room-types/:id`
- `GET/POST /rooms`, `GET/PATCH/DELETE /rooms/:id`
- `GET/POST /guests`, `GET/PATCH/DELETE /guests/:id`
- `GET/POST /reservations`, `GET/PATCH /reservations/:id`
- `POST /reservations/:id/check-in`, `/check-out`, `/cancel`
- `GET /reservations/availability/search?checkIn=&checkOut=&roomTypeId=`
- `GET/POST /payments`
- `GET/POST /invoices`, `GET /invoices/:id`
- `GET/POST /housekeeping`, `PATCH /housekeeping/:id`
- `GET /dashboard/summary`, `GET /dashboard/revenue-series?days=14`
