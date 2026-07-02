"""Shopify-style transactional email templates + rendering helpers.

Each template is a Python function that takes the settings + order dict and
returns (subject, html_body). We build the HTML in code (not stored in DB) so
we can access items list, main product image, shipping address block, etc.

Admins can still customise the subject/intro via Admin → Settings → Email
Templates (those DB-stored templates are still respected). If the admin's
template body is one of the legacy defaults, we swap in the new premium
Shopify-style layout automatically.
"""
from __future__ import annotations
from typing import Any


_ACCENT = "#FFAA00"        # amber accent (matches brand)
_TEXT = "#1A1A1A"          # near-black text
_MUTED = "#6B7177"         # secondary text
_BORDER = "#E4E7EB"        # subtle borders
_BG = "#F6F6F7"            # page background
_CARD = "#FFFFFF"          # card background


def _money(v: Any, symbol: str = "$") -> str:
    try:
        return f"{symbol}{float(v):.2f}"
    except (TypeError, ValueError):
        return f"{symbol}0.00"


def _get_product_image(settings: dict, items: list) -> str:
    """Return the product image URL. Prefers the offer/product image if any."""
    product = settings.get("product") or {}
    images = product.get("images") or []
    if images:
        img = images[0]
    else:
        img = product.get("main_image") or ""
    site = (settings.get("site_url") or "").rstrip("/")
    if img.startswith("/") and site:
        return f"{site}{img}"
    return img


def _items_html(items: list, product_img: str) -> str:
    """Render each order line as a table row with thumbnail + title + qty + price."""
    rows = []
    for it in items:
        title = it.get("title") or it.get("offer_key", "Item")
        qty = it.get("quantity", 1)
        line_total = _money(it.get("line_total", 0))
        rows.append(f"""
        <tr>
          <td style="padding:12px 0;vertical-align:top;width:64px;">
            <img src="{product_img}" alt="" width="56" height="56" style="display:block;border-radius:8px;object-fit:cover;background:#F0F0F0;" />
          </td>
          <td style="padding:12px 12px;vertical-align:top;">
            <div style="font-size:14px;color:{_TEXT};font-weight:600;line-height:1.4;">{title}</div>
            <div style="font-size:12px;color:{_MUTED};margin-top:2px;">Qty: {qty}</div>
          </td>
          <td style="padding:12px 0;vertical-align:top;text-align:right;font-size:14px;color:{_TEXT};font-weight:600;white-space:nowrap;">{line_total}</td>
        </tr>
        """)
    return "".join(rows)


def _address_html(order: dict) -> str:
    lines = [
        order.get("full_name", ""),
        order.get("address", ""),
        f"{order.get('city', '')}, {order.get('state', '')} {order.get('pincode', '')}".strip(", "),
        order.get("phone", ""),
    ]
    return "<br>".join([l for l in lines if l and l.strip(", ")])


def _totals_html(order: dict) -> str:
    subtotal = _money(order.get("subtotal", 0))
    shipping = _money(order.get("shipping", 0))
    shipping_label = "Free" if float(order.get("shipping", 0) or 0) == 0 else shipping
    discount = float(order.get("discount", 0) or 0)
    total = _money(order.get("total", 0))
    rows = [
        f'<tr><td style="padding:6px 0;color:{_MUTED};font-size:14px;">Subtotal</td>'
        f'<td style="padding:6px 0;text-align:right;color:{_TEXT};font-size:14px;">{subtotal}</td></tr>',
        f'<tr><td style="padding:6px 0;color:{_MUTED};font-size:14px;">Shipping</td>'
        f'<td style="padding:6px 0;text-align:right;color:{_TEXT};font-size:14px;">{shipping_label}</td></tr>',
    ]
    if discount > 0:
        rows.append(
            f'<tr><td style="padding:6px 0;color:{_MUTED};font-size:14px;">Discount</td>'
            f'<td style="padding:6px 0;text-align:right;color:#0BA85F;font-size:14px;">−{_money(discount)}</td></tr>'
        )
    rows.append(
        f'<tr><td style="padding:10px 0 0;border-top:1px solid {_BORDER};color:{_TEXT};font-size:16px;font-weight:700;">Total</td>'
        f'<td style="padding:10px 0 0;border-top:1px solid {_BORDER};text-align:right;color:{_TEXT};font-size:16px;font-weight:700;">{total}</td></tr>'
    )
    return f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">{"".join(rows)}</table>'


