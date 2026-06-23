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
        subject="Your GlowCamp Order is Confirmed",
        body="<h2>Thank you {{name}}!</h2><p>Your order {{order_id}} has been confirmed.</p>",
    )
    payment_confirmation: EmailTemplate = EmailTemplate(
        subject="Payment Received - GlowCamp",
        body="<p>We have received your payment for order {{order_id}}.</p>",
    )
    order_shipped: EmailTemplate = EmailTemplate(
        subject="Your GlowCamp Order Has Shipped",
        body="<p>Order {{order_id}} is on its way!</p>",
    )
    order_delivered: EmailTemplate = EmailTemplate(
        subject="GlowCamp Delivered",
        body="<p>Your order {{order_id}} has been delivered. Enjoy the glow!</p>",
    )
    order_cancelled: EmailTemplate = EmailTemplate(
        subject="GlowCamp Order Cancelled",
        body="<p>Order {{order_id}} has been cancelled.</p>",
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
    main_image: str = "https://customer-assets.emergentagent.com/job_flame-glow-demo/artifacts/wqi3n5yz_Screenshot_20260623_123638_YouTube.jpg"
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


# ---------- Orders ----------
OrderStatus = Literal[
    "placed", "confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"
]

PaymentMethod = Literal["paypal", "stripe", "razorpay", "manual_upi", "cod"]

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


class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_id)
    order_number: str = Field(default_factory=lambda: "GC-" + str(uuid.uuid4())[:8].upper())
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
    shipping: float
    cod_advance: float = 0.0
    total: float
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
