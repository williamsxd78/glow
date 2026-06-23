import React, { useEffect, useRef } from "react";

let scriptPromise = null;
function loadPaypalSdk(clientId, mode) {
  if (!clientId) return Promise.reject(new Error("no client id"));
  if (scriptPromise && scriptPromise.clientId === clientId) return scriptPromise.p;
  const p = new Promise((resolve, reject) => {
    // remove existing
    const old = document.getElementById("paypal-sdk");
    if (old) old.remove();
    const s = document.createElement("script");
    s.id = "paypal-sdk";
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture`;
    s.onload = () => resolve(window.paypal);
    s.onerror = reject;
    document.body.appendChild(s);
  });
  scriptPromise = { clientId, p };
  return p;
}

/**
 * Renders PayPal Smart Buttons.
 * Props:
 *  - clientId: PayPal client id (from public settings)
 *  - amount: total in USD
 *  - onApproved({ captureId, payerEmail })
 *  - onError(err)
 */
export default function PayPalButton({ clientId, amount, onApproved, onError }) {
  const ref = useRef(null);

  useEffect(() => {
    let cancelled = false;
    if (!clientId) return;
    loadPaypalSdk(clientId)
      .then((paypal) => {
        if (cancelled || !ref.current || !paypal) return;
        ref.current.innerHTML = "";
        paypal
          .Buttons({
            style: { layout: "vertical", shape: "pill", color: "gold", label: "paypal" },
            createOrder: (_d, actions) =>
              actions.order.create({
                purchase_units: [{ amount: { value: amount.toFixed(2), currency_code: "USD" } }],
              }),
            onApprove: async (_d, actions) => {
              const details = await actions.order.capture();
              const captureId =
                details?.purchase_units?.[0]?.payments?.captures?.[0]?.id || details?.id || "";
              onApproved && onApproved({ captureId, payerEmail: details?.payer?.email_address || "" });
            },
            onError: (err) => onError && onError(err),
          })
          .render(ref.current);
      })
      .catch((e) => onError && onError(e));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, amount]);

  if (!clientId) {
    return (
      <div className="text-xs text-amber-500/70 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
        PayPal is enabled but no client ID is configured. Admin can add it in Settings → Payment Gateways.
      </div>
    );
  }
  return <div ref={ref} />;
}
