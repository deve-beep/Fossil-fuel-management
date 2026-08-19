# API Reference

Base URL: `http://localhost:5000/api` (configurable via `VITE_API_URL` on the frontend).
All responses are JSON: `{ success: boolean, data?, message?, count? }`.
Authenticated routes require `Authorization: Bearer <token>`.

## Auth — `/api/auth`
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/register` | Public | Always creates `industrial_stakeholder` |
| POST | `/provision` | Admin | Create admin/analyst/stakeholder accounts |
| POST | `/login` | Public | Returns `{ token, user }` |
| GET | `/me` | Any authenticated user | Current profile |

## Production — `/api/production`
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/?fuelType=&state=&from=&to=` | All roles | `from`/`to` are `YYYY-MM` |
| GET | `/summary` | All roles | Latest national record per fuel |
| POST | `/` | Admin, Analyst | Create a monthly record |
| PUT | `/:id` | Admin, Analyst | Update |
| DELETE | `/:id` | Admin, Analyst | Delete |

## Reserves — `/api/reserves`
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/?fuelType=&status=` | All roles | |
| GET | `/alerts` | All roles | `critical`/`low` facilities only |
| POST | `/` | Admin only | |
| PUT | `/:id` | Admin only | Re-audits `lastAudited` |
| DELETE | `/:id` | Admin only | |

## Logistics — `/api/logistics`
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/?mode=&fuelType=&status=` | All roles | |
| GET | `/disruptions` | All roles | `delayed`/`disrupted` only |
| POST | `/` | Admin, Analyst | |
| PUT | `/:id` | Admin, Analyst | |
| DELETE | `/:id` | Admin, Analyst | |

## Fuel Supply Agreements — `/api/fsa`
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/?fuelType=&status=&consumerSector=` | All roles | Stakeholders auto-scoped to own org |
| GET | `/:id` | All roles | 403 if stakeholder ≠ owning org |
| POST | `/` | Admin, Stakeholder | Stakeholder submissions → `pending_approval` |
| PATCH | `/:id/approve` | Admin only | Sets `status: active` |
| PUT | `/:id` | Admin, Stakeholder (own org) | |
| DELETE | `/:id` | Admin only | |

## Crisis reports — `/api/crisis`
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/?severity=&status=&category=&fuelType=` | All roles | |
| GET | `/:id` | All roles | |
| POST | `/` | Admin, Analyst | |
| PUT | `/:id` | Admin, Analyst | Auto-stamps `resolvedAt` on close/mitigate |
| DELETE | `/:id` | Admin, Analyst | |

## Users — `/api/users` (admin only)
| Method | Path | Notes |
|---|---|---|
| GET | `/` | List all accounts |
| PATCH | `/:id/deactivate` | Soft-disable login |
| PATCH | `/:id/reactivate` | Re-enable |

## Health
`GET /api/health` — no auth, returns service status/timestamp.
