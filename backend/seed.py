"""Initial data seed - idempotent."""
from datetime import datetime, timedelta, timezone

from auth import hash_password
from models import (
    AdminUser,
    Settings,
    Offer,
    Faq,
    Review,
    GalleryItem,
    Coupon,
)

ADMIN_EMAIL = "admin@glowcamp.com"
ADMIN_PASSWORD = "GlowCamp@2026"


async def seed_admin(db) -> None:
    existing = await db.admins.find_one({"email": ADMIN_EMAIL})
    if existing:
        return
    admin = AdminUser(email=ADMIN_EMAIL, password_hash=hash_password(ADMIN_PASSWORD))
    await db.admins.insert_one(admin.model_dump())


async def seed_settings(db) -> None:
    existing = await db.settings.find_one({"id": "global"})
    if existing:
        return
    ends_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    settings = Settings(
        offers=[
            Offer(
                key="single",
                title="Single GlowCamp Lamp",
                subtitle="Perfect for one cozy corner",
                quantity=1,
                price=29.99,
                original_price=59.99,
                badge=None,
                description="Best for personal room decor",
            ),
            Offer(
                key="couple",
                title="Couple Pack",
                subtitle="2 Lamps - Save more together",
                quantity=2,
                price=54.99,
                original_price=119.98,
                badge="Best Value",
                description="Light up two rooms or share with someone you love",
            ),
            Offer(
                key="gift",
                title="Gift Pack",
                subtitle="Lamp + Premium Gift Box",
                quantity=1,
                price=34.99,
                original_price=74.99,
                badge="Perfect Gift",
                description="Includes hand-wrapped premium gift box with note card",
            ),
        ],
    )
    settings.countdown.ends_at = ends_at
    await db.settings.insert_one(settings.model_dump())


FAQS = [
    ("Is this real fire?",
     "No. It is a decorative electric lamp with a 3D printed flame-shaped body and a warm bulb inside. It only produces a fire-like glow effect."),
    ("Is it safe for indoor use?",
     "Yes, GlowCamp is designed for indoor decorative use. Keep it away from water and use the wire/plug carefully like any other lamp."),
    ("Does it produce heat?",
     "It is not a heater. It uses a low-wattage warm LED bulb mainly for ambience and decoration."),
    ("What is the flame body made of?",
     "The outer flame body is 3D printed using premium PLA filament for a sculptural, hand-crafted feel."),
    ("How does it glow?",
     "A warm amber bulb is placed inside the 3D printed flame body, creating a soft golden campfire-style glow that spreads through the structure."),
    ("Can I use it in a cafe or shop?",
     "Yes! It looks beautiful on cafe tables, boutique counters, reception desks, and display areas. Many of our customers run small businesses."),
    ("Is it good for gifting?",
     "Yes, it is perfect for birthdays, housewarming, anniversaries, festivals, and for anyone who loves unique room decor."),
    ("What comes in the box?",
     "GlowCamp lamp, wire/plug setup, and a basic usage guide. Gift Pack includes a premium gift box and note card."),
    ("Do you ship across the US?",
     "Yes, we ship to all 50 states. Free shipping on orders over $50. Standard delivery is 4-7 business days."),
    ("What is your return policy?",
     "We offer a 7-day no-questions-asked return on unused products in original packaging. Contact us via WhatsApp or email to start a return."),
]


async def seed_faqs(db) -> None:
    count = await db.faqs.count_documents({})
    if count > 0:
        return
    docs = [Faq(question=q, answer=a, order=i).model_dump() for i, (q, a) in enumerate(FAQS)]
    await db.faqs.insert_many(docs)


REVIEWS = [
    ("Emily R.", "Portland, OR", 5, "Cozy magic", "The glow looks beautiful at night and gives my bedroom such a cozy feel. Way better than any fairy lights I have tried."),
    ("Marcus T.", "Austin, TX", 5, "Customers love it", "I put one on my coffee shop counter and customers keep asking where I got it. Already ordered two more for the other tables."),
    ("Jenna L.", "Brooklyn, NY", 5, "Best housewarming gift", "Got the gift pack for my best friend's new apartment. She actually cried. It feels expensive and the wrapping is gorgeous."),
    ("Daniel K.", "Seattle, WA", 4, "Unique piece", "Love the sculptural look. Wish the cord was a bit longer but the glow is perfect for movie nights."),
    ("Priya S.", "San Jose, CA", 5, "Like a mini campfire", "I wanted that camping feeling indoors and this nails it. My kids think it's magical and it's completely safe."),
    ("Robert M.", "Denver, CO", 5, "Quality print", "The 3D print is super clean - no rough edges. Looks way more premium than the photos suggest."),
    ("Sofia A.", "Miami, FL", 5, "Date night essential", "Set this up next to a bottle of wine and it transformed our living room into a tiny cabin. Husband loves it too."),
    ("Tyler W.", "Chicago, IL", 5, "Reels gold", "Got this for my content shoots. Looks INSANE on camera. Already used it in 4 Reels and they all hit."),
    ("Hannah P.", "Nashville, TN", 5, "Worth every dollar", "Was hesitant at first but the launch price made it a no-brainer. Honestly I'd have paid full price after seeing it in person."),
    ("Alex J.", "Boston, MA", 4, "Calm bedroom vibe", "Use it as a night light. Soft enough to sleep with, warm enough to feel intentional. Just be careful around pets and the cord."),
]


