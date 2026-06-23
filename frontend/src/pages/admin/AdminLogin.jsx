import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { api } from "../../lib/api";
import { toast } from "sonner";
import { TID } from "../../constants/testIds";
import { FlameMark } from "../../components/FlameLogo";

export default function AdminLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@glowcamp.com");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("/admin/login", { email, password });
      localStorage.setItem("glowcamp_admin_token", data.token);
      localStorage.setItem("glowcamp_admin_email", data.email);
      toast.success("Welcome back");
      nav("/admin");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Invalid credentials");
    } finally {
      setBusy(false);
    }
  }

  const inputCls = "bg-[#1A1A1A] border border-ink-500/70 rounded-lg px-4 py-3 text-sm w-full focus:border-amber-500 focus:outline-none transition";

  return (
    <main className="min-h-screen ambient-dark grain flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <FlameMark size={26} />
          <span className="font-display text-xl">GlowCamp Admin</span>
        </div>
        <h1 className="font-display text-2xl mb-1">Sign in</h1>
        <p className="text-xs text-neutral-500 mb-6">Manage products, orders & settings</p>
        <form onSubmit={submit} className="space-y-3">
          <input data-testid={TID.adminEmail} type="email" className={inputCls} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input data-testid={TID.adminPassword} type="password" className={inputCls} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button data-testid={TID.adminLoginSubmit} type="submit" disabled={busy} className="btn-primary w-full justify-center mt-2">
            <Lock size={14} /> {busy ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}
