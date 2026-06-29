import React, { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, Star, HelpCircle, Image as ImgIcon, Settings as SettingsIcon, Package, LogOut, Tag } from "lucide-react";
import { api } from "../../lib/api";
import { adminPath } from "../../lib/adminBase";
import { FlameMark } from "../../components/FlameLogo";
import { TID } from "../../constants/testIds";

const NAV = [
  { to: adminPath(),           label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: adminPath("orders"),   label: "Orders",    icon: ShoppingBag },
  { to: adminPath("product"),  label: "Product",   icon: Package },
  { to: adminPath("coupons"),  label: "Coupons",   icon: Tag },
  { to: adminPath("reviews"),  label: "Reviews",   icon: Star },
  { to: adminPath("faqs"),     label: "FAQs",      icon: HelpCircle },
  { to: adminPath("gallery"),  label: "Gallery",   icon: ImgIcon },
  { to: adminPath("settings"), label: "Settings",  icon: SettingsIcon },
];

export default function AdminLayout() {
  const nav = useNavigate();
  const loc = useLocation();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("glowcamp_admin_token");
    if (!token) { nav(adminPath("login")); return; }
    api.get("/admin/me").then(() => setOk(true)).catch(() => {
      localStorage.removeItem("glowcamp_admin_token");
      nav(adminPath("login"));
    });
  }, [nav]);

  function logout() {
    localStorage.removeItem("glowcamp_admin_token");
    nav(adminPath("login"));
  }

  if (!ok) return <div className="min-h-screen flex items-center justify-center text-neutral-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <div className="grid lg:grid-cols-[260px_1fr] min-h-screen">
        <aside className="border-r border-ink-500/40 bg-[#0A0A0A] p-5 hidden lg:block">
          <div className="flex items-center gap-2 mb-8">
            <FlameMark size={22} />
            <span className="font-display text-lg">GlowCamp</span>
          </div>
          <nav className="space-y-1">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = n.end ? loc.pathname === n.to : loc.pathname.startsWith(n.to);
              return (
                <Link key={n.to} to={n.to} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${active ? "bg-amber-500/10 text-amber-500" : "text-neutral-400 hover:text-white hover:bg-white/5"}`}>
                  <Icon size={16} /> {n.label}
                </Link>
              );
            })}
          </nav>
          <button data-testid={TID.adminLogout} onClick={logout} className="mt-8 flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-400 hover:text-red-400 w-full">
            <LogOut size={16} /> Log out
          </button>
        </aside>

        <div>
          {/* mobile bar */}
          <div className="lg:hidden border-b border-ink-500/40 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2"><FlameMark size={20} /><span className="font-display">GlowCamp Admin</span></div>
            <button onClick={logout} className="text-xs text-neutral-400"><LogOut size={14} /></button>
          </div>
          <div className="lg:hidden flex gap-1 overflow-x-auto no-scrollbar border-b border-ink-500/40 p-2">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = n.end ? loc.pathname === n.to : loc.pathname.startsWith(n.to);
              return (
                <Link key={n.to} to={n.to} className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${active ? "bg-amber-500 text-black" : "text-neutral-400"}`}>
                  <Icon size={12} /> {n.label}
                </Link>
              );
            })}
          </div>

          <main className="p-5 sm:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
