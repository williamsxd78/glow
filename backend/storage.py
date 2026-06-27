"""Emergent Object Storage wrapper.

Lazy-initialized session key. Used only by authenticated admin endpoints
that upload assets (gallery images, coupon visuals, product images).
"""
from __future__ import annotations
import os
import logging
import requests

log = logging.getLogger("storage")

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"

_storage_key: str | None = None


def app_name() -> str:
    return os.environ.get("APP_NAME", "glowcamp")


def _init() -> str:
    """Initialize session key (idempotent)."""
    global _storage_key
    if _storage_key:
        return _storage_key
    key = os.environ.get("EMERGENT_LLM_KEY", "")
    if not key:
        raise RuntimeError("EMERGENT_LLM_KEY missing in backend/.env")
    resp = requests.post(
        f"{STORAGE_URL}/init",
        json={"emergent_key": key},
        timeout=30,
    )
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    log.info("Object storage initialized")
    return _storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = _init()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120,
    )
    if resp.status_code == 403:
        global _storage_key
        _storage_key = None
        key = _init()
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data,
            timeout=120,
        )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str) -> tuple[bytes, str]:
    key = _init()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key},
        timeout=60,
    )
    if resp.status_code == 403:
        global _storage_key
        _storage_key = None
        key = _init()
        resp = requests.get(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key},
            timeout=60,
        )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")
