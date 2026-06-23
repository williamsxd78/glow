# GlowCamp - Product Requirements & Status

## Original Problem
Build a premium one-product ecommerce site for "GlowCamp 3D Printed Flame Lamp" - a 3D printed flame-shaped decorative electric lamp with warm inner bulb glow. Premium luxury home decor aesthetic, USA audience, USD pricing.

## User Choices (locked)
- USA audience, USD pricing
- JWT-based admin authentication
- PayPal gateway managed in admin panel (enable/disable + keys)
- SMTP integration managed in admin panel
- Trust-building reviews seeded
- Online payments are dummy/managed by admin (no live charging)

## Personas
- **Shopper**: visits via Reels/Shorts/ads, mobile-first, browses → buys (mostly COD or PayPal)
- **Admin**: solo founder, manages product info, prices, orders, reviews, FAQs, gallery, SMTP, payment toggles

## Architecture
- Backend: FastAPI + Motor (MongoDB), JWT auth via PyJWT + bcrypt
- Frontend: React + React Router + SWR + Tailwind + shadcn + framer-motion
- Single settings document `settings.id="global"` holds product, offers, payment, smtp, email templates, SEO, announcement, countdown, video, whatsapp, social

## Implemented (Feb 2026)
- ✅ Homepage: Hero, Countdown strip, Story, YouTube phone-frame video, 6-step How It's Made timeline, 8 Features grid, Lifestyle scenes, Gallery carousel, Specs table + "What Makes It Unique", 3 Offer tiers (Single/Couple/Gift), Reviews columns, FAQ accordion
- ✅ Conversion: Announcement marquee bar, countdown timer, sticky bottom buy bar, floating WhatsApp button, trust badges
- ✅ Ecommerce: Cart, Checkout (US states dropdown, COD + PayPal + Stripe/Razorpay/UPI radios), Thank You with order details, Track Order with 6-step status timeline
- ✅ Policies: shipping, returns, privacy, terms, contact
- ✅ Admin: JWT login, Dashboard (8 stat cards), Orders (filter, modal, status & payment updates, CSV export), Product (details + 3 offers editor), Reviews CRUD, FAQs CRUD, Gallery CRUD, Settings (announcement, countdown, video, whatsapp, social, SEO, full payment gateway config, full SMTP + email templates, test email)
- ✅ Seed data: 1 admin, settings, 3 offers, 10 reviews, 10 FAQs, 8 gallery items
- ✅ Tests: 26/26 backend pytest pass; full frontend Playwright pass

## P1 Backlog (next session)
- Live PayPal Smart Buttons + capture flow
- Stripe Checkout for cards (test keys already in env)
- Coupon / discount codes (admin managed)
- Real SMTP send testing with a verified inbox
- Image upload (object storage) for gallery instead of URL
- Background task for email send (non-blocking)
- Split server.py into routers when adding more features
- Bundle subscriptions / "buy in 3 installments" (Affirm/Klarna)

## Test Credentials
- Admin: `admin@glowcamp.com` / `GlowCamp@2026`
