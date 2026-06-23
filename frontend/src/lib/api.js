import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// attach admin token if present
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("glowcamp_admin_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

/**
 * Extracts a readable string from an axios error. Handles FastAPI's
 * validation error array (`detail: [{ msg, loc, ... }]`) safely.
 */
export function apiErrorMessage(err, fallback = "Something went wrong") {
  const d = err?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d) && d.length) {
    return d
      .map((e) => {
        const field = Array.isArray(e?.loc) ? e.loc.filter((x) => x !== "body").join(".") : "";
        const msg = e?.msg || JSON.stringify(e);
        return field ? `${field}: ${msg}` : msg;
      })
      .join(" • ");
  }
  if (d && typeof d === "object") return d.msg || JSON.stringify(d);
  return err?.message || fallback;
}
