"""Iteration 4 — Defensive regression smoke test.

Context: Only /app/deploy.sh and /app/DEPLOY.md were changed (VPS install path).
No app code touched. This test confirms the running preview app still works:
  1. GET /api/settings shape (payment_options, offers, card_extra_fields keys)
  2. POST /api/admin/login returns a token
  3. GET /api/admin/orders returns a list
  4. Frontend GET / contains 'GlowCamp' in rendered HTML
  5. Frontend GET /checkout returns 200 (React SPA serves index.html)
  6. Regression: PUT settings to add a card_extra_fields entry with capture=true,
     POST /api/orders with that key in custom_fields, confirm it persists on order.
  7. Regression: per-payment-method toggle (card_enabled=false) reflected in
     GET /api/settings payment_options.card.

Cleanup: card_extra_fields reset to [] and card_enabled reset to true at end.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@glowcamp.com"
ADMIN_PASS = "GlowCamp@2026"

TIMEOUT = 20


# ---------- fixtures ----------
@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(
        f"{API}/admin/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASS},
        timeout=TIMEOUT,
    )
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and isinstance(data["token"], str) and data["token"]
    return data["token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module")
def original_settings(admin_headers):
    """Snapshot FULL admin settings doc so we can mutate & restore in teardown."""
    r = requests.get(f"{API}/admin/settings", headers=admin_headers, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    return r.json()


def _put_settings(admin_headers, settings_doc):
    """Helper: PUT the full Settings object back to /api/admin/settings."""
    r = requests.put(
        f"{API}/admin/settings",
        headers=admin_headers,
        json=settings_doc,
        timeout=TIMEOUT,
    )
    assert r.status_code == 200, f"PUT settings failed {r.status_code}: {r.text}"
    return r.json()


# ---------- 1. Settings shape ----------
class TestSettingsShape:
    def test_public_settings_keys_present(self):
        r = requests.get(f"{API}/settings", timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        data = r.json()
        # Required top-level keys per review request
        assert "payment_options" in data, "payment_options missing"
        assert "offers" in data, "offers missing"
        assert "card_extra_fields" in data, "card_extra_fields missing"
        # payment_options should be a dict / object
        assert isinstance(data["payment_options"], dict)
        # offers must be iterable list
        assert isinstance(data["offers"], list)
        # card_extra_fields must be a list (possibly empty)
        assert isinstance(data["card_extra_fields"], list)


# ---------- 2 & 3. Admin login + orders ----------
class TestAdminHealth:
    def test_admin_login_returns_token(self, admin_token):
        # admin_token fixture itself asserts the token shape — this just confirms reach
        assert isinstance(admin_token, str) and len(admin_token) > 10

    def test_admin_orders_returns_list(self, admin_headers):
        r = requests.get(f"{API}/admin/orders", headers=admin_headers, timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        data = r.json()
        # Accept either a bare list OR a wrapped {orders: [...]} shape
        if isinstance(data, dict) and "orders" in data:
            assert isinstance(data["orders"], list)
        else:
            assert isinstance(data, list), f"expected list, got {type(data).__name__}"


# ---------- 4 & 5. Frontend smoke ----------
class TestFrontendSmoke:
    def test_home_renders_glowcamp(self):
        r = requests.get(f"{BASE_URL}/", timeout=TIMEOUT)
        assert r.status_code == 200, r.text[:300]
        body = r.text
        assert "GlowCamp" in body or "glowcamp" in body.lower(), (
            "Home HTML did not contain 'GlowCamp'"
        )

    def test_checkout_route_serves_spa(self):
        r = requests.get(f"{BASE_URL}/checkout", timeout=TIMEOUT)
        assert r.status_code == 200, r.text[:300]
        # SPA: same index.html is served; React Router takes over client side
        assert "<div id=\"root\"" in r.text or "root" in r.text


# ---------- 6. Regression: card_extra_fields capture flow ----------
class TestCardExtraFieldsCaptureFlow:
    def test_add_field_post_order_and_verify_persistence(self, admin_headers, original_settings):
        # Build a unique field key so we don't collide with any existing one
        field_key = f"TEST_cf_{uuid.uuid4().hex[:6]}"
        field_label = "TEST Cardholder Name"

        # 1) PUT full settings with the new field appended (capture=true, required=false)
        import copy
        mutated = copy.deepcopy(original_settings)
        existing_cef = list(mutated.get("card_extra_fields") or [])
        existing_cef.append({
            "key": field_key,
            "label": field_label,
            "type": "text",
            "placeholder": "",
            "required": False,
            "full_width": False,
            "capture": True,
            "order": len(existing_cef),
        })
        mutated["card_extra_fields"] = existing_cef

        # Ensure at least one offer exists so POST /api/orders passes offer validation.
        existing_offers = list(mutated.get("offers") or [])
        if existing_offers:
            offer_key_to_use = existing_offers[0]["key"]
            offer_unit_price = float(existing_offers[0].get("price") or 29.99)
        else:
            offer_key_to_use = "TEST_smoke"
            offer_unit_price = 29.99
            mutated["offers"] = [{
                "key": offer_key_to_use,
                "title": "TEST Smoke Offer",
                "subtitle": "ephemeral",
                "quantity": 1,
                "price": offer_unit_price,
                "original_price": offer_unit_price,
                "badge": None,
                "description": "",
            }]
        _put_settings(admin_headers, mutated)

        # 2) Verify GET /api/settings reflects the new field
        g = requests.get(f"{API}/settings", timeout=TIMEOUT)
        assert g.status_code == 200
        assert any(f.get("key") == field_key for f in g.json().get("card_extra_fields", [])), (
            "newly added field not present in public settings"
        )

        # 3) POST /api/orders with that field in custom_fields (flat schema per backend Pydantic model)
        order_payload = {
            "full_name": "TEST_Smoke Buyer",
            "phone": "5559998888",
            "email": f"smoke_{uuid.uuid4().hex[:6]}@example.com",
            "address": "1 Test Lane",
            "city": "TestCity",
            "state": "TX",
            "pincode": "73301",
            "landmark": "",
            "items": [
                {
                    "offer_key": offer_key_to_use,
                    "title": "GlowCamp Flame Lamp",
                    "quantity": 1,
                    "unit_price": offer_unit_price,
                    "line_total": offer_unit_price,
                }
            ],
            "payment_method": "card",
            "custom_fields": {field_key: "Smoke Test Cardholder"},
        }
        post = requests.post(f"{API}/orders", json=order_payload, timeout=TIMEOUT)
        # Some implementations may require offer_key be a valid one. Accept 200/201.
        assert post.status_code in (200, 201), f"order POST failed: {post.status_code} {post.text}"
        order = post.json()
        # Capture filter should preserve the captured key
        cf = order.get("custom_fields") or {}
        assert cf.get(field_key) == "Smoke Test Cardholder", (
            f"Captured field not persisted on order. Got custom_fields={cf}"
        )


# ---------- 7. Regression: per-payment-method toggle ----------
class TestPaymentToggleRegression:
    def test_disable_card_reflected_in_public_settings(self, admin_headers, original_settings):
        # PUT full settings with payment.card_enabled = False
        import copy
        mutated = copy.deepcopy(original_settings)
        mutated.setdefault("payment", {})["card_enabled"] = False
        _put_settings(admin_headers, mutated)

        g = requests.get(f"{API}/settings", timeout=TIMEOUT)
        assert g.status_code == 200
        po = g.json().get("payment_options", {})
        assert po.get("card") is False, (
            f"card disable did not propagate to GET /api/settings payment_options: {po}"
        )


# ---------- final cleanup (module-scoped teardown) ----------
@pytest.fixture(scope="module", autouse=True)
def _restore_settings(request, admin_headers, original_settings):
    """Restore full Settings doc to the original snapshot after the module runs."""
    yield
    try:
        _put_settings(admin_headers, original_settings)
    except Exception as e:  # pragma: no cover - best effort cleanup
        print(f"[teardown] failed to restore settings: {e}")
