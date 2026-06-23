"""GlowCamp backend regression tests.

Covers:
- Public endpoints: /, /settings, /reviews, /faqs, /gallery
- Order create + track
- Admin login + JWT protection on admin endpoints
- Admin CRUD: reviews, faqs, gallery, settings update
"""
import os
import uuid

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://flame-glow-demo.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@glowcamp.com"
ADMIN_PASSWORD = "GlowCamp@2026"


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(client):
    r = client.post(f"{API}/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    data = r.json()
    assert "token" in data and isinstance(data["token"], str) and len(data["token"]) > 10
    return data["token"]


@pytest.fixture
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# -------------------- Public --------------------
class TestPublic:
    def test_root(self, client):
        r = client.get(f"{API}/")
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_settings(self, client):
        r = client.get(f"{API}/settings")
        assert r.status_code == 200
        d = r.json()
        assert "product" in d and "offers" in d
        assert d["product"]["sale_price"] == 29.99
        assert d["product"]["original_price"] == 59.99
        keys = sorted([o["key"] for o in d["offers"]])
        assert keys == ["couple", "gift", "single"]
        assert d["payment_options"]["cod"] is True
        assert d["free_shipping_threshold"] == 50.0

    def test_reviews(self, client):
        r = client.get(f"{API}/reviews")
        assert r.status_code == 200
        rv = r.json()
        assert isinstance(rv, list) and len(rv) >= 10
        for it in rv:
            assert "name" in it and "rating" in it and "comment" in it

    def test_faqs(self, client):
        r = client.get(f"{API}/faqs")
        assert r.status_code == 200
        f = r.json()
        assert isinstance(f, list) and len(f) >= 10

    def test_gallery(self, client):
        r = client.get(f"{API}/gallery")
        assert r.status_code == 200
        g = r.json()
        assert isinstance(g, list) and len(g) >= 8


# -------------------- Orders --------------------
class TestOrders:
    def test_create_order_cod_single(self, client):
        payload = {
            "full_name": "TEST_Buyer",
            "phone": "5551234567",
            "email": "TEST_buyer@example.com",
            "address": "123 Test St",
            "city": "Austin",
            "state": "TX",
            "pincode": "73301",
            "items": [{"offer_key": "single", "title": "Single GlowCamp Lamp", "quantity": 1, "unit_price": 29.99, "line_total": 29.99}],
            "payment_method": "cod",
        }
        r = client.post(f"{API}/orders", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["order_number"].startswith("GC-")
        assert d["payment_status"] == "pending"
        assert d["status"] == "placed"
        assert d["subtotal"] == 29.99
        # subtotal 29.99 < 50 free shipping threshold, expect shipping 5.0
        assert d["shipping"] == 5.0
        assert d["total"] == 34.99
        # store for track test
        pytest.glowcamp_order = d

    def test_create_order_free_shipping(self, client):
        payload = {
            "full_name": "TEST_Buyer2",
            "phone": "5559876543",
            "email": "TEST_buyer2@example.com",
            "address": "456 Hill Rd",
            "city": "Denver",
            "state": "CO",
            "pincode": "80014",
            "items": [{"offer_key": "couple", "title": "Couple Pack", "quantity": 1, "unit_price": 54.99, "line_total": 54.99}],
            "payment_method": "cod",
        }
        r = client.post(f"{API}/orders", json=payload)
        assert r.status_code == 200
        d = r.json()
        assert d["subtotal"] == 54.99
        assert d["shipping"] == 0  # >= 50 threshold
        assert d["total"] == 54.99

    def test_create_order_invalid_offer(self, client):
        payload = {
            "full_name": "TEST_x", "phone": "5550000000", "email": "x@example.com",
            "address": "a", "city": "a", "state": "CA", "pincode": "90001",
            "items": [{"offer_key": "bogus", "title": "x", "quantity": 1, "unit_price": 1, "line_total": 1}],
            "payment_method": "cod",
        }
        r = client.post(f"{API}/orders", json=payload)
        assert r.status_code == 400

    def test_create_order_empty_items(self, client):
        payload = {
            "full_name": "TEST_y", "phone": "5551111111", "email": "y@example.com",
            "address": "a", "city": "a", "state": "CA", "pincode": "90001",
            "items": [], "payment_method": "cod",
        }
        r = client.post(f"{API}/orders", json=payload)
        # Pydantic might reject empty items if min_length=1 not set -> server raises 400 manually
        assert r.status_code in (400, 422)

    def test_track_order_success(self, client):
        o = getattr(pytest, "glowcamp_order", None)
        if not o:
            pytest.skip("order from previous test missing")
        r = client.get(f"{API}/orders/track", params={"order_number": o["order_number"], "phone": o["phone"]})
        assert r.status_code == 200
        assert r.json()["order_number"] == o["order_number"]

    def test_track_order_not_found(self, client):
        r = client.get(f"{API}/orders/track", params={"order_number": "GC-BOGUS", "phone": "0000000000"})
        assert r.status_code == 404


# -------------------- Admin Auth --------------------
class TestAdminAuth:
    def test_login_success(self, client):
        r = client.post(f"{API}/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        assert "token" in r.json()

    def test_login_bad_password(self, client):
        r = client.post(f"{API}/admin/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_protected_missing_token(self, client):
        r = client.get(f"{API}/admin/me")
        assert r.status_code in (401, 403)

    def test_protected_invalid_token(self, client):
        r = client.get(f"{API}/admin/me", headers={"Authorization": "Bearer bogus.token.value"})
        assert r.status_code == 401

    def test_admin_me(self, client, auth_headers):
        r = client.get(f"{API}/admin/me", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL


# -------------------- Admin Dashboard / Orders --------------------
class TestAdminOrders:
    def test_dashboard(self, client, auth_headers):
        r = client.get(f"{API}/admin/dashboard", headers=auth_headers)
        assert r.status_code == 200
        d = r.json()
        for k in ["total_orders", "pending_orders", "shipped_orders", "delivered_orders",
                  "cancelled_orders", "paid_orders", "total_revenue", "stock"]:
            assert k in d

    def test_list_orders(self, client, auth_headers):
        r = client.get(f"{API}/admin/orders", headers=auth_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_update_order_status(self, client, auth_headers):
        # create an order to mutate
        payload = {
            "full_name": "TEST_StatusBuyer", "phone": "5552223333", "email": "TEST_s@example.com",
            "address": "1 main", "city": "Reno", "state": "NV", "pincode": "89501",
            "items": [{"offer_key": "gift", "title": "Gift Pack", "quantity": 1, "unit_price": 34.99, "line_total": 34.99}],
            "payment_method": "cod",
        }
        o = client.post(f"{API}/orders", json=payload).json()
        r = client.put(f"{API}/admin/orders/{o['id']}/status",
                       headers=auth_headers, json={"status": "confirmed", "note": "verified phone"})
        assert r.status_code == 200
        upd = r.json()
        assert upd["status"] == "confirmed"
        assert any(ev["status"] == "confirmed" for ev in upd["timeline"])

    def test_update_payment_status(self, client, auth_headers):
        payload = {
            "full_name": "TEST_PayBuyer", "phone": "5554445555", "email": "TEST_p@example.com",
            "address": "1 main", "city": "Reno", "state": "NV", "pincode": "89501",
            "items": [{"offer_key": "single", "title": "x", "quantity": 1, "unit_price": 29.99, "line_total": 29.99}],
            "payment_method": "cod",
        }
        o = client.post(f"{API}/orders", json=payload).json()
        r = client.put(f"{API}/admin/orders/{o['id']}/payment",
                       headers=auth_headers, json={"payment_status": "paid"})
        assert r.status_code == 200

    def test_orders_csv_export(self, client, auth_headers):
        r = client.get(f"{API}/admin/orders/export.csv", headers=auth_headers)
        assert r.status_code == 200
        assert "order_number" in r.text.splitlines()[0]


# -------------------- Admin Reviews / FAQs / Gallery --------------------
class TestAdminCRUD:
    def test_review_create_update_delete(self, client, auth_headers):
        payload = {"name": "TEST_Reviewer", "location": "Test City", "rating": 5, "title": "TEST_T", "comment": "TEST_C"}
        r = client.post(f"{API}/admin/reviews", headers=auth_headers, json=payload)
        assert r.status_code == 200
        rid = r.json()["id"]
        # update
        u = client.put(f"{API}/admin/reviews/{rid}", headers=auth_headers, json={"title": "TEST_T2"})
        assert u.status_code == 200 and u.json()["title"] == "TEST_T2"
        # list
        ls = client.get(f"{API}/admin/reviews", headers=auth_headers)
        assert ls.status_code == 200 and any(x["id"] == rid for x in ls.json())
        # delete
        d = client.delete(f"{API}/admin/reviews/{rid}", headers=auth_headers)
        assert d.status_code == 200

    def test_faq_create_update_delete(self, client, auth_headers):
        p = {"question": "TEST_Q", "answer": "TEST_A", "order": 99}
        r = client.post(f"{API}/admin/faqs", headers=auth_headers, json=p)
        assert r.status_code == 200
        fid = r.json()["id"]
        u = client.put(f"{API}/admin/faqs/{fid}", headers=auth_headers, json={"answer": "TEST_A2"})
        assert u.status_code == 200 and u.json()["answer"] == "TEST_A2"
        d = client.delete(f"{API}/admin/faqs/{fid}", headers=auth_headers)
        assert d.status_code == 200

    def test_gallery_create_update_delete(self, client, auth_headers):
        p = {"url": f"https://example.com/test-{uuid.uuid4().hex[:6]}.jpg", "alt": "TEST_alt", "order": 50}
        r = client.post(f"{API}/admin/gallery", headers=auth_headers, json=p)
        assert r.status_code == 200
        gid = r.json()["id"]
        u = client.put(f"{API}/admin/gallery/{gid}", headers=auth_headers, json={"alt": "TEST_alt2"})
        assert u.status_code == 200 and u.json()["alt"] == "TEST_alt2"
        d = client.delete(f"{API}/admin/gallery/{gid}", headers=auth_headers)
        assert d.status_code == 200


# -------------------- Admin Settings --------------------
class TestAdminSettings:
    def test_get_settings_admin(self, client, auth_headers):
        r = client.get(f"{API}/admin/settings", headers=auth_headers)
        assert r.status_code == 200
        d = r.json()
        # admin view exposes secrets keys (empty strings ok)
        assert "smtp" in d and "payment" in d
        assert "paypal_client_id" in d["payment"]

    def test_update_settings_persists_to_public(self, client, auth_headers):
        # fetch current
        cur = client.get(f"{API}/admin/settings", headers=auth_headers).json()
        new_announcement = f"TEST_announcement_{uuid.uuid4().hex[:6]}"
        cur["announcement"]["text"] = new_announcement
        r = client.put(f"{API}/admin/settings", headers=auth_headers, json=cur)
        assert r.status_code == 200, r.text
        # verify public endpoint reflects the change
        pub = client.get(f"{API}/settings").json()
        assert pub["announcement"]["text"] == new_announcement
