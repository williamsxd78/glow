import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { api } from "./api";
import { ADMIN_BASE } from "./adminBase";

const SESSION_KEY = "glowcamp_session_id";
const HEARTBEAT_MS = 30_000;

function getSessionId() {
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = (crypto?.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36));
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

function beacon(path) {
  // Use sendBeacon if available so unload events don't lose the ping.
  const data = JSON.stringify({ session_id: getSessionId(), path });
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([data], { type: "application/json" });
      const url = `${api.defaults.baseURL}/track`;
      const ok = navigator.sendBeacon(url, blob);
      if (ok) return;
    }
  } catch (_) { /* fall through to axios */ }
  api.post("/track", { session_id: getSessionId(), path }).catch(() => {});
}

/**
 * useAnalytics — drop into the root <Shell /> component. Fires on every route
 * change AND every 30s while the tab is open so the admin "active now" count
 * reflects real activity.
 *
 * Admin pages are excluded so internal staff usage doesn't inflate visitor metrics.
 */
export function useAnalytics() {
  const loc = useLocation();
  const path = loc.pathname;

  // Fire on each route change (skip admin)
  useEffect(() => {
    if (path.startsWith(`/${ADMIN_BASE}`)) return;
    beacon(path);
  }, [path]);

  // Heartbeat while user is on the page
  useEffect(() => {
    if (path.startsWith(`/${ADMIN_BASE}`)) return;
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") beacon(path);
    }, HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, [path]);
}
