import React from "react";
import { useParams, Link } from "react-router-dom";

const PAGES = {
  shipping: {
    title: "Shipping Policy",
    body: [
      "We ship across the United States via reliable courier partners.",
      "Standard delivery: 4-7 business days from order date.",
      "Free shipping on US orders above $50. Flat $5 shipping below $50.",
      "Orders are processed within 24-48 hours of payment confirmation.",
      "You'll receive a tracking ID via email once your package is shipped.",
      "For COD orders, please keep the exact amount ready at the time of delivery.",
    ],
  },
  returns: {
    title: "Return & Refund Policy",
    body: [
      "We offer a 7-day no-questions-asked return on unused products in original packaging.",
      "To start a return, message us on WhatsApp or email support@glowcamp.com with your order ID.",
      "Once we receive the returned product, refunds are processed within 5-7 business days to the original payment method.",
      "Damaged in transit? Send a photo within 48 hours of delivery and we'll send a free replacement.",
      "Customized or gift-wrapped items are non-returnable unless damaged.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    body: [
      "We respect your privacy. The information you share (name, address, contact) is used solely to process your order.",
      "We do not sell or share your data with third parties for marketing purposes.",
      "Payment information is processed securely by our gateway partners and never stored on our servers.",
      "You may request deletion of your account data anytime by emailing support@glowcamp.com.",
    ],
  },
  terms: {
    title: "Terms & Conditions",
    body: [
      "By using glowcamp.com you agree to our terms and conditions.",
      "GlowCamp is a decorative electric lamp. It is not a heater. It does not contain real fire.",
      "Use it indoors, away from water, and follow standard electrical safety practices.",
      "All product images are for reference; minor variations may exist due to the handcrafted nature of 3D printing.",
      "We reserve the right to update product pricing and offers at any time.",
    ],
  },
  contact: {
    title: "Contact Us",
    body: [
      "We'd love to hear from you.",
      "Email: support@glowcamp.com",
      "WhatsApp: tap the green button at the bottom right of the screen for fastest reply.",
      "Hours: Mon-Sat, 10am - 7pm PT.",
    ],
  },
};

export default function PolicyPage() {
  const { slug } = useParams();
  const p = PAGES[slug];
  if (!p) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-3xl">Page not found</h1>
        <Link to="/" className="text-amber-500 hover:underline">Back home</Link>
      </main>
    );
  }
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
      <h1 className="font-display text-3xl sm:text-4xl mb-8">{p.title}</h1>
      <div className="space-y-5 text-neutral-300 leading-relaxed text-sm sm:text-base">
        {p.body.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </main>
  );
}
