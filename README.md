# FFRSCM — National Fossil Fuel Resource & Supply Chain Management Dashboard

A full-stack MERN prototype for tracking India's coal, crude oil and natural gas
production, strategic reserves, logistics, Fuel Supply Agreements (FSAs), and
supply-chain crisis response, with role-based access for government administrators,
energy analysts, and industrial stakeholders.

> **Prototype status.** All sample figures (production, reserves, agreements,
> crisis reports) are illustrative placeholders generated for demonstration —
> not official government statistics. This has been verified to build and run
> correctly, and the API has been exercised with an in-process HTTP test suite,
> but it has **not** been run end-to-end against a live MongoDB instance in the
> environment this was built in (no outbound network access to install MongoDB).
> Point it at any MongoDB 6+ instance (local, Atlas, or Docker) and it will work
> as described — see Setup below.

---

## 1. Architecture

```
fossil-fuel-dashboard/
├── backend/                  Node.js + Express + Mongoose REST API
│   ├── app.js                 Express app (routes, middleware) — importable for tests
│   ├── server.js               Boot entrypoint: connects Mongo, starts app.listen
│   ├── config/
│   │   ├── db.js                Mongoose connection
│   │   └── roles.js             Role & module permission matrix (single source of truth)
│   ├── middleware/
│   │   ├── auth.js              JWT verification + role/permission guards
│   │   └── errorHandler.js      Centralized error formatting, 404 handler
│   ├── models/                  Mongoose schemas (User, Production, Reserve,
│   │                             Logistics, FSA, CrisisReport)
│   ├── routes/                  One router per module, all mounted under /api/*
│   └── utils/seed.js            Seeds demo users + representative sample data
│
├── frontend/                 React 19 + Vite SPA
│   └── src/
│       ├── api/axios.js          Axios instance: attaches JWT, handles 401 → logout
│       ├── context/AuthContext.jsx  Login/register/logout state, role labels
│       ├── components/           Shell (sidebar/topbar), ProtectedRoute, StatusBadge,
│       │                          StatCard, SecurityGauge (composite index widget)
│       └── pages/                Login, Register, Dashboard, Reserves, Logistics,
│                                  FSA, Crisis
│
└── docs/                     API reference (see docs/API.md)
```

**Why this split:** `app.js` (route wiring) is separated from `server.js` (process
boot + DB connection) so the API surface can be exercised with `supertest` without
needing a live database — this is how the backend was verified in this environment.

### Data flow
React (Vite dev server, default port 5173) → Axios (`VITE_API_URL`) → Express API
(port 5000) → Mongoose → MongoDB. JWT issued at login is stored in `localStorage`
and attached to every request; a 401 response anywhere clears it and redirects to
`/login`.

---

## 2. Role-based access model

Three roles, defined once in `backend/config/roles.js` and enforced on every route
via `checkPermission(module, action)`:

| Role | Maps to | Read access | Write access |
|---|---|---|---|
| `government_admin` | Ministry / PSU administrators | All modules | All modules, incl. reserves, FSA approval, user management |
| `energy_analyst` | Planning & analysis cell | All modules | Production, logistics, crisis reports |
| `industrial_stakeholder` | Industry partners (power, steel, cement, refiners…) | All modules (FSA view scoped to their own organization) | Can propose FSAs (go to `pending_approval`, admin must approve) |

Self-registration (`POST /api/auth/register`) always creates an `industrial_stakeholder`
account — admin and analyst accounts are provisioned by an existing admin via
`POST /api/auth/provision`, matching how a real government deployment would
onboard internal staff.

---

## 3. Setup

### Prerequisites
- Node.js 18+
- A MongoDB 6+ instance — local (`mongod`), Docker (`docker run -p 27017:27017 mongo`),
  or a free MongoDB Atlas cluster.

### Backend
```bash
cd backend
cp .env.example .env        # edit MONGO_URI / JWT_SECRET if needed
npm install
npm run seed                # creates demo users + sample data (see below)
npm run dev                 # nodemon, http://localhost:5000
```

### Frontend
```bash
cd frontend
cp .env.example .env        # VITE_API_URL, defaults to http://localhost:5000/api
npm install
npm run dev                 # http://localhost:5173
```

### Demo accounts (created by `npm run seed`)
| Role | Email | Password |
|---|---|---|
| Government Admin | `admin@ffrscm.gov.in` | `Admin@12345` |
| Energy Analyst | `analyst@ffrscm.gov.in` | `Analyst@12345` |
| Industrial Stakeholder (Tata Power) | `stakeholder@tatapower.com` | `Stake@12345` |

The login screen has one-click buttons that fill these in.

### Production build
```bash
cd frontend && npm run build   # outputs static assets to frontend/dist
cd backend  && npm start       # NODE_ENV=production node server.js
```
Serve `frontend/dist` from any static host / CDN / behind the same reverse proxy
as the API, or add `express.static` to `app.js` if you want the API to serve it directly.

---

## 4. Modules

- **Overview dashboard** — KPI cards per fuel (production vs. target), a
  production/target/consumption trend chart switchable by fuel, an import
  dependency donut, and live rollups of at-risk reserves and active disruptions.
  The **National Energy Security Index** gauge in the top bar is a composite
  score (average reserve coverage % minus a logistics-disruption penalty),
  computed client-side from live API data.
- **Strategic Reserves Tracker** — SPR/pithead/buffer facilities with
  auto-computed status (`critical` / `low` / `adequate` / `surplus` based on
  stock-to-capacity ratio), a per-facility utilization chart, filterable table.
  Admin-only create form.
- **Logistics & Distribution Monitor** — rail rake dispatch vs. plan and
  pipeline throughput vs. capacity, utilization gauge chart, disruption
  tracking with reasons. Admin/analyst can log movements.
- **Fuel Supply Agreement (FSA) interface** — agreements between suppliers
  (Coal India, ONGC, GAIL…) and consumers, with fulfilment % and compliance
  status. Stakeholders see only their own organization's agreements and can
  propose new ones (routed to `pending_approval`); admins approve.
- **Policy & Crisis Management** — categorized reports (price volatility,
  supply shock, geopolitical, infrastructure failure, natural disaster) with
  severity, affected regions, mitigation actions, and a status lifecycle
  (`open → monitoring → mitigated → closed`).

---

## 5. Security notes

- Passwords hashed with bcrypt (cost factor 12); JWT signed with `JWT_SECRET`,
  8-hour expiry by default.
- `helmet`, CORS restricted to `CLIENT_ORIGIN`, `express-mongo-sanitize`
  against NoSQL injection, and two-tier rate limiting (tighter on
  `/api/auth/*`) are applied in `app.js`.
- All non-auth routes require a valid JWT (`protect` middleware) plus a
  per-module permission check (`checkPermission`) — there is no endpoint that
  only checks "is logged in" without also checking role.
- Change `JWT_SECRET` before any real deployment; `.env` is gitignored.

## 6. Known limitations / next steps

- Not tested against a live MongoDB in this build environment (see status
  note above) — schema logic, indexes, and validation were reviewed by hand
  and the HTTP layer was verified with `supertest` against the Express app
  directly.
- No automated frontend test suite (Vitest/RTL) — verified via `npm run build`
  and a manual dev-server smoke check.
- Single JS bundle (~760KB) — code-splitting by route would help a production
  deployment.
- No pagination on list endpoints yet (capped with `.limit()` server-side).
- No file/document attachments on crisis reports or FSAs.
