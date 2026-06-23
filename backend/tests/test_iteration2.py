"""GlowCamp iteration 2 tests: coupons, store region, PayPal capture, public settings fields."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://flame-glow-demo.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_EMAIL = "admin@glowcamp.com"
ADMIN_PASSWORD = "GlowCamp@2026"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(client):
    r = client.post(f"{API}/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture
def auth(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ------------------ Public settings new fields ------------------
class TestPublicSettings:
    def test_new_fields_present(self, client):
        r = client.get(f"{API}/settings")
        assert r.status_code == 200
        d = r.json()
        for key in ["store_country", "custom_states", "paypal_client_id", "paypal_mode"]:
            assert key in d, f"missing {key}"
        assert d["store_country"] in ("US", "IN", "CUSTOM")
        assert isinstance(d["custom_states"], list)
        assert d["paypal_mode"] in ("sandbox", "live")


# ------------------ Coupon validate ------------------
class TestCouponValidate:
    def test_glow10_valid(self, client):
        r = client.post(f"{API}/coupons/validate", json={"code": "GLOW10", "subtotal": 50})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["code"] == "GLOW10"
        assert d["type"] == "percent"
        assert d["discount"] == 5.0

    def test_glow10_case_insensitive(self, client):
        r = client.post(f"{API}/coupons/validate", json={"code": "glow10", "subtotal": 60})
        assert r.status_code == 200
        assert r.json()["discount"] == 6.0

    def test_welcome5_fixed(self, client):
        r = client.post(f"{API}/coupons/validate", json={"code": "WELCOME5", "subtotal": 35})
        assert r.status_code == 200
        d = r.json()
        assert d["type"] == "fixed"
        assert d["discount"] == 5.0

    def test_invalid_coupon_404(self, client):
        r = client.post(f"{API}/coupons/validate", json={"code": "INVALID", "subtotal": 100})
        assert r.status_code == 404

    def test_below_min_subtotal(self, client):
        # GLOW10 min_subtotal=25
        r = client.post(f"{API}/coupons/validate", json={"code": "GLOW10", "subtotal": 10})
        assert r.status_code == 400


# ------------------ Order with coupon ------------------
class TestOrderWithCoupon:
    def test_order_with_glow10(self, client):
        payload = {
            "full_name": "TEST_CouponBuyer",
            "phone": "5557778888",
            "email": "TEST_coupon@example.com",
            "address": "1 main", "city": "Austin", "state": "TX", "pincode": "73301",
            "items": [{"offer_key": "single", "title": "x", "quantity": 1, "unit_price": 29.99, "line_total": 29.99}],
            "payment_method": "cod",
            "coupon_code": "GLOW10",
        }
        r = client.post(f"{API}/orders", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["subtotal"] == 29.99
        # Below min_subtotal=25? 29.99>=25 -> coupon applies. 10% = 3.00
        assert d["discount"] == 3.0
        assert d["coupon_code"] == "GLOW10"
        # discounted_subtotal = 26.99, below free shipping threshold 50 -> shipping 5
        assert d["shipping"] == 5.0
        assert d["total"] == round(26.99 + 5.0, 2)
        pytest.glowcamp_order_coupon = d

    def test_order_without_coupon_backward_compat(self, client):
        payload = {
            "full_name": "TEST_NoCoupon",
            "phone": "5550001111",
            "email": "TEST_nc@example.com",
            "address": "1 main", "city": "Austin", "state": "TX", "pincode": "73301",
            "items": [{"offer_key": "single", "title": "x", "quantity": 1, "unit_price": 29.99, "line_total": 29.99}],
            "payment_method": "cod",
        }
        r = client.post(f"{API}/orders", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["discount"] == 0.0
        assert d["coupon_code"] == ""

    def test_order_with_invalid_coupon_ignored(self, client):
        payload = {
            "full_name": "TEST_BadCoupon",
            "phone": "5550002222",
            "email": "TEST_bc@example.com",
            "address": "1 main", "city": "Austin", "state": "TX", "pincode": "73301",
            "items": [{"offer_key": "single", "title": "x", "quantity": 1, "unit_price": 29.99, "line_total": 29.99}],
            "payment_method": "cod",
            "coupon_code": "BADCODE",
        }
        r = client.post(f"{API}/orders", json=payload)
        # server is lenient - invalid coupon -> just no discount
        assert r.status_code == 200
        assert r.json()["discount"] == 0.0


# ------------------ PayPal capture ------------------
class TestPayPalCapture:
    def test_paypal_capture_marks_paid(self, client):
        # create order
        payload = {
            "full_name": "TEST_PPBuyer", "phone": "5550003333",
            "email": "TEST_pp@example.com",
            "address": "1 main", "city": "Austin", "state": "TX", "pincode": "73301",
            "items": [{"offer_key": "single", "title": "x", "quantity": 1, "unit_price": 29.99, "line_total": 29.99}],
            "payment_method": "paypal",
        }
        o = client.post(f"{API}/orders", json=payload).json()
        r = client.post(f"{API}/orders/{o['id']}/paypal-capture",
                        json={"capture_id": "TESTCAP12345678", "payer_email": "buyer@example.com"})
        assert r.status_code == 200, r.text
        assert r.json()["ok"] is True
        # verify via track
        t = client.get(f"{API}/orders/track",
                       params={"order_number": o["order_number"], "phone": o["phone"]})
        assert t.status_code == 200
        td = t.json()
        assert td["payment_status"] == "paid"
        assert any(ev["status"] == "confirmed" for ev in td["timeline"])

    def test_paypal_capture_not_found(self, client):
        r = client.post(f"{API}/orders/nonexistent-id/paypal-capture",
                        json={"capture_id": "x"})
        assert r.status_code == 404


# ------------------ Admin Coupons CRUD ------------------
class TestAdminCouponsCRUD:
    def test_requires_auth(self, client):
        r = client.get(f"{API}/admin/coupons")
        assert r.status_code in (401, 403)

    def test_list_includes_seeded(self, client, auth):
        r = client.get(f"{API}/admin/coupons", headers=auth)
        assert r.status_code == 200
        codes = [c["code"] for c in r.json()]
        assert "GLOW10" in codes
        assert "WELCOME5" in codes

    def test_crud_lifecycle(self, client, auth):
        code = f"TEST{uuid.uuid4().hex[:5].upper()}"
        # create
        r = client.post(f"{API}/admin/coupons", headers=auth, json={
            "code": code, "type": "percent", "value": 20, "min_subtotal": 0,
            "active": True, "description": "TEST coupon"
        })
        assert r.status_code == 200, r.text
        c = r.json()
        cid = c["id"]
        assert c["code"] == code
        # duplicate
        r2 = client.post(f"{API}/admin/coupons", headers=auth, json={
            "code": code, "type": "percent", "value": 20
        })
        assert r2.status_code == 400
        # toggle off
        u = client.put(f"{API}/admin/coupons/{cid}", headers=auth, json={"active": False})
        assert u.status_code == 200 and u.json()["active"] is False
        # validate should fail when inactive
        v = client.post(f"{API}/coupons/validate", json={"code": code, "subtotal": 100})
        assert v.status_code == 404
        # toggle on
        u2 = client.put(f"{API}/admin/coupons/{cid}", headers=auth, json={"active": True})
        assert u2.status_code == 200 and u2.json()["active"] is True
        # delete
        d = client.delete(f"{API}/admin/coupons/{cid}", headers=auth)
        assert d.status_code == 200


# ------------------ Store country ------------------
class TestStoreCountry:
    def test_change_country_and_revert(self, client, auth):
        original = client.get(f"{API}/admin/settings", headers=auth).json()
        original_country = original.get("store_country", "US")
        try:
            updated = dict(original)
            updated["store_country"] = "IN"
            updated["custom_states"] = []
            r = client.put(f"{API}/admin/settings", headers=auth, json=updated)
            assert r.status_code == 200, r.text
            # verify public reflects
            pub = client.get(f"{API}/settings").json()
            assert pub["store_country"] == "IN"
        finally:
            # revert
            cur = client.get(f"{API}/admin/settings", headers=auth).json()
            cur["store_country"] = original_country
            client.put(f"{API}/admin/settings", headers=auth, json=cur)
            pub2 = client.get(f"{API}/settings").json()
            assert pub2["store_country"] == original_country
