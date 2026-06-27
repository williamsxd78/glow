"""Iteration 3 tests: dynamic card capture filter, admin uploads, file serve."""
import io
import os
import struct
import zlib
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://flame-glow-demo.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@glowcamp.com"
ADMIN_PASS = "GlowCamp@2026"


def _tiny_png() -> bytes:
    # Minimal 1x1 transparent PNG
    sig = b"\x89PNG\r\n\x1a\n"
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    ihdr = struct.pack(">IIBBBBB", 1, 1, 8, 6, 0, 0, 0)
    raw = b"\x00\x00\x00\x00\x00"
    idat = zlib.compress(raw)
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data and isinstance(data["token"], str) and data["token"]
    return data["token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ===================== Settings: card_extra_fields with capture =====================
class TestCardCapture:
    def test_get_settings_has_card_extra_fields(self):
        r = requests.get(f"{API}/settings", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "card_extra_fields" in data
        assert isinstance(data["card_extra_fields"], list)

    def test_put_settings_with_capture_flags(self, admin_headers):
        s = requests.get(f"{API}/admin/settings", headers=admin_headers, timeout=15).json()
        s["card_extra_fields"] = [
            {"key": "TEST_cardholder", "label": "Cardholder Name", "type": "text",
             "placeholder": "", "required": True, "full_width": True, "capture": True, "order": 0},
            {"key": "TEST_promo", "label": "Promo Note", "type": "text",
             "placeholder": "", "required": False, "full_width": False, "capture": False, "order": 1},
        ]
        r = requests.put(f"{API}/admin/settings", json=s, headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text

        # Verify GET reflects what we saved
        g = requests.get(f"{API}/settings", timeout=15).json()
        keys = {f["key"]: f for f in g["card_extra_fields"]}
        assert "TEST_cardholder" in keys and keys["TEST_cardholder"]["capture"] is True
        assert "TEST_promo" in keys and keys["TEST_promo"]["capture"] is False

    def test_order_drops_non_capture_fields(self):
        payload = {
            "full_name": "TEST_Capture User",
            "phone": "5551112222",
            "email": "test_capture@example.com",
            "address": "1 Test St", "city": "Austin", "state": "TX", "pincode": "73301",
            "landmark": "",
            "items": [{"offer_key": "single", "title": "x", "quantity": 1, "unit_price": 29.99, "line_total": 29.99}],
            "payment_method": "card",
            "custom_fields": {
                "TEST_cardholder": "John Doe",
                "TEST_promo": "SHOULD_BE_DROPPED",
            },
        }
        r = requests.post(f"{API}/orders", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        order = r.json()
        cf = order.get("custom_fields", {})
        assert cf.get("TEST_cardholder") == "John Doe"
        assert "TEST_promo" not in cf, f"capture=false field leaked: {cf}"


# ===================== Admin Uploads =====================
class TestUploads:
    def test_upload_requires_admin(self):
        png = _tiny_png()
        files = {"file": ("test.png", io.BytesIO(png), "image/png")}
        r = requests.post(f"{API}/admin/uploads", files=files, timeout=30)
        assert r.status_code in (401, 403)

    def test_upload_rejects_non_image(self, admin_headers):
        files = {"file": ("hack.txt", io.BytesIO(b"not an image"), "text/plain")}
        r = requests.post(f"{API}/admin/uploads", files=files, headers=admin_headers, timeout=30)
        assert r.status_code == 400

    def test_upload_png_and_serve(self, admin_headers):
        png = _tiny_png()
        files = {"file": ("tiny.png", io.BytesIO(png), "image/png")}
        r = requests.post(f"{API}/admin/uploads", files=files, headers=admin_headers, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "url" in data and data["url"].startswith("/api/files/")
        assert "path" in data
        assert data.get("size", 0) > 0

        # Now GET the file via public endpoint
        full = f"{BASE_URL}{data['url']}"
        g = requests.get(full, timeout=30)
        assert g.status_code == 200, g.text
        assert g.headers.get("Content-Type", "").startswith("image/png")
        assert len(g.content) == data["size"]

    def test_upload_rejects_oversize(self, admin_headers):
        # 9 MB junk (won't be a real png but content-type check uses header only,
        # and size check happens before any validation past content_type).
        big = b"\x89PNG\r\n\x1a\n" + b"0" * (9 * 1024 * 1024)
        files = {"file": ("big.png", io.BytesIO(big), "image/png")}
        r = requests.post(f"{API}/admin/uploads", files=files, headers=admin_headers, timeout=60)
        assert r.status_code == 400


# ===================== Cleanup =====================
def test_cleanup_extra_fields(admin_headers=None):
    """Reset card_extra_fields to empty so the public site shows empty-state banner."""
    h = {"Authorization": f"Bearer " + requests.post(
        f"{API}/admin/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASS},
        timeout=15,
    ).json()["token"]}
    s = requests.get(f"{API}/admin/settings", headers=h, timeout=15).json()
    s["card_extra_fields"] = []
    r = requests.put(f"{API}/admin/settings", json=s, headers=h, timeout=15)
    assert r.status_code == 200
