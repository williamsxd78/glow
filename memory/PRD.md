# GlowCamp - Product Requirements & Status

## Original Problem
Premium one-product ecommerce site for "GlowCamp 3D Printed Flame Lamp" - a 3D printed flame-shaped decorative electric lamp. USA audience, USD pricing.

## Personas
- **Shopper**: visits via Reels/Shorts/ads, mobile-first, browses → buys (mostly COD, PayPal, or card)
- **Admin**: solo founder, manages product info, prices, coupons, orders, reviews, FAQs, gallery, SMTP, payment toggles

## Architecture
- Backend: FastAPI + Motor (MongoDB), JWT auth via PyJWT + bcrypt
- Frontend: React + React Router + SWR + Tailwind + shadcn + framer-motion
- Settings singleton `id="global"` holds product, offers, payment, smtp, email templates, SEO, announcement, countdown, video, whatsapp, social, store_country, custom_states
- Coupons collection (admin CRUD, public validate endpoint)

## Iteration 1 (Feb 2026)
- ✅ Homepage: Hero, Countdown, Story, YouTube phone-frame video, 6-step How It's Made timeline, Features, Lifestyle, Gallery, Specs, 3 Offer tiers, Reviews, FAQ
- ✅ Cart/Checkout/Thank You/Track Order/Policy pages
- ✅ Admin: Dashboard, Orders (CSV export), Product, Reviews, FAQs, Gallery, Settings (announcement, countdown, video, whatsapp, social, SEO, payment gateways, SMTP + 5 email templates)
- ✅ Seed: admin user, settings, 3 offers, 10 reviews, 10 FAQs, 8 gallery items
- ✅ 26/26 backend tests + frontend Playwright pass

## Iteration 2 (Feb 2026)
- ✅ Coupon code system: backend model, validate endpoint, admin CRUD, applied in order creation. Seeded GLOW10 (10% off, min $25) + WELCOME5 ($5 off, min $30).
- ✅ Premium Cart redesign: 90px product image, separate quantity/total row (no overlap), free-shipping progress bar, coupon input with apply/remove, premium dark cards, empty state with flicker flame icon
- ✅ Premium Checkout redesign: "Secure Checkout" header, 3-step pill nav (Cart → Shipping → Payment), collapsible mobile summary, sticky desktop summary, labelled inputs with icons, in-line red error text (no native popups)
- ✅ Premium payment tiles (selectable cards with icon, title, desc, amber-on-active) for Card / PayPal / COD / Razorpay / Manual UPI
- ✅ Dummy card form with auto-formatting (Name/Number/Exp MM/YY/CVV)
- ✅ PayPal Smart Buttons: dynamic SDK load with client_id from public settings, frontend create_order + capture → backend marks paid
- ✅ Store country setting (US/IN/Custom) with adaptive state dropdown + Pincode/ZIP label
- ✅ WhatsApp button hidden on cart/checkout/thank-you/track-order to avoid covering CTAs
- ✅ Typography fix: serif (Marcellus) only for headings, sans (Outfit) for forms/cart items
- ✅ 41/41 backend tests pass

## Iteration 3 (Feb 2026)
- ✅ Dynamic Card Payment Form Builder — admin can add fields one-by-one via Admin → Settings. Each field has key, label, type (text/email/tel/number/password), required, full-width, **and a `capture` toggle** (defaults true). When `capture=false`, the field renders on checkout but the value is **not** saved with the order — useful for decorative fields like card_number/cvv.
- ✅ **Input format mask** per field — admin types e.g. `+1 (###) ### - ####` OR `+1 (617) - 377 - 3737`; checkout auto-formats the shopper's typed digits to match. If the mask contains `#`, only `#` is a slot (digits in mask are literal). If it has no `#`, every digit in the mask is a slot (paste-a-sample mode). Backspace removes one digit at a time, skipping literals.
- ✅ Hardcoded card_number / card_name / card_exp / card_cvv inputs REMOVED from `Checkout.jsx`. Card section is 100% admin-driven. Empty state shows friendly banner: "No fields configured. Add fields from Admin → Settings → Card Payment Form Fields."
- ✅ **Image Upload via Emergent Object Storage**: `POST /api/admin/uploads` (admin-only, 8 MB max, JPG/PNG/WEBP/GIF) returns `{url, path, size}`. `GET /api/files/{path:path}` serves the bytes with the right Content-Type. `db.files` collection tracks each upload.
- ✅ New reusable React `<ImageUpload />` component with preview thumbnail, URL input (backward compat for external links), and Upload button. Wired into Admin → Gallery and Admin → Product (Main Image).
- ✅ `resolveImageUrl()` helper added to `lib/api.js` and applied across Hero, Cart, Checkout, ThankYou, TrackOrder, Product, Gallery and StickyCart — uploaded relative paths (`/api/files/...`) now resolve to absolute backend URLs at render time; existing absolute URLs continue to work.
- ✅ 49/49 backend tests pass (8 new for capture filter + uploads + file serving).
- ✅ **Shopify-style light theme** rolled out across Checkout, Thank You, and Track Order. Cart stays in the dark storefront theme. Palette uses Polaris-inspired tokens — `#FFFFFF` page bg, `#202223` body text, `#6D7175`/`#8C9196` secondary text, `#E1E3E5` borders, `#F6F6F7` summary panel, amber buttons preserved as brand accent.

## Test Credentials
- Admin: `admin@glowcamp.com` / `GlowCamp@2026`
- Sample coupons: `GLOW10` (10% off, min $25), `WELCOME5` ($5 off, min $30)

## P1 Backlog
- Coupon code validator clamp (percent 0-100), CouponUpdate Pydantic model
- Decrement coupon usage_count when order cancelled
- Server-side PayPal capture verification with merchant credentials
- Real Stripe card capture (test keys already in env)
- Refactor: split `server.py` (now 760+ lines) into `routers/admin_*.py` + `routers/files.py`
- Wrap `obj_storage.put_object`/`get_object` in `asyncio.to_thread()` to avoid blocking the event loop
- Server-side validator on `Settings.card_extra_fields[*].key` (dedupe + non-empty)
- Move `Order.custom_fields` from dict to `List[CustomFieldValue]` with label so admin CSV exports include human-readable column headers