def _shell(settings: dict, order: dict, hero: dict, body_extras: str = "", cta_href: str = "", cta_label: str = "") -> str:
    """Shared Shopify-style email layout. `hero` = {title, subtitle, badge?}"""
    store_name = ((settings.get("seo") or {}).get("site_name")) or "GlowCamp"
    site = (settings.get("site_url") or "").rstrip("/")
    order_number = order.get("order_number") or ""

    product_img = _get_product_image(settings, order.get("items") or [])
    items = _items_html(order.get("items") or [], product_img)
    address = _address_html(order)
    totals = _totals_html(order)
    payment_method = (order.get("payment_method") or "").upper().replace("_", " ") or "—"

    cta_html = ""
    if cta_href and cta_label:
        cta_html = f"""
        <div style="text-align:center;margin:28px 0 8px;">
          <a href="{cta_href}" style="display:inline-block;background:{_TEXT};color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 30px;border-radius:6px;">{cta_label}</a>
        </div>
        """

    badge_html = ""
    if hero.get("badge"):
        badge_html = (
            f'<div style="display:inline-block;background:{hero.get("badge_bg", _ACCENT)};color:{hero.get("badge_fg", "#1A1A1A")};'
            f'font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:6px 12px;border-radius:999px;margin-bottom:14px;">'
            f'{hero["badge"]}</div>'
        )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{hero.get('title', 'Order update')}</title>
