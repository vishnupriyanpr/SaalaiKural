"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  motion,
  AnimatePresence,
} from "framer-motion";
import {
  Phone, Mail, Lock, User, MapPin, Key, Award, Shield, CheckCircle,
  Loader2, ArrowRight, Zap, Star,
} from "lucide-react";
import GlowButton from "@/components/shared/GlowButton";

/* ─── Variants ───────────────────────────────────────────── */
const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 22 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const slideIn = (dir: "left" | "right") => ({
  hidden: { opacity: 0, x: dir === "left" ? -60 : 60 },
  show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 160, damping: 26, duration: 0.6 } },
});

/* ─── Feature checklist items ────────────────────────────── */
const FEATURES = [
  "AI Photo Classification",
  "20-35% Project Savings",
  "Eco Sapling Redemptions",
  "Voice Assistant (Tamil)",
  "Real-time GPS Tracking",
  "Gamified Leaderboard",
];

/* ─── Input field component ──────────────────────────── */
const InputField = ({ icon: Icon, label, ...props }: any) => (
  <div>
    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">{label}</label>
    <motion.div whileFocus={{ scale: 1.01 }} className="relative">
      <Icon className="w-4 h-4 absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
      <input
        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all duration-200"
        {...props}
      />
    </motion.div>
  </div>
);

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"civilian" | "admin">("civilian");
  
  // States for Civilian Login/Register
  const [isRegistering, setIsRegistering] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  
  const [onboardingForm, setOnboardingForm] = useState({
    fullName: "", district: "Coimbatore", city: "", pincode: "",
  });
  
  // States for Admin Login
  const [email, setEmail] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    localStorage.setItem("theme", "light");
    document.documentElement.classList.remove("dark");
  }, []);

  /* ─── Auth logic (Express Backend) ─────────────────────────── */

  const handleCivilianLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) { setError("Please enter a valid 10-digit mobile number"); return; }
    if (!password) { setError("Please enter your password"); return; }
    
    setError(""); setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/auth/citizen/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("roadguard_session", JSON.stringify({ 
            role: "civilian", 
            userId: data.user.id, 
            name: data.user.name, 
            district: data.user.district,
            token: data.token
        }));
        router.push("/civilian/dashboard");
      } else {
        throw new Error(data.error || "Login failed");
      }
    } catch (err: any) {
      setError(err.message || "Network Error");
    } finally {
      setLoading(false);
    }
  };

  const handleCivilianRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingForm.fullName) { setError("Please enter your name"); return; }
    if (!phone || phone.length < 10) { setError("Please enter a valid 10-digit mobile number"); return; }
    if (!password || password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (!onboardingForm.city) { setError("Please enter your City/Town/Village"); return; }
    if (onboardingForm.pincode.length !== 6 || isNaN(Number(onboardingForm.pincode))) { setError("Pincode must be 6 digits"); return; }
    
    setLoading(true); setError("");
    try {
      const res = await fetch("http://localhost:8000/api/auth/citizen/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone,
          password,
          fullName: onboardingForm.fullName, 
          district: onboardingForm.district, 
          city: onboardingForm.city,
          pincode: onboardingForm.pincode
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("roadguard_session", JSON.stringify({ 
            role: "civilian", 
            userId: data.user.id, 
            name: data.user.name, 
            district: data.user.district,
            token: data.token
        }));
        router.push("/civilian/dashboard");
      } else {
        throw new Error(data.error || "Failed to register. Please try again.");
      }
    } catch (err: any) { 
      setError(err.message || "Failed to complete registration."); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    if (!email || !password) { setError("Please enter official email and password"); setLoading(false); return; }

    try {
      const res = await fetch("http://localhost:8000/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("roadguard_session", JSON.stringify({ 
            role: "admin", 
            userId: data.user.id, 
            name: data.user.name, 
            district: data.user.district,
            token: data.token
        }));
        router.push("/admin/dashboard");
      } else {
        throw new Error(data.error || "Login failed");
      }
    } catch (err: any) {
      setError(err.message || "Network Error");
    } finally {
      setLoading(false);
    }
  };

  const bypassAdmin = async (adminId: string) => {
    setLoading(true);
    setError("");
    try {
      const ADMIN_PROFILES: Record<string, { id: string; name: string; role: string; district: string }> = {
        "adm-111": { id: "adm-111", name: "Dr. K. Srinivasan, IAS", role: "state", district: "Chennai" },
        "adm-222": { id: "adm-222", name: "Thiru. M. Prathap, IAS", role: "district", district: "Coimbatore" },
        "adm-333": { id: "adm-333", name: "Selvi P. Ramya", role: "field", district: "Coimbatore" },
      };
      const admin = ADMIN_PROFILES[adminId];
      if (admin) {
        localStorage.setItem("roadguard_session", JSON.stringify({
          role: "admin", userId: admin.id, name: admin.name,
          adminRole: admin.role, district: admin.district,
          token: "mock_bypass_token"
        }));
        router.push("/admin/dashboard");
      } else {
        setError("Admin profile not found.");
      }
    } catch (e) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative overflow-hidden bg-white text-slate-800">

      {/* ── LEFT: Branding panel ───────────────────────── */}
      <motion.div
        variants={slideIn("left")}
        initial="hidden"
        animate="show"
        className="flex-1 flex flex-col justify-between p-8 md:p-14 bg-gradient-to-br from-[#1A3A5C] via-[#122840] to-black text-white relative overflow-hidden"
      >
        {/* Animated background orbs */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] right-[-20%] w-[60vw] h-[60vw] rounded-full bg-primary/20 blur-[80px] pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-[-15%] left-[-15%] w-[50vw] h-[50vw] rounded-full bg-primary/15 blur-[100px] pointer-events-none"
        />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center space-x-3 relative z-10"
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
          >
            <img src="/tn-logo.png" alt="Tamil Nadu Government Seal" className="w-14 h-14 object-contain drop-shadow-lg" />
          </motion.div>
          <div>
            <h1 className="font-display font-black text-xl tracking-tight leading-none">
              சாலையின் குரல் <span className="text-primary font-tamil font-medium text-base ml-1">தமிழ்நாடு</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">Civic Damage Reporting Platform</p>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          transition={{ delayChildren: 0.5 }}
          className="my-10 max-w-lg space-y-6 relative z-10"
        >
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-display font-extrabold leading-tight">
            Gamified Civic Duty.{" "}
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-orange-400">
              Sustainable Rewards.
            </span>
          </motion.h2>

          <motion.p variants={fadeUp} className="text-sm md:text-base text-slate-300 leading-relaxed">
            Report road hazards, potholes, and broken signages in Tamil Nadu.
            Earn reward points and redeem for plants, seeds, and community staples.
          </motion.p>

          {/* Feature list */}
          <motion.div variants={stagger} className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="flex items-center space-x-2"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, delay: 0.8 + i * 0.07 }}
                >
                  <CheckCircle className="text-primary w-4 h-4 shrink-0" />
                </motion.div>
                <span className="text-xs text-slate-300">{feat}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-xs text-slate-500 font-mono flex items-center justify-between relative z-10"
        >
          <span>Tamil Nadu Highways Act Compliance</span>
          <span>© 2026 PWD Government of TN</span>
        </motion.div>
      </motion.div>

      {/* ── RIGHT: Auth panel ──────────────────────────── */}
      <motion.div
        variants={slideIn("right")}
        initial="hidden"
        animate="show"
        className="flex-1 flex items-center justify-center p-6 md:p-12 z-10 bg-slate-50 overflow-y-auto"
      >
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
              className="p-8 rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-200/60"
            >
              {/* Tab switcher */}
              <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200 mb-8">
                {(["civilian", "admin"] as const).map((tab) => (
                  <motion.button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setError(""); setIsRegistering(false); }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold relative z-10 transition-colors ${activeTab === tab ? "text-white" : "text-slate-500 hover:text-slate-700"
                      }`}
                    whileTap={{ scale: 0.97 }}
                  >
                    {activeTab === tab && (
                      <motion.span
                        layoutId="tab-pill"
                        className="absolute inset-0 rounded-lg bg-primary shadow-md shadow-primary/20"
                        style={{ zIndex: -1 }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    {tab === "civilian" ? "I am a Civilian" : "I am an Admin"}
                  </motion.button>
                ))}
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-3 mb-5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-semibold"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tab content */}
              <AnimatePresence mode="wait">
                {activeTab === "civilian" ? (
                  <motion.div
                    key="civilian"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ type: "spring", stiffness: 260, damping: 28 }}
                    className="space-y-5"
                  >
                    {!isRegistering ? (
                        <form onSubmit={handleCivilianLogin} className="space-y-4">
                            <div>
                                <h3 className="text-xl font-display font-extrabold text-[#1A3A5C] mb-1">Civilian Login (உள்நுழைவு)</h3>
                                <p className="text-xs text-slate-500">Welcome back. Login to continue reporting.</p>
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">Mobile Number (கைபேசி எண்)</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm font-mono border-r border-slate-200 pr-2">+91</span>
                                    <input
                                    type="tel" value={phone} maxLength={10}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                                    placeholder="98765 43210"
                                    className="w-full pl-16 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
                                    />
                                </div>
                            </div>
                            <InputField icon={Lock} label="Password (கடவுச்சொல்)" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="••••••••" />

                            <GlowButton type="submit" disabled={loading} variant="primary" size="md" fullWidth icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}>
                                {loading ? "Logging in…" : "Login"}
                            </GlowButton>
                            
                            <div className="text-center mt-4">
                                <span className="text-xs text-slate-500">Don&apos;t have an account? </span>
                                <button type="button" onClick={() => setIsRegistering(true)} className="text-xs font-semibold text-primary hover:underline">Sign Up</button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleCivilianRegister} className="space-y-4">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 300, delay: 0.15 }}
                                className="text-center mb-4"
                            >
                                <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-xl mx-auto mb-2">
                                🎁
                                </div>
                                <h3 className="text-lg font-display font-extrabold text-[#1A3A5C]">Create Profile (பதிவு செய்தல்)</h3>
                                <p className="text-xs text-slate-500 mt-1">Join and get <strong className="text-primary">+100 PTS</strong> bonus.</p>
                            </motion.div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">Mobile (கைபேசி)</label>
                                    <div className="relative">
                                        <input
                                        type="tel" value={phone} maxLength={10}
                                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                                        placeholder="98765 43210"
                                        className="w-full pl-3 pr-2 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
                                        />
                                    </div>
                                </div>
                                <InputField icon={Lock} label="Password" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="••••••••" />
                            </div>

                            <InputField icon={User} label="Full Name (முழு பெயர்)" type="text" required value={onboardingForm.fullName} onChange={(e: any) => setOnboardingForm(p => ({ ...p, fullName: e.target.value }))} placeholder="Selvam Kumar" />
                            
                            <div className="grid grid-cols-2 gap-3">
                                <InputField icon={MapPin} label="City / Town" type="text" required value={onboardingForm.city} onChange={(e: any) => setOnboardingForm(p => ({ ...p, city: e.target.value }))} placeholder="e.g. Kattur" />
                                <InputField icon={Lock} label="Pincode" type="text" maxLength={6} required value={onboardingForm.pincode} onChange={(e: any) => setOnboardingForm(p => ({ ...p, pincode: e.target.value.replace(/\D/g, "") }))} placeholder="e.g. 641009" />
                            </div>

                            <div>
                                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">Resident District (மாவட்டம்)</label>
                                <div className="relative">
                                    <MapPin className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                                    <select
                                        value={onboardingForm.district}
                                        onChange={(e) => setOnboardingForm(p => ({ ...p, district: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all appearance-none"
                                    >
                                        {["Coimbatore", "Chennai", "Madurai", "Trichy", "Salem"].map(d => (
                                        <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <GlowButton type="submit" variant="gold" size="md" fullWidth disabled={loading}
                                icon={<Award className="w-4 h-4" />} iconPosition="left">
                                {loading ? "Creating…" : "Claim +100 PTS & Start"}
                            </GlowButton>
                            
                            <div className="text-center mt-2">
                                <button type="button" onClick={() => setIsRegistering(false)} className="text-xs text-slate-500 hover:text-slate-700 underline">Back to Login</button>
                            </div>
                        </form>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="admin"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ type: "spring", stiffness: 260, damping: 28 }}
                  >
                    <form onSubmit={handleAdminLogin} className="space-y-5">
                      <div>
                        <h3 className="text-xl font-display font-extrabold text-[#1A3A5C] mb-1">Official Admin Portal</h3>
                        <p className="text-xs text-slate-500">Secure login for State, District &amp; Field Officers.</p>
                      </div>

                      <div className="space-y-4">
                        <InputField icon={Mail} label="Official Email" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="officer@tn.gov.in" />
                        <InputField icon={Lock} label="Password" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="••••••••" />

                        <GlowButton type="submit" variant="dark" size="md" fullWidth disabled={loading}>
                          {loading ? "Authenticating…" : "Sign In to Console"}
                        </GlowButton>
                      </div>

                      {/* Quick presets */}
                      <div className="mt-6 pt-5 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">⚡ Judge Demo — One-Click Login</span>
                          <span className="text-[9px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full font-mono">BYPASS</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2.5">
                          {[
                            { id: "adm-111", label: "State Admin", sub: "Dr. K. Srinivasan, IAS · Chennai", variant: "dark" as const, badge: "STATE", emoji: "🏛️" },
                            { id: "adm-222", label: "District Officer", sub: "Thiru. M. Prathap, IAS · Coimbatore", variant: "primary" as const, badge: "DISTRICT", emoji: "🗂️" },
                            { id: "adm-333", label: "Field Engineer", sub: "Selvi P. Ramya · Coimbatore", variant: "secondary" as const, badge: "FIELD", emoji: "🔧" },
                          ].map((preset) => (
                            <motion.div
                              key={preset.id}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ type: "spring", stiffness: 280 }}
                            >
                              <GlowButton
                                variant={preset.variant}
                                size="sm"
                                fullWidth
                                disabled={loading}
                                onClick={() => bypassAdmin(preset.id)}
                                icon={<ArrowRight className="w-3.5 h-3.5" />}
                              >
                                <span className="flex items-center justify-between w-full">
                                  <span className="flex items-center space-x-2">
                                    <span>{preset.emoji}</span>
                                    <span className="text-left">
                                      <strong className="block text-[12px] leading-none">{preset.label}</strong>
                                      <span className="text-[9px] opacity-70 font-normal leading-none mt-0.5 block">{preset.sub}</span>
                                    </span>
                                  </span>
                                  <span className="text-[8px] font-mono font-bold opacity-60 border border-current rounded px-1.5 py-0.5 shrink-0 ml-2">
                                    {preset.badge}
                                  </span>
                                </span>
                              </GlowButton>
                            </motion.div>
                          ))}
                        </div>
                        {loading && (
                          <motion.p
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-center text-[10px] text-primary font-mono mt-3 animate-pulse"
                          >
                            Authenticating bypass session…
                          </motion.p>
                        )}
                      </div>

                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
