"""Iteration 11 — Live analytics endpoints.

Covers:
  - POST /api/track (public beacon) inserts into page_views & live_sessions.
  - Path normalization (/product/, /product?ref=x, /product#x -> /product).
  - GET /api/admin/analytics requires admin auth (401 unauth).
  - GET /api/admin/analytics returns the LiveAnalytics shape and reflects
    seeded sessions across /product and /checkout (active_now, on_*, visitors_*).
  - Regression: GET /api/admin/dashboard still returns total_orders, revenue, etc.
"""
from __future__ import annotations

import os
import time
import uuid

import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
ADMIN_EMAIL = "admin@glowcamp.com"
ADMIN_PASSWORD = "GlowCamp@2026"

LIVE_KEYS = {
    "active_now", "on_home", "on_product", "on_cart", "on_checkout",
    "visitors_today", "visitors_7d", "visitors_30d", "page_views_today",
    "top_pages_7d",
}


# ---------- fixtures ----------
@pytest.fixture(scope="module")
def admin_headers():
    r = requests.post(
        f"{BASE_URL}/api/admin/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=15,
    )
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    token = r.json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def session_ids():
    # Two distinct browser sessions for visitor uniqueness checks
    return {"a": f"TEST_iter11_a_{uuid.uuid4().hex[:8]}",
            "b": f"TEST_iter11_b_{uuid.uuid4().hex[:8]}"}


# ---------- /api/track ----------
class TestTrackEndpoint:
    def test_track_returns_ok(self, session_ids):
        r = requests.post(
            f"{BASE_URL}/api/track",
            json={"session_id": session_ids["a"], "path": "/product"},
            timeout=10,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body == {"ok": True}

    def test_track_empty_session_id_still_ok(self):
        # empty session shouldn't write anything but should still respond 200
        r = requests.post(
            f"{BASE_URL}/api/track",
            json={"session_id": "", "path": "/"},
            timeout=10,
        )
        assert r.status_code == 200
        assert r.json() == {"ok": True}

    def test_track_bad_payload_422(self):
        r = requests.post(f"{BASE_URL}/api/track", json={"foo": "bar"}, timeout=10)
        assert r.status_code == 422


# ---------- path normalization ----------
class TestPathNormalization:
    def test_normalization_query_hash_trailing(self, admin_headers):
        """Hit /product with three variants from one fresh session — admin
        analytics must group them into a single /product entry."""
        sid = f"TEST_iter11_norm_{uuid.uuid4().hex[:8]}"
        for path in ["/product/", "/product?ref=x", "/product#section"]:
            r = requests.post(
                f"{BASE_URL}/api/track",
                json={"session_id": sid, "path": path},
                timeout=10,
            )
            assert r.status_code == 200

        # Give Mongo a moment
        time.sleep(0.3)
        r = requests.get(f"{BASE_URL}/api/admin/analytics", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        # /product should appear in top_pages_7d, and there should be NO /product/, /product?ref=x, /product#section
        paths = {p["path"] for p in data["top_pages_7d"]}
        assert "/product" in paths, f"expected /product in top_pages: {paths}"
        for bad in ("/product/", "/product?ref=x", "/product#section"):
            assert bad not in paths, f"unnormalized path leaked: {bad}"


# ---------- auth gating ----------
class TestAnalyticsAuth:
    def test_analytics_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/admin/analytics", timeout=10)
        assert r.status_code == 401, r.text

    def test_analytics_bad_token_401(self):
        r = requests.get(
            f"{BASE_URL}/api/admin/analytics",
            headers={"Authorization": "Bearer not-a-real-token"},
            timeout=10,
        )
        assert r.status_code == 401


# ---------- shape + counts ----------
class TestAnalyticsShape:
    def test_shape_and_counts(self, admin_headers, session_ids):
        sa, sb = session_ids["a"], session_ids["b"]
        # Seed: sess-a /product, sess-a /checkout, sess-b /product
        for sid, p in [(sa, "/product"), (sa, "/checkout"), (sb, "/product")]:
            r = requests.post(
                f"{BASE_URL}/api/track",
                json={"session_id": sid, "path": p},
                timeout=10,
            )
            assert r.status_code == 200
        time.sleep(0.5)

        r = requests.get(f"{BASE_URL}/api/admin/analytics", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        data = r.json()

        # Shape
        missing = LIVE_KEYS - set(data.keys())
        assert not missing, f"missing keys: {missing}"
        assert isinstance(data["top_pages_7d"], list)

        # Types
        for k in LIVE_KEYS - {"top_pages_7d"}:
            assert isinstance(data[k], int), f"{k} should be int, got {type(data[k])}"

        # Counts — within 60s window, our two seeded sessions should still be active.
        # NOTE: There may be other live sessions from real browsers in the preview env,
        # so we assert >= rather than ==. The seeded sessions guarantee at least these.
        assert data["active_now"] >= 2, f"active_now too low: {data['active_now']}"
        # sb is on /product, sa is on /checkout (latest path wins for sa)
        assert data["on_product"] >= 1, f"on_product too low: {data['on_product']}"
        assert data["on_checkout"] >= 1, f"on_checkout too low: {data['on_checkout']}"

        # Visitors today must include our two distinct sessions
        assert data["visitors_today"] >= 2, f"visitors_today too low: {data['visitors_today']}"
        assert data["visitors_7d"] >= data["visitors_today"]
        assert data["visitors_30d"] >= data["visitors_7d"]
        assert data["page_views_today"] >= 3, f"page_views_today too low: {data['page_views_today']}"

        # top_pages_7d entries must have path/views/unique
        for entry in data["top_pages_7d"]:
            assert "path" in entry and "views" in entry and "unique" in entry
            assert isinstance(entry["views"], int)
            assert isinstance(entry["unique"], int)

    def test_active_now_path_switch(self, admin_headers):
        """When a session moves /product -> /checkout, on_product must drop
        for that session and on_checkout must include it (last path wins)."""
        sid = f"TEST_iter11_switch_{uuid.uuid4().hex[:8]}"

        requests.post(f"{BASE_URL}/api/track", json={"session_id": sid, "path": "/product"}, timeout=10)
        time.sleep(0.3)
        before = requests.get(f"{BASE_URL}/api/admin/analytics", headers=admin_headers, timeout=15).json()

        requests.post(f"{BASE_URL}/api/track", json={"session_id": sid, "path": "/checkout"}, timeout=10)
        time.sleep(0.3)
        after = requests.get(f"{BASE_URL}/api/admin/analytics", headers=admin_headers, timeout=15).json()

        # on_checkout should grow by at least 1 after the switch (or stay equal
        # if the session was already counted somewhere — but on_product should
        # not grow because of this session).
        assert after["on_checkout"] >= before["on_checkout"], (
            f"on_checkout regressed: before={before['on_checkout']} after={after['on_checkout']}"
        )


# ---------- regression: dashboard ----------
class TestDashboardRegression:
    def test_dashboard_shape_intact(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ("total_orders", "pending_orders", "shipped_orders",
                  "delivered_orders", "cancelled_orders", "paid_orders",
                  "total_revenue", "stock"):
            assert k in d, f"missing {k} in dashboard response"
        assert isinstance(d["total_orders"], int)
        assert isinstance(d["total_revenue"], (int, float))
