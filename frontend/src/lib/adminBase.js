/**
 * Admin URL prefix — configurable via REACT_APP_ADMIN_BASE for security.
 *
 * Set REACT_APP_ADMIN_BASE=my-secret-panel in frontend/.env, then rebuild.
 * Your admin will live at /my-secret-panel/login instead of /admin/login.
 *
 * NOTE: This is for the FRONTEND routes only. The backend API endpoints
 * (`/api/admin/login`, `/api/admin/orders` etc.) remain stable — they are
 * NOT renamed, since renaming server APIs would break every admin call.
 */
export const ADMIN_BASE = (process.env.REACT_APP_ADMIN_BASE || "admin").replace(/^\/|\/$/g, "");

/** Convenience for prepending the admin slug, e.g. adminPath("orders") → "/admin/orders" */
export const adminPath = (sub = "") => `/${ADMIN_BASE}${sub ? "/" + sub.replace(/^\/+/, "") : ""}`;