</head>
<body style="margin:0;padding:0;background:{_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:{_TEXT};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:{_BG};padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:{_CARD};border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
      <!-- Header -->
      <tr><td style="padding:28px 32px 8px;text-align:center;border-bottom:1px solid {_BORDER};">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:{_TEXT};letter-spacing:0.5px;">{store_name}</div>
        <div style="font-size:11px;color:{_MUTED};letter-spacing:2px;text-transform:uppercase;margin-top:4px;">Order {order_number}</div>
      </td></tr>

      <!-- Hero -->
      <tr><td style="padding:32px 32px 8px;text-align:center;">
        {badge_html}
        <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:normal;line-height:1.25;color:{_TEXT};">{hero.get('title','')}</h1>
        <p style="margin:10px 0 0;font-size:15px;line-height:1.55;color:{_MUTED};">{hero.get('subtitle','')}</p>
      </td></tr>

      {body_extras}

      {'<tr><td style="padding:0 32px;">' + cta_html + '</td></tr>' if cta_html else ''}

      <!-- Order summary -->
      <tr><td style="padding:24px 32px 0;">
        <div style="font-size:12px;color:{_MUTED};letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">Order summary</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom:1px solid {_BORDER};">
          {items}
        </table>
      </td></tr>

      <tr><td style="padding:16px 32px 0;">
        {totals}
      </td></tr>

      <!-- Shipping & Payment -->
      <tr><td style="padding:24px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="width:50%;vertical-align:top;padding-right:12px;">
              <div style="font-size:12px;color:{_MUTED};letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">Ship to</div>
              <div style="font-size:14px;color:{_TEXT};line-height:1.6;">{address}</div>
            </td>
            <td style="width:50%;vertical-align:top;padding-left:12px;">
              <div style="font-size:12px;color:{_MUTED};letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">Payment</div>
              <div style="font-size:14px;color:{_TEXT};line-height:1.6;">{payment_method}</div>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:32px 32px 28px;text-align:center;border-top:1px solid {_BORDER};margin-top:28px;">
        <div style="font-size:12px;color:{_MUTED};line-height:1.6;">
          Questions? Just reply to this email — we read every message.<br>
          {('<a href="' + site + '" style="color:' + _MUTED + ';text-decoration:underline;">' + site.replace('https://','').replace('http://','') + '</a>') if site else ''}
        </div>
        <div style="font-size:11px;color:#B0B4BA;margin-top:14px;">© {store_name}</div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>"""


def _tracking_url(settings: dict, order: dict) -> str:
    base = (settings.get("site_url") or "").rstrip("/")
    on = order.get("order_number") or order.get("id", "")
    tok = order.get("tracking_token", "")
    return f"{base}/track-order?o={on}&k={tok}" if base else f"/track-order?o={on}&k={tok}"


# =============== Public builders (one per lifecycle) ================

def build_order_confirmation(settings: dict, order: dict) -> tuple[str, str]:
    name = (order.get("full_name") or "").split(" ")[0] or "there"
    store_name = ((settings.get("seo") or {}).get("site_name")) or "GlowCamp"
    subject = f"Thank you for your order · {store_name} {order.get('order_number','')}"
    html = _shell(
        settings, order,
        hero={
            "badge": "ORDER CONFIRMED",
            "title": f"Thank you, {name}!",
            "subtitle": "Your order has been confirmed. We'll send another email as soon as it ships.",
        },
        cta_href=_tracking_url(settings, order),
        cta_label="View your order",
    )
    return subject, html


def build_order_paid(settings: dict, order: dict) -> tuple[str, str]:
    name = (order.get("full_name") or "").split(" ")[0] or "there"
    store_name = ((settings.get("seo") or {}).get("site_name")) or "GlowCamp"
    subject = f"Payment received · {store_name} {order.get('order_number','')}"
    html = _shell(
        settings, order,
        hero={
            "badge": "PAYMENT RECEIVED",
            "badge_bg": "#0BA85F",
            "badge_fg": "#fff",
            "title": f"Payment received, {name}",
            "subtitle": "We've received your payment. Your order is being prepared and will ship soon.",
        },
        cta_href=_tracking_url(settings, order),
        cta_label="View your order",
    )
    return subject, html


def build_order_shipped(settings: dict, order: dict) -> tuple[str, str]:
    name = (order.get("full_name") or "").split(" ")[0] or "there"
    subject = f"Your order is on its way · {order.get('order_number','')}"
    extras = f"""
      <tr><td style="padding:8px 32px 0;text-align:center;">
        <div style="display:inline-block;font-size:32px;line-height:1;">🚚</div>
      </td></tr>
    """
    html = _shell(
        settings, order,
        hero={
            "badge": "SHIPPED",
            "badge_bg": "#1D6BF3",
            "badge_fg": "#fff",
            "title": f"Great news, {name} — your order is on its way!",
            "subtitle": "Track your package below to see when it will arrive.",
        },
        body_extras=extras,
        cta_href=_tracking_url(settings, order),
        cta_label="Track your package",
    )
    return subject, html


def build_order_delivered(settings: dict, order: dict) -> tuple[str, str]:
    name = (order.get("full_name") or "").split(" ")[0] or "there"
    store_name = ((settings.get("seo") or {}).get("site_name")) or "GlowCamp"
    subject = f"Your {store_name} order has been delivered"
    extras = f"""
      <tr><td style="padding:8px 32px 0;text-align:center;">
        <div style="display:inline-block;font-size:32px;line-height:1;">🎉</div>
      </td></tr>
    """
    html = _shell(
        settings, order,
        hero={
            "badge": "DELIVERED",
            "badge_bg": "#0BA85F",
            "badge_fg": "#fff",
            "title": f"Enjoy the glow, {name}!",
            "subtitle": "Your order has been delivered. We'd love a photo — tag us and we might feature you on our site.",
        },
        body_extras=extras,
        cta_href=_tracking_url(settings, order),
        cta_label="Leave a review",
    )
    return subject, html


def build_order_cancelled(settings: dict, order: dict) -> tuple[str, str]:
    name = (order.get("full_name") or "").split(" ")[0] or "there"
    store_name = ((settings.get("seo") or {}).get("site_name")) or "GlowCamp"
    subject = f"Your {store_name} order was cancelled"
    html = _shell(
        settings, order,
        hero={
            "badge": "CANCELLED",
            "badge_bg": "#D6363B",
            "badge_fg": "#fff",
            "title": f"Order cancelled, {name}",
            "subtitle": "Your order has been cancelled. If your card was charged, the refund will appear within 3–5 business days. Reply to this email if you have any questions.",
        },
    )
    return subject, html


BUILDERS = {
    "order_confirmation": build_order_confirmation,
    "order_paid": build_order_paid,
    "order_shipped": build_order_shipped,
    "order_delivered": build_order_delivered,
    "order_cancelled": build_order_cancelled,
}
