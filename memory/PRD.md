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

## Test Credentials
- Admin: `admin@glowcamp.com` / `GlowCamp@2026`
- Sample coupons: `GLOW10` (10% off, min $25), `WELCOME5` ($5 off, min $30)

## P1 Backlog
- Image upload to object storage (gallery & product main image) - simpler than pasting URLs
- Coupon code validator clamp (percent 0-100), CouponUpdate Pydantic model
- Decrement coupon usage_count when order cancelled
- Server-side PayPal capture verification with merchant credentials
- Real Stripe card capture (test keys already in env)
- Split server.py into routers/ when adding next feature group