async def seed_reviews(db) -> None:
    count = await db.reviews.count_documents({})
    if count > 0:
        return
    docs = [
        Review(name=n, location=loc, rating=r, title=t, comment=c).model_dump()
        for n, loc, r, t, c in REVIEWS
    ]
    await db.reviews.insert_many(docs)


GALLERY = [
    ("/img/hero-flame.jpg", "GlowCamp lamp main view"),
    ("/img/gallery-1.jpg", "Lamp in cozy reading nook"),
    ("/img/gallery-2.jpg", "Lamp on bedside table"),
    ("/img/gallery-3.jpg", "Lamp on cafe table"),
    ("/img/gallery-4.jpg", "Lamp on dark gaming desk"),
    ("/img/gallery-5.jpg", "Romantic dinner setup"),
    ("/img/gallery-6.jpg", "Living room shelf at night"),
    ("/img/gallery-7.jpg", "Meditation space"),
]


async def seed_gallery(db) -> None:
    count = await db.gallery.count_documents({})
    if count > 0:
        return
    docs = [GalleryItem(url=u, alt=a, order=i).model_dump() for i, (u, a) in enumerate(GALLERY)]
    await db.gallery.insert_many(docs)


async def seed_coupons(db) -> None:
    count = await db.coupons.count_documents({})
    if count > 0:
        return
    docs = [
        Coupon(code="GLOW10", type="percent", value=10.0, min_subtotal=25.0,
               description="10% off your first GlowCamp", active=True).model_dump(),
        Coupon(code="WELCOME5", type="fixed", value=5.0, min_subtotal=30.0,
               description="$5 off orders over $30", active=True).model_dump(),
    ]
    await db.coupons.insert_many(docs)


async def run_all_seeds(db) -> None:
    await seed_admin(db)
    await seed_settings(db)
    await seed_faqs(db)
    await seed_reviews(db)
    await seed_gallery(db)
    await seed_coupons(db)
    await migrate_external_images(db)


# ---------- One-shot migration: replace external image URLs with same-origin /img/* paths ----------
# External CDNs (unsplash / pexels / customer-assets.emergentagent.com) can be blocked by ISPs,
# corporate networks or adblockers — leading to blank images on some visitors' devices.
# Once these are baked into /app/frontend/public/img/, we point the DB at same-origin paths so
# every visitor of glowcamp.store sees the images regardless of network.
_LEGACY_HOSTS = (
    "customer-assets.emergentagent.com",
    "images.unsplash.com",
    "images.pexels.com",
)

_URL_MAP = {
    "https://customer-assets.emergentagent.com/job_flame-glow-demo/artifacts/wqi3n5yz_Screenshot_20260623_123638_YouTube.jpg": "/img/hero-flame.jpg",
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80": "/img/gallery-1.jpg",
    "https://images.pexels.com/photos/26535233/pexels-photo-26535233.jpeg": "/img/gallery-2.jpg",
    "https://images.unsplash.com/photo-1542372147193-a7aca54189cd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2ODl8MHwxfHNlYXJjaHwxfHxkYXJrJTIwbW9vZHklMjBjYWZlJTIwdGFibGV8ZW58MHx8fHwxNzgyMTk5MDcyfDA&ixlib=rb-4.1.0&q=85": "/img/gallery-3.jpg",
    "https://images.pexels.com/photos/6489045/pexels-photo-6489045.jpeg": "/img/gallery-4.jpg",
    "https://images.unsplash.com/photo-1543083477-4f785aeafaa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80": "/img/gallery-5.jpg",
    "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80": "/img/gallery-6.jpg",
    "https://images.unsplash.com/photo-1545389336-cf090694435e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80": "/img/gallery-7.jpg",
}


def _remap(url: str) -> str:
    if not url or not isinstance(url, str):
        return url
    if url in _URL_MAP:
        return _URL_MAP[url]
    # Any other legacy CDN URL falls back to hero
    if any(host in url for host in _LEGACY_HOSTS):
        return "/img/hero-flame.jpg"
    return url


async def migrate_external_images(db) -> None:
    """Rewrite legacy external image URLs stored in Mongo to same-origin /img/* paths."""
    # 1. Gallery
    async for doc in db.gallery.find({}):
        old = doc.get("url", "")
        new = _remap(old)
        if new != old:
            await db.gallery.update_one({"_id": doc["_id"]}, {"$set": {"url": new}})

    # 2. Settings.product.main_image
    settings = await db.settings.find_one({"id": "global"})
    if settings:
        product = settings.get("product") or {}
        old = product.get("main_image", "")
        new = _remap(old)
        if new != old:
            await db.settings.update_one(
                {"id": "global"}, {"$set": {"product.main_image": new}}
            )
