"""Pydantic models for GlowCamp ecommerce."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, EmailStr, ConfigDict
import uuid


def _id() -> str:
    return str(uuid.uuid4())


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _track_token() -> str:
    return uuid.uuid4().hex[:10].upper()


# ---------- Auth ----------
class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class AdminUser(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_id)
    email: EmailStr
    password_hash: str
    created_at: str = Field(default_factory=_now)


# ---------- Settings (singleton stored in collection 'settings' with _id='global') ----------
class Offer(BaseModel):
    key: str  # single / couple / gift
    title: str
    subtitle: str
    quantity: int
    price: float
    original_price: Optional[float] = None
    badge: Optional[str] = None
    description: str = ""


class PaymentSettings(BaseModel):
    card_enabled: bool = True  # generic card section (dynamic admin-built form)
    stripe_enabled: bool = False
    stripe_key: str = ""
    paypal_enabled: bool = True
    paypal_client_id: str = ""
    paypal_secret: str = ""
    paypal_mode: Literal["sandbox", "live"] = "sandbox"
    razorpay_enabled: bool = False
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    manual_upi_enabled: bool = False
    manual_upi_id: str = ""
    cod_enabled: bool = True
    cod_advance_enabled: bool = False
    cod_advance_amount: float = 0.0
    shipping_charge: float = 5.0
    free_shipping_threshold: float = 50.0


class SMTPSettings(BaseModel):
    enabled: bool = False
    host: str = ""
    port: int = 587
    username: str = ""
    password: str = ""
    from_email: str = ""
    from_name: str = "GlowCamp"
    use_tls: bool = True


class EmailTemplate(BaseModel):
    subject: str
    body: str  # HTML


class EmailTemplates(BaseModel):
    order_confirmation: EmailTemplate = EmailTemplate(
        subject="Your GlowCamp order is confirmed",
        body=(
            "<div style=\"font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#0A0A0A;color:#fff;padding:32px;border-radius:16px;\">"
            "<h2 style=\"font-family:Georgia,serif;color:#fff;font-weight:normal;margin:0 0 8px;\">Thank you, {{name}}!</h2>"
            "<p style=\"color:#bbb;margin:0 0 24px;\">Your order <b style=\"color:#FFAA00;\">{{order_id}}</b> has been confirmed. "
            "We'll send another email when it's on the way.</p>"
            "<a href=\"{{tracking_url}}\" style=\"display:inline-block;background:#FFAA00;color:#0A0A0A;font-weight:600;text-decoration:none;padding:14px 22px;border-radius:999px;\">Track your order</a>"
            "<p style=\"color:#666;font-size:12px;margin:24px 0 0;\">Total: ${{total}} · {{item_count}} item(s)</p>"
            "<p style=\"color:#666;font-size:11px;margin:20px 0 0;\">If the button doesn't work, paste this link into your browser:<br><span style=\"color:#FFAA00;word-break:break-all;\">{{tracking_url}}</span></p>"
            "</div>"
        ),
    )
    payment_confirmation: EmailTemplate = EmailTemplate(
        subject="Payment received · GlowCamp {{order_id}}",
        body="<p>Hi {{name}},</p><p>We've received your payment for order <b>{{order_id}}</b>. <a href=\"{{tracking_url}}\">Track your order</a>.</p>",
    )
    order_shipped: EmailTemplate = EmailTemplate(
        subject="Your GlowCamp order has shipped",
        body="<p>Hi {{name}},</p><p>Your order <b>{{order_id}}</b> is on its way. <a href=\"{{tracking_url}}\">Follow it live</a>.</p>",
    )
    order_delivered: EmailTemplate = EmailTemplate(
        subject="GlowCamp delivered",
        body="<p>Hi {{name}},</p><p>Your order <b>{{order_id}}</b> has been delivered. Enjoy the glow! <a href=\"{{tracking_url}}\">View order</a>.</p>",
    )
    order_cancelled: EmailTemplate = EmailTemplate(
        subject="Your GlowCamp order was cancelled",
        body="<p>Hi {{name}},</p><p>Order <b>{{order_id}}</b> has been cancelled. Reply to this email if this was unexpected.</p>",
    )
    cart_recovery: EmailTemplate = EmailTemplate(
        subject="You left something glowing in your cart",
        body=(
            "<div style=\"font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#0A0A0A;color:#fff;padding:32px;border-radius:16px;\">"
            "<h2 style=\"font-family:Georgia,serif;color:#fff;font-weight:normal;margin:0 0 8px;\">Still thinking it over?</h2>"
            "<p style=\"color:#bbb;margin:0 0 20px;\">Hi {{name}}, your GlowCamp lamp is waiting in your cart. "
            "We held your items for you — they take just a minute to check out.</p>"
            "<p style=\"color:#888;margin:0 0 24px;font-size:13px;\">{{item_count}} item(s) · ${{subtotal}}</p>"
            "<a href=\"{{resume_url}}\" style=\"display:inline-block;background:#FFAA00;color:#0A0A0A;font-weight:600;text-decoration:none;padding:14px 22px;border-radius:999px;\">Return to your cart</a>"
            "<p style=\"color:#666;font-size:11px;margin:24px 0 0;\">No pressure — your cart will stay saved for 24 hours.</p>"
            "</div>"
        ),
    )


class SEOSettings(BaseModel):
    title: str = "GlowCamp 3D Printed Flame Lamp | Mini Campfire Glow Decor"
    description: str = (
        "Bring cozy campfire ambience home with GlowCamp, a 3D printed flame-shaped "
        "decorative electric lamp with warm inner bulb glow. Perfect for room decor, "
        "cafes, desks, and gifting."
    )
    og_image: str = ""
    pixel_id: str = ""
    ga_id: str = ""


class AnnouncementBar(BaseModel):
    enabled: bool = True
    text: str = "Limited Launch Offer - Save 50% Today + Free US Shipping over $50"
    color: str = "#FFAA00"


class Countdown(BaseModel):
    enabled: bool = True
    ends_at: str = ""  # ISO date string
    label: str = "Launch Offer Ends In"


class ProductInfo(BaseModel):
    name: str = "GlowCamp 3D Printed Flame Lamp"
    tagline: str = "Bring the Campfire Glow Home"
    description: str = (
        "A 3D printed flame-shaped lamp with a warm inner bulb glow, designed to create "
        "a cozy mini campfire feeling without real fire, smoke, or ash."
    )
    main_image: str = "/img/hero-flame.jpg"
    original_price: float = 59.99
    sale_price: float = 29.99
    stock: int = 187
    stock_urgency_text: str = "Only 12 left in stock - selling fast"
    warranty: str = "6 Months Manufacturer Warranty"
    size: str = '7" x 7" x 9" (H)'
    wire_length: str = "5 feet (1.5m)"
    bulb_type: str = "Warm White E14 LED (Replaceable)"
    package_includes: str = "1 Flame Lamp, Wire/Plug Setup, Basic Usage Guide"


class SocialLinks(BaseModel):
    instagram: str = ""
    youtube: str = ""
    facebook: str = ""
    tiktok: str = ""


class Coupon(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_id)
    code: str
    type: Literal["percent", "fixed"] = "percent"
    value: float = 10.0  # percent (0-100) or fixed amount
    min_subtotal: float = 0.0
    usage_limit: int = 0  # 0 = unlimited
    usage_count: int = 0
    active: bool = True
    description: str = ""
    created_at: str = Field(default_factory=_now)


class CouponCreate(BaseModel):
    code: str
    type: Literal["percent", "fixed"] = "percent"
    value: float = 10.0
    min_subtotal: float = 0.0
    usage_limit: int = 0
    active: bool = True
    description: str = ""


class CouponValidateRequest(BaseModel):
    code: str
    subtotal: float


class CartRecovery(BaseModel):
    enabled: bool = True
    delay_minutes: int = 35
    max_age_hours: int = 24


class CardFormField(BaseModel):
    """A configurable input rendered on the Card payment section."""
    key: str  # machine name e.g. "cardholder_name"
    label: str  # display label
    type: Literal["text", "email", "tel", "number", "password"] = "text"
    placeholder: str = ""
    required: bool = False
    full_width: bool = False  # span both columns
    capture: bool = True  # if False, field is shown but value is NOT saved to order
    format: str = ""  # optional input mask, e.g. "+1 (###) - ### - ####" or "+1 (617) - 377 - 3737". Digits and # = placeholder slots; everything else is literal.
    min_length: Optional[int] = None  # min digit count (only enforced for type=number/tel)
    max_length: Optional[int] = None  # max digit count (only enforced for type=number/tel)
    order: int = 0


class CartSessionItem(BaseModel):
    offer_key: str
    title: str
    quantity: int
    unit_price: float


class CartSessionCreate(BaseModel):
    email: EmailStr
    name: Optional[str] = ""
    items: List[CartSessionItem]
    subtotal: float


class CartSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_id)
    email: EmailStr
    name: str = ""
    items: List[CartSessionItem]
    subtotal: float = 0.0
    reminder_sent: bool = False
    reminder_sent_at: Optional[str] = None
    converted: bool = False
    created_at: str = Field(default_factory=_now)
    updated_at: str = Field(default_factory=_now)


class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "global"
    product: ProductInfo = Field(default_factory=ProductInfo)
    offers: List[Offer] = Field(default_factory=list)
    payment: PaymentSettings = Field(default_factory=PaymentSettings)
    smtp: SMTPSettings = Field(default_factory=SMTPSettings)
    email_templates: EmailTemplates = Field(default_factory=EmailTemplates)
    seo: SEOSettings = Field(default_factory=SEOSettings)
    announcement: AnnouncementBar = Field(default_factory=AnnouncementBar)
    countdown: Countdown = Field(default_factory=Countdown)
    video_url: str = "https://www.youtube.com/embed/PYgQoc46KGE"
    video_caption: str = (
        "See how beautifully the flame glow spreads through the 3D printed structure."
    )
    whatsapp_number: str = "+1 (555) 234-5678"
    whatsapp_message: str = (
        "Hi, I want to know more about GlowCamp 3D Printed Flame Lamp."
    )
    social: SocialLinks = Field(default_factory=SocialLinks)
    cart_recovery: CartRecovery = Field(default_factory=CartRecovery)
    card_billing_email_enabled: bool = True
    card_billing_phone_enabled: bool = True
    card_extra_fields: List[CardFormField] = Field(default_factory=list)
    site_url: str = ""  # public frontend URL, used in email links e.g. https://glowcamp.com
    store_country: Literal["US", "IN", "CUSTOM"] = "US"
    custom_states: List[str] = Field(default_factory=list)
    updated_at: str = Field(default_factory=_now)


# ---------- Public-safe view of settings (no secrets) ----------
class PublicSettings(BaseModel):
    product: ProductInfo
    offers: List[Offer]
    seo: SEOSettings
    announcement: AnnouncementBar
    countdown: Countdown
    video_url: str
    video_caption: str
    whatsapp_number: str
    whatsapp_message: str
    social: SocialLinks
    payment_options: dict  # available payment methods
    shipping_charge: float
    free_shipping_threshold: float
    store_country: str
    custom_states: List[str]
    paypal_client_id: str = ""
    paypal_mode: str = "sandbox"
    card_billing_email_enabled: bool = True
    card_billing_phone_enabled: bool = True
    card_extra_fields: List[CardFormField] = Field(default_factory=list)


# ---------- Orders ----------
OrderStatus = Literal[
    "placed", "confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"
]

PaymentMethod = Literal["paypal", "stripe", "card", "razorpay", "manual_upi", "cod"]

PaymentStatus = Literal["pending", "paid", "partial", "failed", "refunded"]


class OrderItem(BaseModel):
    offer_key: str
    title: str
    quantity: int
    unit_price: float
    line_total: float


class OrderTimelineEvent(BaseModel):
    status: str
    note: str = ""
    at: str = Field(default_factory=_now)


class OrderCreate(BaseModel):
    full_name: str
    phone: str
    email: EmailStr
    address: str
    city: str
    state: str
    pincode: str
    landmark: Optional[str] = ""
    items: List[OrderItem]
    payment_method: PaymentMethod
    notes: Optional[str] = ""
    coupon_code: Optional[str] = ""
    billing_email: Optional[str] = ""
    billing_phone: Optional[str] = ""
    custom_fields: Optional[dict] = None


class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_id)
    order_number: str = Field(default_factory=lambda: "GC-" + str(uuid.uuid4())[:8].upper())
    tracking_token: str = Field(default_factory=_track_token)
    full_name: str
    phone: str
    email: EmailStr
    address: str
    city: str
    state: str
    pincode: str
    landmark: str = ""
    items: List[OrderItem]
    subtotal: float
    discount: float = 0.0
    coupon_code: str = ""
    shipping: float
    cod_advance: float = 0.0
    total: float
    billing_email: str = ""
    billing_phone: str = ""
    custom_fields: dict = Field(default_factory=dict)
    payment_method: PaymentMethod
    payment_status: PaymentStatus = "pending"
    status: OrderStatus = "placed"
    timeline: List[OrderTimelineEvent] = Field(default_factory=list)
    notes: str = ""
    created_at: str = Field(default_factory=_now)


# ---------- Reviews ----------
class ReviewCreate(BaseModel):
    name: str
    location: Optional[str] = ""
    rating: int
    title: Optional[str] = ""
    comment: str


class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_id)
    name: str
    location: str = ""
    rating: int = 5
    title: str = ""
    comment: str
    verified: bool = True
    hidden: bool = False
    created_at: str = Field(default_factory=_now)


# ---------- FAQs ----------
class FaqCreate(BaseModel):
    question: str
    answer: str
    order: int = 0


class Faq(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_id)
    question: str
    answer: str
    order: int = 0
    hidden: bool = False


# ---------- Gallery ----------
class GalleryCreate(BaseModel):
    url: str
    alt: str = ""
    order: int = 0


class GalleryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_id)
    url: str
    alt: str = ""
    order: int = 0



# ============================== Analytics ==============================
class PageViewCreate(BaseModel):
    """Lightweight beacon fired by the browser on every route change + every 30s heartbeat."""
    model_config = ConfigDict(extra="ignore")
    session_id: str  # client-generated UUID, stored in localStorage
    path: str        # e.g. "/", "/product", "/checkout"


class LiveAnalytics(BaseModel):
    """Snapshot for the admin dashboard."""
    model_config = ConfigDict(extra="ignore")
    active_now: int           # unique sessions seen in last 60 seconds
    on_home: int              # active sessions currently on "/"
    on_product: int           # active sessions currently on /product
    on_cart: int              # active sessions currently on /cart
    on_checkout: int          # active sessions currently on /checkout
    visitors_today: int       # unique sessions today (UTC)
    visitors_7d: int          # unique sessions in last 7 days
    visitors_30d: int         # unique sessions in last 30 days
    page_views_today: int     # total page views today
    top_pages_7d: list        # [{ path, views, unique }]
