"""Iteration 5 — Defensive regression smoke after deploy.sh edit.

Only /app/deploy.sh was modified (VPS install path; preview pod doesn't run it).
This run confirms nothing broke in the running preview at
REACT_APP_BACKEND_URL=https://flame-glow-demo.preview.emergentagent.com.

Coverage:
  1. GET /api/settings: 200, offers contains single/couple/gift, payment_options
     present, product.main_image is non-empty URL.
  2. POST /api/admin/login: returns token with documented credentials.
  3. Frontend GET / : 200, HTML contains 'GlowCamp' and SPA root.
  4. Frontend GET /product: 200, SPA served (client renders Buy Now).
  5. Frontend GET /checkout: 200, SPA served.
  6. Regression: POST /api/orders with offer_key='single' (cod) returns 200/201.
  7. Product main_image URL is reachable (HEAD/GET returns 200, not 404).
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@glowcamp.com"
ADMIN_PASS = "GlowCamp@2026"
TIMEOUT = 25


@pytest.fixture(scope="module")
def public_settings():
    r = requests.get(f"{API}/settings", timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(
        f"{API}/admin/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASS},
        timeout=TIMEOUT,
    )
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    data = r.json()
    tok = data.get("token")
    assert isinstance(tok, str) and len(tok) > 10
    return tok


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# 1. Settings shape + content
class TestSettings:
    def test_status_and_keys(self, public_settings):
        d = public_settings
        for k in ("product", "offers", "payment_options"):
            assert k in d, f"missing {k}"
        assert isinstance(d["offers"], list)
        assert isinstance(d["payment_options"], dict)

    def test_offers_have_single_couple_gift(self, public_settings):
        keys = [o.get("key") for o in public_settings.get("offers", [])]
        for required in ("single", "couple", "gift"):
            assert required in keys, f"offer '{required}' missing. Got {keys}"

    def test_payment_options_keys(self, public_settings):
        po = public_settings["payment_options"]
        # cod and card are the operational toggles for the live store
        assert "cod" in po and "card" in po

    def test_product_main_image_present(self, public_settings):
        product = public_settings.get("product") or {}
        main_image = product.get("main_image") or ""
        assert isinstance(main_image, str) and main_image.startswith("http"), (
            f"product.main_image missing/invalid: {main_image!r}"
        )


# 2. Admin login
class TestAdminLogin:
    def test_login_returns_token(self, admin_token):
        assert isinstance(admin_token, str) and len(admin_token) > 10


# 3-5. Frontend smoke
class TestFrontendSmoke:
    def test_home_renders(self):
        r = requests.get(f"{BASE_URL}/", timeout=TIMEOUT)
        assert r.status_code == 200, r.text[:300]
        body = r.text
        assert "GlowCamp" in body or "glowcamp" in body.lower()
        assert 'id="root"' in body, "SPA root marker missing"

    def test_product_route_serves_spa(self):
        r = requests.get(f"{BASE_URL}/product", timeout=TIMEOUT)
        assert r.status_code == 200, r.text[:300]
        assert 'id="root"' in r.text

    def test_checkout_route_serves_spa(self):
        r = requests.get(f"{BASE_URL}/checkout", timeout=TIMEOUT)
        assert r.status_code == 200, r.text[:300]
        assert 'id="root"' in r.text


# 6. Orders regression
class TestOrdersRegression:
    def test_post_order_single_cod_succeeds(self, public_settings):
        offer = next(
            (o for o in public_settings.get("offers", []) if o.get("key") == "single"),
            None,
        )
        assert offer is not None, "single offer not found"
        unit_price = float(offer.get("price") or 29.99)

        payload = {
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
                    "offer_key": "single",
                    "title": offer.get("title") or "GlowCamp Flame Lamp",
                    "quantity": 1,
                    "unit_price": unit_price,
                    "line_total": unit_price,
                }
            ],
            "payment_method": "cod",
            "custom_fields": {},
        }
        r = requests.post(f"{API}/orders", json=payload, timeout=TIMEOUT)
        assert r.status_code in (200, 201), (
            f"order POST failed: {r.status_code} {r.text[:400]}"
        )
        order = r.json()
        # Basic shape check on returned order
        assert order.get("payment_method") == "cod"
        items = order.get("items") or []
        assert items and items[0].get("offer_key") == "single"


# 7. main_image URL reachable (no 404 on the asset)
class TestMainImageReachable:
    def test_main_image_url_returns_200(self, public_settings):
        url = (public_settings.get("product") or {}).get("main_image") or ""
        assert url, "no main_image to fetch"
        # HEAD may not be supported by signed asset hosts; fall back to GET stream.
        r = requests.get(url, stream=True, timeout=TIMEOUT)
        assert r.status_code == 200, f"main_image fetch failed: {r.status_code} {url}"
        ctype = r.headers.get("Content-Type", "")
        assert "image" in ctype.lower() or "octet-stream" in ctype.lower(), (
            f"main_image not an image content-type: {ctype}"
        )
