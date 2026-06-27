"""GlowCamp ecommerce backend."""
from __future__ import annotations

import asyncio
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorClient
from starlette.middleware.cors import CORSMiddleware

from auth import create_token, require_admin, verify_password
from email_util import render, send_email
from models import (
    AdminLogin,
    CartSession,
    CartSessionCreate,
    Coupon,
    CouponCreate,
    CouponValidateRequest,
    FaqCreate,
    Faq,
    GalleryCreate,
    GalleryItem,
    Order,
    OrderCreate,
    OrderItem,
    OrderTimelineEvent,
    PublicSettings,
    ReviewCreate,
    Review,
    Settings,
)
from seed import run_all_seeds

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("glowcamp")

mongo_url = os.environ["MONGO_URL"]
mongo_client = AsyncIOMotorClient(mongo_url)
db = mongo_client[os.environ["DB_NAME"]]


@asynccontextmanager
async def lifespan(_app: FastAPI):
    try:
        await run_all_seeds(db)
        logger.info("Seed data ensured")
    except Exception as e:
        logger.exception("Seed failed: %s", e)
    task = asyncio.create_task(cart_recovery_loop())
    yield
    task.cancel()
    mongo_client.close()


app = FastAPI(title="GlowCamp API", lifespan=lifespan)
api = APIRouter(prefix="/api")


# ============================== Helpers ==============================
async def get_settings_doc() -> Settings:
    doc = await db.settings.find_one({"id": "global"}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=500, detail="Settings not initialized")
    return Settings(**doc)


def _isonow() -> str:
    return datetime.now(timezone.utc).isoformat()


async def cart_recovery_scan() -> int:
    """One pass of the recovery scanner. Returns number of emails sent."""
    s = await get_settings_doc()
    cr = s.cart_recovery
    if not cr.enabled or not s.smtp.enabled:
        return 0
    now = datetime.now(timezone.utc)
    older_than = (now - timedelta(minutes=cr.delay_minutes)).isoformat()
    younger_than = (now - timedelta(hours=cr.max_age_hours)).isoformat()
    cursor = db.cart_sessions.find({
        "reminder_sent": False,
        "converted": False,
        "updated_at": {"$lte": older_than, "$gte": younger_than},
    })
    sent = 0
    base_url = (s.site_url or "").rstrip("/")
    tpl = s.email_templates.cart_recovery
    async for c in cursor:
        try:
            resume_url = (
                f"{base_url}/cart?resume={c['id']}"
                if base_url else f"/cart?resume={c['id']}"
            )
            ctx = {
                "name": c.get("name") or c["email"].split("@")[0],
                "email": c["email"],
                "resume_url": resume_url,
                "item_count": sum(i["quantity"] for i in c["items"]),
                "subtotal": f"{c['subtotal']:.2f}",
            }
            ok = send_email(s.smtp.model_dump(), c["email"], render(tpl.subject, ctx), render(tpl.body, ctx))
            await db.cart_sessions.update_one(
                {"id": c["id"]},
                {"$set": {"reminder_sent": True, "reminder_sent_at": _isonow()}},
            )
            if ok:
                sent += 1
        except Exception as e:
            logger.exception("recovery send failed: %s", e)
    return sent


async def cart_recovery_loop():
    """Periodic background task. Errors are logged but never crash the loop."""
    await asyncio.sleep(15)
    while True:
        try:
            sent = await cart_recovery_scan()
            if sent:
                logger.info("Cart recovery: sent %d reminder(s)", sent)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Cart recovery loop iteration failed")
        await asyncio.sleep(60)



def public_view(s: Settings) -> PublicSettings:
    return PublicSettings(
        product=s.product,
        offers=s.offers,
        seo=s.seo,
        announcement=s.announcement,
        countdown=s.countdown,
        video_url=s.video_url,
        video_caption=s.video_caption,
        whatsapp_number=s.whatsapp_number,
        whatsapp_message=s.whatsapp_message,
        social=s.social,
        payment_options={
            "paypal": s.payment.paypal_enabled,
            "stripe": s.payment.stripe_enabled,
            "razorpay": s.payment.razorpay_enabled,
            "manual_upi": s.payment.manual_upi_enabled,
            "cod": s.payment.cod_enabled,
            "cod_advance_enabled": s.payment.cod_advance_enabled,
            "cod_advance_amount": s.payment.cod_advance_amount,
        },
        shipping_charge=s.payment.shipping_charge,
        free_shipping_threshold=s.payment.free_shipping_threshold,
        store_country=s.store_country,
        custom_states=s.custom_states,
        paypal_client_id=s.payment.paypal_client_id,
        paypal_mode=s.payment.paypal_mode,
        card_billing_email_enabled=s.card_billing_email_enabled,
        card_billing_phone_enabled=s.card_billing_phone_enabled,
        card_extra_fields=s.card_extra_fields,
    )


