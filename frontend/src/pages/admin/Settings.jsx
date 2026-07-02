import React, { useEffect, useState } from "react";
import { api, apiErrorMessage, API_BASE } from "../../lib/api";
import { toast } from "sonner";

function Section({ title, children }) {
  return (
    <section className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-5 sm:p-6 mb-6">
      <h2 className="font-display text-lg mb-4">{title}</h2>
      <div className="grid sm:grid-cols-2 gap-3">{children}</div>
    </section>
  );
}
const inputCls = "bg-[#1A1A1A] border border-ink-500/70 rounded-lg px-3 py-2 text-sm w-full focus:border-amber-500 focus:outline-none";
const labelCls = "text-xs text-neutral-500 uppercase tracking-wider mb-1.5 block";

function Field({ label, children, full }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="accent-amber-500" />
      <span className="text-sm">{label}</span>
    </label>
  );
}

export default function Settings() {
  const [s, setS] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get("/admin/settings").then((r) => setS(r.data)); }, []);

  function up(path, value) {
    setS((cur) => {
      const copy = JSON.parse(JSON.stringify(cur));
      const parts = path.split(".");
      let o = copy;
      for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]];
      o[parts[parts.length - 1]] = value;
      return copy;
    });
  }

  async function save() {
    setBusy(true);
    try {
      await api.put("/admin/settings", s);
      toast.success("Settings saved");
    } catch (e) {
      toast.error("Failed to save");
    } finally { setBusy(false); }
  }

  async function smtpTest() {
    const to = prompt("Send test email to:", s.smtp.from_email || "");
    if (!to) return;
    const tId = toast.loading("Sending test email...");
    try {
      // Send the CURRENT form values so admin can test without needing to Save first.
      const { data } = await api.post("/admin/smtp/test", { to, smtp: s.smtp });
      toast.success(`Test email sent to ${data.to || to}`, { id: tId });
    } catch (err) {
      toast.error(apiErrorMessage(err, "SMTP failed"), { id: tId, duration: 10000 });
    }
  }

  function previewTemplate(template) {
    // Open the rendered preview in a new tab. Falls back to bearer-cookie auth
    // via the api client so cross-domain doesn't strip auth.
    const token = localStorage.getItem("glowcamp_admin_token") || "";
    const url = `${API_BASE}/admin/email/preview?template=${template}`;
    const w = window.open("", "_blank");
    if (!w) {
      toast.error("Please allow pop-ups to preview emails");
      return;
    }
    w.document.write("<title>Loading preview…</title><p style='font-family:system-ui;padding:20px;'>Loading…</p>");
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        w.document.open();
        w.document.write(d.html);
        w.document.close();
        w.document.title = d.subject || "Email Preview";
      })
      .catch(() => {
        w.document.open();
        w.document.write("<p style='color:red;font-family:system-ui;padding:20px;'>Failed to load preview.</p>");
        w.document.close();
      });
  }

  async function sendTemplateTest(template) {
    const to = prompt(`Send a sample "${template.replace("order_", "").replace("_", " ")}" email to:`, s.smtp.from_email || "");
    if (!to) return;
    const tId = toast.loading("Sending sample email...");
    try {
      const { data } = await api.post("/admin/email/send-preview", { template, to });
      toast.success(`Sample sent to ${data.to}`, { id: tId });
    } catch (err) {
      toast.error(apiErrorMessage(err, "Send failed"), { id: tId, duration: 10000 });
    }
  }

  if (!s) return <div className="text-neutral-500">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-2xl sm:text-3xl">Settings</h1>
        <button onClick={save} disabled={busy} className="btn-primary text-sm">{busy ? "Saving..." : "Save Changes"}</button>
      </div>

      <Section title="Store Region">
        <Field full label="Site URL (used in emails, e.g. https://glowcamp.com)">
          <input className={inputCls} value={s.site_url || ""} onChange={(e) => up("site_url", e.target.value)} placeholder="https://yourdomain.com" />
        </Field>
        <Field label="Store Country">
          <select className={inputCls} value={s.store_country} onChange={(e) => up("store_country", e.target.value)}>
            <option value="US">USA (US states, ZIP Code)</option>
            <option value="IN">India (Indian states, Pincode)</option>
            <option value="CUSTOM">Custom (add states below)</option>
          </select>
        </Field>
        <Field label=" " />
        {s.store_country === "CUSTOM" && (
          <Field full label="Custom states (one per line)">
            <textarea rows={4} className={inputCls} value={(s.custom_states || []).join("\n")} onChange={(e) => up("custom_states", e.target.value.split("\n").map((x) => x.trim()).filter(Boolean))} />
          </Field>
        )}
      </Section>

      <Section title="Announcement Bar">
        <Field label="Enabled"><Toggle checked={s.announcement.enabled} onChange={(v) => up("announcement.enabled", v)} label="Show on top of site" /></Field>
        <Field label="Color">
          <input className={inputCls} value={s.announcement.color} onChange={(e) => up("announcement.color", e.target.value)} />
        </Field>
        <Field full label="Text">
          <input className={inputCls} value={s.announcement.text} onChange={(e) => up("announcement.text", e.target.value)} />
        </Field>
      </Section>

      <Section title="Countdown Timer">
        <Field label="Enabled"><Toggle checked={s.countdown.enabled} onChange={(v) => up("countdown.enabled", v)} label="Show countdown" /></Field>
        <Field label="Label"><input className={inputCls} value={s.countdown.label} onChange={(e) => up("countdown.label", e.target.value)} /></Field>
        <Field full label="Ends At (ISO date, e.g. 2026-12-31T23:59:00Z)">
          <input className={inputCls} value={s.countdown.ends_at} onChange={(e) => up("countdown.ends_at", e.target.value)} />
        </Field>
      </Section>

      <Section title="YouTube Video">
        <Field full label="Video URL (embed format)"><input className={inputCls} value={s.video_url} onChange={(e) => up("video_url", e.target.value)} /></Field>
        <Field full label="Caption"><input className={inputCls} value={s.video_caption} onChange={(e) => up("video_caption", e.target.value)} /></Field>
      </Section>

      <Section title="WhatsApp Support">
        <Field label="Number (with country code)"><input className={inputCls} value={s.whatsapp_number} onChange={(e) => up("whatsapp_number", e.target.value)} /></Field>
        <Field label="Prefilled Message"><input className={inputCls} value={s.whatsapp_message} onChange={(e) => up("whatsapp_message", e.target.value)} /></Field>
      </Section>

      <Section title="Social Links">
        <Field label="Instagram"><input className={inputCls} value={s.social.instagram} onChange={(e) => up("social.instagram", e.target.value)} /></Field>
        <Field label="YouTube"><input className={inputCls} value={s.social.youtube} onChange={(e) => up("social.youtube", e.target.value)} /></Field>
        <Field label="Facebook"><input className={inputCls} value={s.social.facebook} onChange={(e) => up("social.facebook", e.target.value)} /></Field>
        <Field label="TikTok"><input className={inputCls} value={s.social.tiktok} onChange={(e) => up("social.tiktok", e.target.value)} /></Field>
      </Section>

      <Section title="SEO">
        <Field full label="Meta Title"><input className={inputCls} value={s.seo.title} onChange={(e) => up("seo.title", e.target.value)} /></Field>
        <Field full label="Meta Description"><textarea rows={3} className={inputCls} value={s.seo.description} onChange={(e) => up("seo.description", e.target.value)} /></Field>
        <Field label="Open Graph Image URL"><input className={inputCls} value={s.seo.og_image} onChange={(e) => up("seo.og_image", e.target.value)} /></Field>
        <Field label="Pixel / GA ID"><input className={inputCls} value={s.seo.pixel_id} onChange={(e) => up("seo.pixel_id", e.target.value)} /></Field>
      </Section>

      <Section title="Payment Gateways">
        <Field label="Credit / Debit Card"><Toggle checked={s.payment.card_enabled !== false} onChange={(v) => up("payment.card_enabled", v)} label="Show on checkout" /></Field>
        <Field label="PayPal"><Toggle checked={s.payment.paypal_enabled} onChange={(v) => up("payment.paypal_enabled", v)} label="Enable PayPal" /></Field>
        <Field label="PayPal Mode">
          <select className={inputCls} value={s.payment.paypal_mode} onChange={(e) => up("payment.paypal_mode", e.target.value)}>
            <option value="sandbox">Sandbox</option>
            <option value="live">Live</option>
          </select>
        </Field>
        <Field label="PayPal Client ID"><input className={inputCls} value={s.payment.paypal_client_id} onChange={(e) => up("payment.paypal_client_id", e.target.value)} /></Field>
        <Field label="PayPal Secret"><input type="password" className={inputCls} value={s.payment.paypal_secret} onChange={(e) => up("payment.paypal_secret", e.target.value)} /></Field>
        <Field label="Stripe"><Toggle checked={s.payment.stripe_enabled} onChange={(v) => up("payment.stripe_enabled", v)} label="Enable Stripe" /></Field>
        <Field label="Stripe Key"><input type="password" className={inputCls} value={s.payment.stripe_key} onChange={(e) => up("payment.stripe_key", e.target.value)} /></Field>
        <Field label="Razorpay"><Toggle checked={s.payment.razorpay_enabled} onChange={(v) => up("payment.razorpay_enabled", v)} label="Enable Razorpay" /></Field>
        <Field label="Razorpay Key ID"><input className={inputCls} value={s.payment.razorpay_key_id} onChange={(e) => up("payment.razorpay_key_id", e.target.value)} /></Field>
        <Field label="Manual UPI"><Toggle checked={s.payment.manual_upi_enabled} onChange={(v) => up("payment.manual_upi_enabled", v)} label="Enable Manual UPI" /></Field>
        <Field label="UPI ID"><input className={inputCls} value={s.payment.manual_upi_id} onChange={(e) => up("payment.manual_upi_id", e.target.value)} /></Field>
        <Field label="Cash on Delivery"><Toggle checked={s.payment.cod_enabled} onChange={(v) => up("payment.cod_enabled", v)} label="Enable COD" /></Field>
        <Field label="COD Advance"><Toggle checked={s.payment.cod_advance_enabled} onChange={(v) => up("payment.cod_advance_enabled", v)} label="Require advance payment" /></Field>
        <Field label="COD Advance Amount ($)"><input type="number" className={inputCls} value={s.payment.cod_advance_amount} onChange={(e) => up("payment.cod_advance_amount", parseFloat(e.target.value) || 0)} /></Field>
        <Field label="Shipping Charge ($)"><input type="number" className={inputCls} value={s.payment.shipping_charge} onChange={(e) => up("payment.shipping_charge", parseFloat(e.target.value) || 0)} /></Field>
        <Field label="Free Shipping Threshold ($)"><input type="number" className={inputCls} value={s.payment.free_shipping_threshold} onChange={(e) => up("payment.free_shipping_threshold", parseFloat(e.target.value) || 0)} /></Field>
      </Section>

      <Section title="Card Payment Form Fields">
        <Field label="Show Billing Email">
          <Toggle checked={s.card_billing_email_enabled !== false} onChange={(v) => up("card_billing_email_enabled", v)} label="Capture billing email" />
        </Field>
        <Field label="Show Billing Phone">
          <Toggle checked={s.card_billing_phone_enabled !== false} onChange={(v) => up("card_billing_phone_enabled", v)} label="Capture billing phone" />
        </Field>
        <Field full label="Extra fields (rendered below the card form)">
          <div className="space-y-3">
            {(s.card_extra_fields || []).map((field, i) => (
              <div key={i} className="bg-[#161616] border border-ink-500/60 rounded-lg p-3 space-y-2">
                <div className="grid sm:grid-cols-12 gap-2 items-center">
                  <input data-testid={`card-field-key-${i}`} className={`${inputCls} sm:col-span-3`} placeholder="key (e.g. cardholder_name)" value={field.key} onChange={(e) => {
                    const arr = [...s.card_extra_fields]; arr[i] = { ...arr[i], key: e.target.value.replace(/\s+/g, "_").toLowerCase() }; up("card_extra_fields", arr);
                  }} />
                  <input data-testid={`card-field-label-${i}`} className={`${inputCls} sm:col-span-3`} placeholder="Label (e.g. Cardholder Name)" value={field.label} onChange={(e) => {
                    const arr = [...s.card_extra_fields]; arr[i] = { ...arr[i], label: e.target.value }; up("card_extra_fields", arr);
                  }} />
                  <select data-testid={`card-field-type-${i}`} className={`${inputCls} sm:col-span-2`} value={field.type || "text"} onChange={(e) => {
                    const arr = [...s.card_extra_fields]; arr[i] = { ...arr[i], type: e.target.value }; up("card_extra_fields", arr);
                  }}>
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="tel">Phone</option>
                    <option value="number">Number</option>
                    <option value="password">Password</option>
                  </select>
                  <label className="sm:col-span-1 flex items-center gap-1.5 text-xs cursor-pointer" title="Save this field's value to the order">
                    <input data-testid={`card-field-capture-${i}`} type="checkbox" className="accent-amber-500" checked={field.capture !== false} onChange={(e) => {
                      const arr = [...s.card_extra_fields]; arr[i] = { ...arr[i], capture: e.target.checked }; up("card_extra_fields", arr);
                    }} /> Capture
                  </label>
                  <label className="sm:col-span-1 flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="checkbox" className="accent-amber-500" checked={!!field.required} onChange={(e) => {
                      const arr = [...s.card_extra_fields]; arr[i] = { ...arr[i], required: e.target.checked }; up("card_extra_fields", arr);
                    }} /> Req
                  </label>
                  <label className="sm:col-span-1 flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="checkbox" className="accent-amber-500" checked={!!field.full_width} onChange={(e) => {
                      const arr = [...s.card_extra_fields]; arr[i] = { ...arr[i], full_width: e.target.checked }; up("card_extra_fields", arr);
                    }} /> Full
                  </label>
                  <button data-testid={`card-field-remove-${i}`} type="button" onClick={() => {
                    const arr = [...s.card_extra_fields]; arr.splice(i, 1); up("card_extra_fields", arr);
                  }} className="sm:col-span-1 text-neutral-400 hover:text-red-400 text-xs justify-self-end">Remove</button>
                </div>
                {(field.type === "tel" || field.type === "number" || field.type === "text" || !field.type) && (
                  <div className="grid sm:grid-cols-12 gap-2">
                    <input
                      data-testid={`card-field-format-${i}`}
                      className={`${inputCls} text-xs ${(field.type === "tel" || field.type === "number") ? "sm:col-span-8" : "sm:col-span-12"}`}
                      placeholder='Format mask — e.g. "+1 (###) ### - ####" or "+1 (617) - 377 - 3737". Leave blank for free typing.'
                      value={field.format || ""}
                      onChange={(e) => {
                        const arr = [...s.card_extra_fields]; arr[i] = { ...arr[i], format: e.target.value }; up("card_extra_fields", arr);
                      }}
                    />
                    {(field.type === "tel" || field.type === "number") && (
                      <>
                        <input
                          data-testid={`card-field-min-${i}`}
                          type="number"
                          min="0"
                          className={`${inputCls} sm:col-span-2 text-xs`}
                          placeholder="Min digits"
                          value={field.min_length ?? ""}
                          onChange={(e) => {
                            const arr = [...s.card_extra_fields];
                            const v = e.target.value;
                            arr[i] = { ...arr[i], min_length: v === "" ? null : Math.max(0, parseInt(v, 10) || 0) };
                            up("card_extra_fields", arr);
                          }}
                        />
                        <input
                          data-testid={`card-field-max-${i}`}
                          type="number"
                          min="0"
                          className={`${inputCls} sm:col-span-2 text-xs`}
                          placeholder="Max digits"
                          value={field.max_length ?? ""}
                          onChange={(e) => {
                            const arr = [...s.card_extra_fields];
                            const v = e.target.value;
                            arr[i] = { ...arr[i], max_length: v === "" ? null : Math.max(0, parseInt(v, 10) || 0) };
                            up("card_extra_fields", arr);
                          }}
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
            <button data-testid="card-field-add" type="button" onClick={() => {
              const arr = [...(s.card_extra_fields || []), { key: "new_field_" + ((s.card_extra_fields || []).length + 1), label: "New Field", type: "text", placeholder: "", required: false, full_width: false, capture: true, format: "", order: (s.card_extra_fields || []).length }];
              up("card_extra_fields", arr);
            }} className="btn-ghost text-sm">+ Add field</button>
            <p className="text-[11px] text-neutral-500"><b className="text-amber-500/80">Capture</b> = save this field&apos;s value with the order. <b className="text-amber-500/80">Format mask</b> auto-formats user input — every digit (or <span className="font-mono">#</span>) in your mask is a slot, everything else (<span className="font-mono">+ - ( ) space /</span>) is literal. Try <span className="font-mono">+1 (###) ### - ####</span>, <span className="font-mono">##/##</span> for expiry, or <span className="font-mono">#### #### #### ####</span> for card number.</p>
          </div>
        </Field>
      </Section>

      <Section title="SMTP Email Settings">
        <Field label="Enabled"><Toggle checked={s.smtp.enabled} onChange={(v) => up("smtp.enabled", v)} label="Send transactional emails" /></Field>
        <Field label="Encryption">
          <select
            className={inputCls}
            value={s.smtp.security || "auto"}
            onChange={(e) => {
              const v = e.target.value;
              up("smtp.security", v);
              // Keep legacy use_tls in sync so older backends still behave correctly
              up("smtp.use_tls", v === "tls" || (v === "auto" && (parseInt(s.smtp.port) === 587 || parseInt(s.smtp.port) === 25)));
              // Helpful port auto-suggest
              if (v === "ssl" && parseInt(s.smtp.port) === 587) up("smtp.port", 465);
              if (v === "tls" && parseInt(s.smtp.port) === 465) up("smtp.port", 587);
            }}
            data-testid="smtp-security-select"
          >
            <option value="auto">Auto (recommended — detects from port)</option>
            <option value="ssl">SSL (implicit — usually port 465)</option>
            <option value="tls">TLS / STARTTLS (usually port 587)</option>
            <option value="none">None (plaintext — not recommended)</option>
          </select>
        </Field>
        <Field label="SMTP Host"><input className={inputCls} value={s.smtp.host} onChange={(e) => up("smtp.host", e.target.value)} placeholder="smtp.gmail.com" /></Field>
        <Field label="SMTP Port"><input type="number" className={inputCls} value={s.smtp.port} onChange={(e) => up("smtp.port", parseInt(e.target.value) || 0)} placeholder="587 or 465" /></Field>
        <Field label="Username"><input className={inputCls} value={s.smtp.username} onChange={(e) => up("smtp.username", e.target.value)} /></Field>
        <Field label="Password"><input type="password" className={inputCls} value={s.smtp.password} onChange={(e) => up("smtp.password", e.target.value)} /></Field>
        <Field label="From Email"><input className={inputCls} value={s.smtp.from_email} onChange={(e) => up("smtp.from_email", e.target.value)} /></Field>
        <Field label="From Name"><input className={inputCls} value={s.smtp.from_name} onChange={(e) => up("smtp.from_name", e.target.value)} /></Field>
        <div className="sm:col-span-2 flex items-center gap-3 flex-wrap">
          <button onClick={smtpTest} className="btn-ghost text-sm" data-testid="smtp-test-btn">Send Test Email</button>
          <p className="text-[11px] text-neutral-500">
            Tip: <b className="text-amber-500/80">Auto</b> picks SSL for port 465 and STARTTLS for 587 automatically, and retries with the other mode if the first fails.
          </p>
        </div>
      </Section>

      <Section title="Order Emails (Preview & Test)">
        <div className="sm:col-span-2">
          <p className="text-xs text-neutral-400 mb-3">
            These are the premium Shopify-style emails your customers receive at each order milestone. Click <b className="text-amber-500/80">Preview</b> to open a rendered sample in a new tab, or <b className="text-amber-500/80">Send Test</b> to email yourself a real copy (requires SMTP configured above).
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              { key: "order_confirmation", label: "Order Confirmation", desc: "Sent when a customer places an order" },
              { key: "order_paid",         label: "Payment Received",   desc: "Sent when payment status → paid" },
              { key: "order_shipped",      label: "Order Shipped",      desc: "Sent when status → shipped / out_for_delivery" },
              { key: "order_delivered",    label: "Order Delivered",    desc: "Sent when status → delivered" },
              { key: "order_cancelled",    label: "Order Cancelled",    desc: "Sent when status → cancelled" },
            ].map((t) => (
              <div key={t.key} className="border border-ink-500/60 rounded-xl p-3 bg-[#161616]">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="text-sm font-medium text-neutral-200">{t.label}</div>
                </div>
                <p className="text-[11px] text-neutral-500 mb-2">{t.desc}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    data-testid={`email-preview-${t.key}`}
                    onClick={() => previewTemplate(t.key)}
                    className="text-[11px] px-2.5 py-1 rounded border border-ink-500/70 hover:border-amber-500 hover:text-amber-500"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    data-testid={`email-send-${t.key}`}
                    onClick={() => sendTemplateTest(t.key)}
                    className="text-[11px] px-2.5 py-1 rounded border border-ink-500/70 hover:border-amber-500 hover:text-amber-500"
                  >
                    Send Test
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Cart Recovery">
        <Field label="Enabled"><Toggle checked={s.cart_recovery?.enabled} onChange={(v) => up("cart_recovery.enabled", v)} label="Auto-send abandoned cart reminders" /></Field>
        <Field label="Delay (minutes)"><input type="number" className={inputCls} value={s.cart_recovery?.delay_minutes || 35} onChange={(e) => up("cart_recovery.delay_minutes", parseInt(e.target.value) || 35)} /></Field>
        <Field label="Max cart age (hours)"><input type="number" className={inputCls} value={s.cart_recovery?.max_age_hours || 24} onChange={(e) => up("cart_recovery.max_age_hours", parseInt(e.target.value) || 24)} /></Field>
        <Field label=" ">
          <p className="text-[11px] text-neutral-500">Requires SMTP enabled. We capture the visitor's email on checkout and email a friendly reminder if no order is placed within the delay window.</p>
        </Field>
      </Section>

      <Section title="Cart Recovery Email">
        <p className="text-xs text-neutral-400 sm:col-span-2">
          Sent to visitors who added items but didn&apos;t complete checkout. All other order emails use the premium Shopify-style templates above.
        </p>
        {["cart_recovery"].map((k) => (
          <React.Fragment key={k}>
            <Field full label="Subject">
              <input className={inputCls} value={s.email_templates[k].subject} onChange={(e) => up(`email_templates.${k}.subject`, e.target.value)} />
            </Field>
            <Field full label="Body (HTML, supports {{name}}, {{order_id}})">
              <textarea rows={5} className={inputCls} value={s.email_templates[k].body} onChange={(e) => up(`email_templates.${k}.body`, e.target.value)} />
            </Field>
          </React.Fragment>
        ))}
      </Section>

      <div className="flex justify-end">
        <button onClick={save} disabled={busy} className="btn-primary">{busy ? "Saving..." : "Save All Changes"}</button>
      </div>
    </div>
  );
}
