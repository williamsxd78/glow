import React from "react";
import { BrowserRouter, Routes, Route, Outlet, useLocation } from "react-router-dom";
import { CartProvider } from "@/lib/cart";
import { Toaster } from "sonner";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnnouncementBar from "@/components/AnnouncementBar";
import StickyCart from "@/components/StickyCart";
import WhatsAppButton from "@/components/WhatsAppButton";

import Home from "@/pages/Home";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import ThankYou from "@/pages/ThankYou";
import TrackOrder from "@/pages/TrackOrder";
import PolicyPage from "@/pages/PolicyPage";

import AdminLogin from "@/pages/admin/AdminLogin";
import AdminLayout from "@/pages/admin/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import Orders from "@/pages/admin/Orders";
import Reviews from "@/pages/admin/Reviews";
import Faqs from "@/pages/admin/Faqs";
import Gallery from "@/pages/admin/Gallery";
import Settings from "@/pages/admin/Settings";
import ProductPage from "@/pages/admin/Product";

import "@/App.css";

function Shell() {
  const loc = useLocation();
  const isAdmin = loc.pathname.startsWith("/admin");
  return (
    <>
      {!isAdmin && <AnnouncementBar />}
      <Navbar />
      <Outlet />
      <Footer />
      <StickyCart />
      <WhatsAppButton />
    </>
  );
}

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Toaster position="top-right" theme="dark" richColors />
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<Home />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/thank-you/:id" element={<ThankYou />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/policy/:slug" element={<PolicyPage />} />
          </Route>

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="product" element={<ProductPage />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="faqs" element={<Faqs />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}