# ============================== Public ==============================
@api.get("/")
async def root():
    return {"name": "GlowCamp API", "ok": True}


@api.get("/settings", response_model=PublicSettings)
async def public_settings():
    s = await get_settings_doc()
    return public_view(s)


@api.get("/reviews", response_model=List[Review])
async def list_reviews(limit: int = 100):
    docs = await db.reviews.find({"hidden": False}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return [Review(**d) for d in docs]


@api.get("/faqs", response_model=List[Faq])
async def list_faqs():
    docs = await db.faqs.find({"hidden": False}, {"_id": 0}).sort("order", 1).to_list(200)
    return [Faq(**d) for d in docs]


@api.get("/gallery", response_model=List[GalleryItem])
async def list_gallery():
    docs = await db.gallery.find({}, {"_id": 0}).sort("order", 1).to_list(200)
    return [GalleryItem(**d) for d in docs]


@api.post("/orders", response_model=Order)
async def create_order(payload: OrderCreate):
    s = await get_settings_doc()
    if not payload.items:
        raise HTTPException(status_code=400, detail="No items in order")
    offer_map = {o.key: o for o in s.offers}
    subtotal = 0.0
    validated: List[OrderItem] = []
    for it in payload.items:
        if it.offer_key not in offer_map:
            raise HTTPException(status_code=400, detail=f"Unknown offer {it.offer_key}")
        offer = offer_map[it.offer_key]
        line = round(offer.price * it.quantity, 2)
        subtotal += line
        validated.append(OrderItem(
            offer_key=it.offer_key,
            title=offer.title,
            quantity=it.quantity,
            unit_price=offer.price,
            line_total=line,
        ))
    subtotal = round(subtotal, 2)

    # Coupon
    discount = 0.0
    applied_code = ""
    if payload.coupon_code:
        code = payload.coupon_code.strip().upper()
        coupon = await db.coupons.find_one({"code": code, "active": True})
        if coupon:
            if subtotal >= coupon.get("min_subtotal", 0):
                if coupon.get("usage_limit", 0) == 0 or coupon.get("usage_count", 0) < coupon["usage_limit"]:
                    if coupon["type"] == "percent":
                        discount = round(subtotal * (coupon["value"] / 100.0), 2)
                    else:
                        discount = round(min(coupon["value"], subtotal), 2)
                    applied_code = code
                    await db.coupons.update_one({"id": coupon["id"]}, {"$inc": {"usage_count": 1}})

    discounted_subtotal = max(0.0, subtotal - discount)
    shipping = 0.0 if discounted_subtotal >= s.payment.free_shipping_threshold else s.payment.shipping_charge
    cod_advance = (
        s.payment.cod_advance_amount
        if payload.payment_method == "cod" and s.payment.cod_advance_enabled
        else 0.0
    )
    total = round(discounted_subtotal + shipping, 2)

    order = Order(
        full_name=payload.full_name,
        phone=payload.phone,
        email=payload.email,
        address=payload.address,
        city=payload.city,
        state=payload.state,
        pincode=payload.pincode,
        landmark=payload.landmark or "",
        items=validated,
        subtotal=subtotal,
        discount=discount,
        coupon_code=applied_code,
        shipping=shipping,
        cod_advance=cod_advance,
        total=total,
        payment_method=payload.payment_method,
        payment_status="pending",
        status="placed",
        notes=payload.notes or "",
        billing_email=(payload.billing_email or "").strip(),
        billing_phone=(payload.billing_phone or "").strip(),
        custom_fields=payload.custom_fields or {},
        timeline=[OrderTimelineEvent(status="placed", note="Order received")],
    )
    await db.orders.insert_one(order.model_dump())

    # Mark any open cart-recovery session for this email as converted
    try:
        await db.cart_sessions.update_many(
            {"email": order.email.lower(), "converted": False},
            {"$set": {"converted": True}},
        )
    except Exception as e:
        logger.warning("cart session convert skipped: %s", e)


    # Mark any open cart-recovery session for this email as converted
    try:
        await db.cart_sessions.update_many(
            {"email": order.email.lower(), "converted": False},
            {"$set": {"converted": True}},
        )
    except Exception as e:
        logger.warning("cart session convert skipped: %s", e)

    # Try send confirmation email with rich context including tracking link
    try:
        tpl = s.email_templates.order_confirmation
        base_url = (s.site_url or "").rstrip("/")
        tracking_url = (
            f"{base_url}/track-order?o={order.order_number}&k={order.tracking_token}"
            if base_url
            else f"/track-order?o={order.order_number}&k={order.tracking_token}"
        )
        ctx = {
            "name": order.full_name,
            "order_id": order.order_number,
            "tracking_url": tracking_url,
            "tracking_token": order.tracking_token,
            "total": f"{order.total:.2f}",
            "subtotal": f"{order.subtotal:.2f}",
            "shipping": f"{order.shipping:.2f}",
            "discount": f"{order.discount:.2f}",
            "item_count": sum(i.quantity for i in order.items),
        }
        body = render(tpl.body, ctx)
        send_email(s.smtp.model_dump(), order.email, render(tpl.subject, ctx), body)
    except Exception as e:
        logger.warning("Email send skipped: %s", e)
    return order


@api.post("/cart-sessions")
async def upsert_cart_session(payload: CartSessionCreate):
    """Save / update a cart-recovery session. Idempotent per email."""
    existing = await db.cart_sessions.find_one({"email": payload.email.lower()})
    now = _isonow()
    if existing:
        await db.cart_sessions.update_one(
            {"id": existing["id"]},
            {"$set": {
                "name": payload.name or existing.get("name", ""),
                "items": [i.model_dump() for i in payload.items],
                "subtotal": payload.subtotal,
                "updated_at": now,
                "reminder_sent": False,
                "reminder_sent_at": None,
                "converted": False,
            }},
        )
        return {"id": existing["id"]}
    cs = CartSession(
        email=payload.email.lower(),
        name=payload.name or "",
        items=payload.items,
        subtotal=payload.subtotal,
    )
    await db.cart_sessions.insert_one(cs.model_dump())
    return {"id": cs.id}


@api.get("/cart-sessions/{cid}")
async def get_cart_session(cid: str):
    doc = await db.cart_sessions.find_one({"id": cid}, {"_id": 0, "email": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Cart session not found")
    return doc



@api.get("/orders/track")
async def track_order(
    order_number: str = Query(...),
    phone: Optional[str] = Query(None),
    key: Optional[str] = Query(None),
):
    """Find an order by order_number + (phone OR tracking_token key)."""
    q = {"order_number": order_number.upper().strip()}
    if key:
        q["tracking_token"] = key.strip().upper()
    elif phone:
        q["phone"] = phone.strip()
    else:
        raise HTTPException(status_code=400, detail="phone or key is required")
    doc = await db.orders.find_one(q, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    return doc


@api.post("/coupons/validate")
async def validate_coupon(payload: CouponValidateRequest):
    code = payload.code.strip().upper()
    coupon = await db.coupons.find_one({"code": code, "active": True}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    if payload.subtotal < coupon.get("min_subtotal", 0):
        raise HTTPException(
            status_code=400,
            detail=f"Add ${coupon['min_subtotal'] - payload.subtotal:.2f} more to use this coupon",
        )
    if coupon.get("usage_limit", 0) and coupon.get("usage_count", 0) >= coupon["usage_limit"]:
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")
    if coupon["type"] == "percent":
        discount = round(payload.subtotal * (coupon["value"] / 100.0), 2)
    else:
        discount = round(min(coupon["value"], payload.subtotal), 2)
    return {
        "code": coupon["code"],
        "type": coupon["type"],
        "value": coupon["value"],
        "discount": discount,
        "description": coupon.get("description", ""),
    }


@api.post("/orders/{order_id}/paypal-capture")
async def paypal_mark_paid(order_id: str, body: dict):
    """Frontend reports a successful PayPal capture. We trust the client for now;
    when merchant adds server-side keys later, webhooks can verify."""
    capture_id = body.get("capture_id") or body.get("order_id") or ""
    payer_email = body.get("payer_email", "")
    res = await db.orders.update_one(
        {"id": order_id},
        {
            "$set": {
                "payment_status": "paid",
                "paypal_capture_id": capture_id,
                "paypal_payer_email": payer_email,
            },
            "$push": {
                "timeline": OrderTimelineEvent(
                    status="confirmed",
                    note=f"PayPal payment captured ({capture_id[:12] if capture_id else 'n/a'})",
                ).model_dump()
            },
        },
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"ok": True}


# ============================== Admin Auth ==============================
@api.post("/admin/login")
async def admin_login(payload: AdminLogin):
    admin = await db.admins.find_one({"email": payload.email.lower()})
    if not admin or not verify_password(payload.password, admin["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(admin["id"], admin["email"])
    return {"token": token, "email": admin["email"]}


@api.get("/admin/me")
async def admin_me(user=Depends(require_admin)):
    return {"id": user["sub"], "email": user["email"]}


# ============================== Admin Settings ==============================
@api.get("/admin/settings", response_model=Settings)
async def admin_get_settings(user=Depends(require_admin)):
    return await get_settings_doc()


@api.put("/admin/settings", response_model=Settings)
async def admin_update_settings(payload: Settings, user=Depends(require_admin)):
    payload.id = "global"
    payload.updated_at = datetime.now(timezone.utc).isoformat()
    await db.settings.update_one({"id": "global"}, {"$set": payload.model_dump()}, upsert=True)
    return payload


# ============================== Admin Dashboard ==============================
@api.get("/admin/dashboard")
async def admin_dashboard(user=Depends(require_admin)):
    total_orders = await db.orders.count_documents({})
    pending = await db.orders.count_documents({"status": {"$in": ["placed", "confirmed", "packed"]}})
    shipped = await db.orders.count_documents({"status": {"$in": ["shipped", "out_for_delivery"]}})
    delivered = await db.orders.count_documents({"status": "delivered"})
    cancelled = await db.orders.count_documents({"status": "cancelled"})
    paid = await db.orders.count_documents({"payment_status": "paid"})
    pipe = await db.orders.aggregate([
        {"$match": {"status": {"$ne": "cancelled"}}},
        {"$group": {"_id": None, "s": {"$sum": "$total"}}},
    ]).to_list(1)
    revenue = pipe[0]["s"] if pipe else 0
    s = await get_settings_doc()
    return {
        "total_orders": total_orders,
        "pending_orders": pending,
        "shipped_orders": shipped,
        "delivered_orders": delivered,
        "cancelled_orders": cancelled,
        "paid_orders": paid,
        "total_revenue": round(revenue, 2),
        "stock": s.product.stock,
    }


# ============================== Admin Orders ==============================
@api.get("/admin/orders")
async def admin_list_orders(
    user=Depends(require_admin),
    status: Optional[str] = None,
    payment_method: Optional[str] = None,
    payment_status: Optional[str] = None,
    limit: int = 200,
):
    q: dict = {}
    if status:
        q["status"] = status
    if payment_method:
        q["payment_method"] = payment_method
    if payment_status:
        q["payment_status"] = payment_status
    docs = await db.orders.find(q, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return docs


@api.put("/admin/orders/{order_id}/status")
async def admin_update_order_status(order_id: str, body: dict, user=Depends(require_admin)):
    new_status = body.get("status")
    note = body.get("note", "")
    if not new_status:
        raise HTTPException(status_code=400, detail="status required")
    event = OrderTimelineEvent(status=new_status, note=note).model_dump()
    res = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": new_status}, "$push": {"timeline": event}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return await db.orders.find_one({"id": order_id}, {"_id": 0})


@api.put("/admin/orders/{order_id}/payment")
async def admin_update_payment_status(order_id: str, body: dict, user=Depends(require_admin)):
    new_status = body.get("payment_status")
    if not new_status:
        raise HTTPException(status_code=400, detail="payment_status required")
    res = await db.orders.update_one({"id": order_id}, {"$set": {"payment_status": new_status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"ok": True}


@api.get("/admin/orders/export.csv")
async def admin_orders_csv(user=Depends(require_admin)):
    import csv
    import io
    docs = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(5000)
    out = io.StringIO()
    fields = ["order_number", "created_at", "full_name", "email", "phone", "city", "state",
              "pincode", "total", "payment_method", "payment_status", "status"]
    w = csv.DictWriter(out, fieldnames=fields)
    w.writeheader()
    for d in docs:
        w.writerow({k: d.get(k, "") for k in fields})
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(out.getvalue(), media_type="text/csv")


# ============================== Admin Reviews ==============================
@api.post("/admin/reviews", response_model=Review)
async def admin_create_review(payload: ReviewCreate, user=Depends(require_admin)):
    r = Review(**payload.model_dump())
    await db.reviews.insert_one(r.model_dump())
    return r


@api.get("/admin/reviews")
async def admin_list_reviews(user=Depends(require_admin)):
    return await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api.put("/admin/reviews/{rid}", response_model=Review)
async def admin_update_review(rid: str, payload: dict, user=Depends(require_admin)):
    await db.reviews.update_one({"id": rid}, {"$set": payload})
    doc = await db.reviews.find_one({"id": rid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="not found")
    return Review(**doc)


@api.delete("/admin/reviews/{rid}")
async def admin_delete_review(rid: str, user=Depends(require_admin)):
    await db.reviews.delete_one({"id": rid})
    return {"ok": True}


# ============================== Admin FAQs ==============================
@api.post("/admin/faqs", response_model=Faq)
async def admin_create_faq(payload: FaqCreate, user=Depends(require_admin)):
    f = Faq(**payload.model_dump())
    await db.faqs.insert_one(f.model_dump())
    return f


@api.get("/admin/faqs")
async def admin_list_faqs(user=Depends(require_admin)):
    return await db.faqs.find({}, {"_id": 0}).sort("order", 1).to_list(500)


@api.put("/admin/faqs/{fid}", response_model=Faq)
async def admin_update_faq(fid: str, payload: dict, user=Depends(require_admin)):
    await db.faqs.update_one({"id": fid}, {"$set": payload})
    doc = await db.faqs.find_one({"id": fid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="not found")
    return Faq(**doc)


@api.delete("/admin/faqs/{fid}")
async def admin_delete_faq(fid: str, user=Depends(require_admin)):
    await db.faqs.delete_one({"id": fid})
    return {"ok": True}


# ============================== Admin Gallery ==============================
@api.post("/admin/gallery", response_model=GalleryItem)
async def admin_create_gallery(payload: GalleryCreate, user=Depends(require_admin)):
    g = GalleryItem(**payload.model_dump())
    await db.gallery.insert_one(g.model_dump())
    return g


@api.get("/admin/gallery")
async def admin_list_gallery(user=Depends(require_admin)):
    return await db.gallery.find({}, {"_id": 0}).sort("order", 1).to_list(500)


@api.put("/admin/gallery/{gid}", response_model=GalleryItem)
async def admin_update_gallery(gid: str, payload: dict, user=Depends(require_admin)):
    await db.gallery.update_one({"id": gid}, {"$set": payload})
    doc = await db.gallery.find_one({"id": gid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="not found")
    return GalleryItem(**doc)


@api.delete("/admin/gallery/{gid}")
async def admin_delete_gallery(gid: str, user=Depends(require_admin)):
    await db.gallery.delete_one({"id": gid})
    return {"ok": True}


# ============================== Admin Coupons ==============================
@api.post("/admin/coupons", response_model=Coupon)
async def admin_create_coupon(payload: CouponCreate, user=Depends(require_admin)):
    code = payload.code.strip().upper()
    existing = await db.coupons.find_one({"code": code})
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    c = Coupon(**{**payload.model_dump(), "code": code})
    await db.coupons.insert_one(c.model_dump())
    return c


@api.get("/admin/coupons")
async def admin_list_coupons(user=Depends(require_admin)):
    return await db.coupons.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api.put("/admin/coupons/{cid}", response_model=Coupon)
async def admin_update_coupon(cid: str, payload: dict, user=Depends(require_admin)):
    if "code" in payload:
        payload["code"] = payload["code"].strip().upper()
    await db.coupons.update_one({"id": cid}, {"$set": payload})
    doc = await db.coupons.find_one({"id": cid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="not found")
    return Coupon(**doc)


@api.delete("/admin/coupons/{cid}")
async def admin_delete_coupon(cid: str, user=Depends(require_admin)):
    await db.coupons.delete_one({"id": cid})
    return {"ok": True}


# ============================== SMTP Test ==============================
@api.post("/admin/smtp/test")
async def admin_smtp_test(body: dict, user=Depends(require_admin)):
    s = await get_settings_doc()
    to = body.get("to") or s.smtp.from_email
    if not to:
        raise HTTPException(status_code=400, detail="to email required")
    ok = send_email(
        s.smtp.model_dump(), to,
        "GlowCamp SMTP test",
        "<p>This is a test email from your GlowCamp admin panel.</p>",
    )
    return {"sent": ok}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
