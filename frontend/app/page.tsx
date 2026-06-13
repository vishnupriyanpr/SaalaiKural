"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight, ShieldCheck, User, MapPin, Award, Zap,
  Building2, TreePine, TrendingUp, Handshake, ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import TamilNadu3DMap from "@/components/shared/TamilNadu3DMap";
import LiveBackground from "@/components/shared/LiveBackground";

/* ════════════════════════════════════════════════
   COUNT-UP HOOK
════════════════════════════════════════════════ */
function useCountUp(target: number, duration = 2000, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
}

/* ════════════════════════════════════════════════
   STAT COUNTER CARD
════════════════════════════════════════════════ */
function StatCard({ value, suffix, label, delay }: { value: number; suffix: string; label: string; delay: number }) {
  const ref = useRef(null);
  const [started, setStarted] = useState(false);
  const count = useCountUp(value, 1800, started);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="text-center"
    >
      <div className="text-3xl md:text-5xl font-black text-white drop-shadow-lg" style={{ fontFamily: "'Outfit',sans-serif" }}>
        {count}{suffix}
      </div>
      <div className="text-[11px] uppercase font-mono tracking-widest text-white/60 mt-1">{label}</div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════
   FLOATING BADGE
════════════════════════════════════════════════ */
function FloatingBadge({ icon, label, delay }: { icon: React.ReactNode; label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 16, delay }}
      whileHover={{ scale: 1.12, y: -4 }}
      className="flex flex-col items-center gap-1.5 cursor-default"
    >
      <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/30 backdrop-blur-sm flex items-center justify-center shadow-lg">
        {icon}
      </div>
      <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">{label}</span>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════
   PORTAL CARD
════════════════════════════════════════════════ */
function PortalCard({
  href, icon: Icon, label, labelTamil, desc, cta, accent, delay,
}: {
  href: string; icon: any; label: string; labelTamil: string; desc: string;
  cta: string; accent: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -8, boxShadow: "0 32px 80px rgba(0,0,0,0.25)" }}
    >
      <Link href={href} className="block group">
        <div className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-7 space-y-5 transition-all duration-300 group-hover:bg-white/15 group-hover:border-white/35">
          {/* Glow accent */}
          <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-30 ${accent}`} />

          <div className="relative z-10 space-y-4">
            <div className={`w-12 h-12 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-white" />
            </div>

            <div>
              <h3 className="text-base font-black text-white leading-tight">{label}</h3>
              <p className="text-sm text-white/50 font-tamil mt-0.5">{labelTamil}</p>
            </div>

            <p className="text-sm text-white/70 leading-relaxed">{desc}</p>

            <div className="flex items-center gap-2 text-sm font-bold text-white group-hover:gap-3 transition-all">
              <span>{cta}</span>
              <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.4, repeat: Infinity }}>
                <ArrowRight className="w-4 h-4" />
              </motion.span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════
   FEATURE ROW
════════════════════════════════════════════════ */
function FeatureRow({ icon: Icon, title, desc, delay }: { icon: any; title: string; desc: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="flex items-start gap-4"
    >
      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-5 h-5 text-amber-400" />
      </div>
      <div>
        <h4 className="font-bold text-white text-sm">{title}</h4>
        <p className="text-xs text-white/55 leading-relaxed mt-0.5">{desc}</p>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════ */
export default function HomePage() {
  const { scrollY } = useScroll();
  const heroParallax = useTransform(scrollY, [0, 600], [0, 120]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.4]);

  return (
    <div className="min-h-screen bg-[#0a0f1a] overflow-x-hidden">

      {/* ════════════════════════════════════════
          HERO — Full-screen Tamil Nadu Banner
      ════════════════════════════════════════ */}
      <section className="relative w-full h-screen min-h-[640px] flex flex-col overflow-hidden">

        {/* Hero background image with parallax */}
        <motion.div
          style={{ y: heroParallax }}
          className="absolute inset-0"
        >
          <img
            src="/tn-hero.png"
            alt="Tamil Nadu — Where Every Journey Creates a Story"
            className="w-full h-full object-cover"
            style={{
              objectPosition: "center center",
              filter: "contrast(1.08) saturate(1.15) brightness(1.0)",
            }}
          />
          {/* Layer 1: Heavy dark on LEFT for text readability */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to right, rgba(8,12,22,0.95) 0%, rgba(8,12,22,0.85) 35%, rgba(8,12,22,0.4) 55%, transparent 100%)"
          }} />
          {/* Layer 2: Top vignette for navbar */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 25%, transparent 70%, rgba(0,0,0,0.7) 100%)"
          }} />

          {/* Live Animations (Birds, Dust, Sun Rays) */}
          <LiveBackground />
        </motion.div>

        {/* ── Navbar ── */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-20 px-6 md:px-14 py-5 flex justify-between items-center bg-black/10 backdrop-blur-sm border-b border-white/5"
        >
          {/* Brand */}
          <div className="flex items-center gap-3">
            <img src="/tn-logo.png" alt="Tamil Nadu Government" className="w-10 h-10 object-contain drop-shadow-xl" />
            <div>
              <p className="font-black text-white text-sm leading-none tracking-tight" style={{ fontFamily: "'Outfit',sans-serif" }}>
                சாலையின் குரல் <span className="text-amber-400" style={{ fontFamily: "'Noto Sans Tamil',sans-serif" }}>தமிழ்நாடு</span>
              </p>
              <p className="text-[9px] text-white/50 font-mono uppercase tracking-widest mt-0.5">PWD Civic Tech Platform</p>
            </div>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8 text-[13px] font-semibold text-white/70">
            {["Features", "Portals", "Impact"].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`}
                className="hover:text-white transition-colors cursor-pointer">{l}</a>
            ))}
          </div>

          {/* CTA */}
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/25"
            >
              Enter Portal <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
        </motion.nav>

        {/* ── Hero Content ── */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 md:px-14 pb-20">

          {/* Tamil Nadu brand pill */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-[11px] text-white/70 font-mono uppercase tracking-widest w-fit mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Tamil Nadu · Where Every Journey Creates a Story
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-none tracking-tight max-w-3xl"
            style={{ fontFamily: "'Outfit','Impact',sans-serif" }}
          >
            Welcome to<br />
            <span className="text-amber-400">Tamil Nadu</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mt-5 text-base md:text-lg text-white/65 max-w-xl leading-relaxed"
          >
            Land of Timeless Heritage, Vibrant Culture & Endless Opportunities.
            AI-powered civic road safety platform for 38 districts.
          </motion.p>

          {/* 4 Cultural Badges */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex gap-6 mt-8"
          >
            <FloatingBadge icon={<Building2 className="w-5 h-5 text-amber-400" />} label="Heritage" delay={0.75} />
            <FloatingBadge icon={<span className="text-xl">🎭</span>} label="Culture" delay={0.85} />
            <FloatingBadge icon={<TrendingUp className="w-5 h-5 text-green-400" />} label="Growth" delay={0.95} />
            <FloatingBadge icon={<Handshake className="w-5 h-5 text-blue-400" />} label="Opportunities" delay={1.05} />
          </motion.div>

          {/* CTA button */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
            className="flex flex-wrap gap-4 mt-10"
          >
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.06, boxShadow: "0 0 40px rgba(245,158,11,0.5)" }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 rounded-full bg-amber-500 text-black font-black text-sm flex items-center gap-2 shadow-xl shadow-amber-500/30"
              >
                Explore More <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <Link href="#portals">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 rounded-full bg-white/10 border border-white/25 text-white font-bold text-sm flex items-center gap-2 backdrop-blur-sm"
              >
                View Portals
              </motion.button>
            </Link>
          </motion.div>
        </div>

        {/* Stone plaque (bottom-left) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.1 }}
          className="absolute bottom-10 left-6 md:left-14 z-10 bg-black/40 backdrop-blur-md border border-white/15 rounded-xl px-5 py-3"
        >
          <p className="text-[10px] font-mono text-white/50 uppercase tracking-widest">Tamil Nadu</p>
          <p className="text-xs font-bold text-white/80 mt-0.5">Where Every Journey Creates a Story 🪷</p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.a
          href="#stats"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-white/40 hover:text-white/70 transition-colors cursor-pointer"
        >
          <span className="text-[10px] font-mono uppercase tracking-widest">Scroll</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.4, repeat: Infinity }}>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.a>
      </section>

      {/* ════════════════════════════════════════
          STATS BAND
      ════════════════════════════════════════ */}
      <section id="stats" className="relative bg-gradient-to-r from-amber-600 via-orange-600 to-red-700 py-16 px-6">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "url('/tn-hero.png')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="relative max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
          <StatCard value={38} suffix="" label="Districts" delay={0} />
          <StatCard value={2400} suffix="+" label="Reports Fixed" delay={0.1} />
          <StatCard value={35} suffix="%" label="Budget Saved" delay={0.2} />
          <StatCard value={12} suffix="K+" label="Active Citizens" delay={0.3} />
        </div>
      </section>

      {/* ════════════════════════════════════════
          PORTALS SECTION
      ════════════════════════════════════════ */}
      <section id="portals" className="relative py-24 px-6 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1a] via-[#0d1a2e] to-[#0a0f1a]" />
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "url('/tn-hero.png')", backgroundSize: "cover", backgroundPosition: "center top" }} />
        {/* Glow orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14 space-y-3"
          >
            <span className="inline-block text-[10px] font-mono uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-4 py-1.5">
              Choose Your Portal
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white" style={{ fontFamily: "'Outfit',sans-serif" }}>
              Two Portals.<br />
              <span className="text-amber-400">One Mission.</span>
            </h2>
            <p className="text-sm text-white/50 max-w-lg mx-auto leading-relaxed">
              Citizens report road hazards and earn eco-rewards. Government officers monitor, verify, and dispatch smart repair squads.
            </p>
          </motion.div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PortalCard
              href="/login"
              icon={User}
              label="Citizen Portal"
              labelTamil="குடிமக்கள் இணையதளம்"
              desc="Report road damage, earn XP points, unlock level badges, and redeem eco-rewards like plants and seeds. Track your impact live on the district map."
              cta="Access Civilian Portal"
              accent="bg-amber-500"
              delay={0}
            />
            <PortalCard
              href="/login"
              icon={ShieldCheck}
              label="Official Console"
              labelTamil="அதிகாரிகள் கன்சோல்"
              desc="Monitor AI-classified alerts, bulk-merge repair zones, allocate workers via the Kanban board, and export PDF budget reports for state auditing."
              cta="Access Admin Console"
              accent="bg-blue-500"
              delay={0.15}
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FEATURES SECTION
      ════════════════════════════════════════ */}
      <section id="features" className="relative py-24 px-6 overflow-hidden">
        {/* Split background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a] to-[#080c14]" />
          <img src="/tn-hero.png" alt=""
            className="absolute right-0 top-0 w-1/2 h-full object-cover opacity-10"
            style={{ maskImage: "linear-gradient(to left, rgba(0,0,0,0.6), transparent)" }}
          />
        </div>

        <div className="relative max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Left: Feature list */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-2"
            >
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">Platform Features</span>
              <h2 className="text-3xl md:text-4xl font-black text-white" style={{ fontFamily: "'Outfit',sans-serif" }}>
                Built for<br /><span className="text-amber-400">Tamil Nadu&apos;s</span> Roads
              </h2>
            </motion.div>

            <div className="space-y-6">
              <FeatureRow icon={MapPin} title="Live Geo-Mapping" desc="Real-time complaint heatmap across all 38 districts with severity color coding." delay={0.1} />
              <FeatureRow icon={Award} title="Gamified Civic XP" desc="Earn points per verified report. Level up from Rookie to Road Legend. Win badges." delay={0.2} />
              <FeatureRow icon={Zap} title="AI Auto-Classification" desc="Photo analysis auto-detects pothole depth, severity score, and estimated repair cost." delay={0.3} />
              <FeatureRow icon={TrendingUp} title="Budget Intelligence" desc="AI clusters nearby reports into bundled repair zones — saving up to 35% in state spending." delay={0.4} />
              <FeatureRow icon={TreePine} title="Eco Reward Store" desc="Redeem earned points for plants, seeds, and eco-products from the civic store." delay={0.5} />
            </div>
          </div>

          {/* Right: Image panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/60 hidden md:block"
          >
            <img src="/tn-hero.png" alt="Tamil Nadu Roads" className="w-full h-96 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            {/* Floating info cards on image */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md border border-white/15 rounded-xl p-4"
            >
              <p className="text-[10px] font-mono text-white/50 uppercase tracking-wider">Live Reports</p>
              <p className="text-xl font-black text-white mt-0.5">2,412 <span className="text-green-400 text-sm">✓ Fixed</span></p>
            </motion.div>

            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute top-6 right-6 bg-amber-500/20 backdrop-blur-md border border-amber-400/30 rounded-xl p-4"
            >
              <p className="text-[10px] font-mono text-amber-300/70 uppercase tracking-wider">Budget Saved</p>
              <p className="text-xl font-black text-amber-400 mt-0.5">₹4.2 Cr</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          IMPACT SECTION — Tamil Nadu Map Split
      ════════════════════════════════════════ */}
      <section id="impact" className="relative py-24 px-6 overflow-hidden min-h-[600px] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#101827] via-[#0a0f1a] to-[#0a0f1a]" />

        {/* Glow behind the 3D map */}
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none hidden md:block" />

        <div className="relative max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Text and signs on the left */}
          <div className="space-y-10 z-10 text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <span className="inline-block text-[10px] font-mono uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-4 py-1.5">
                District Coverage
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-white" style={{ fontFamily: "'Outfit',sans-serif" }}>
                Covering All of<br /><span className="text-amber-400">Tamil Nadu</span>
              </h2>
              <p className="text-sm text-white/50 max-w-md mx-auto md:mx-0">
                From Chennai to Kanyakumari, Coimbatore to Cuddalore — every pothole matters. Explore the state interactively.
              </p>
            </motion.div>

            {/* Road sign distances */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-block bg-green-800/40 border-2 border-green-600/50 rounded-xl p-6 backdrop-blur-sm font-mono text-left shadow-2xl"
            >
              {[
                { city: "Chennai     சென்னை", km: "100 km ↑" },
                { city: "Madurai     மதுரை", km: "250 km ↑" },
                { city: "Coimbatore  கோயம்பத்தூர்", km: "330 km ↑" },
              ].map((r, i) => (
                <div key={i} className={`flex justify-between gap-16 ${i > 0 ? "border-t border-green-600/30 pt-2 mt-2" : ""}`}>
                  <span className="text-white/90 text-sm font-bold">{r.city}</span>
                  <span className="text-white/70 text-sm">{r.km}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* 3D Map Container on the right */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full h-[400px] md:h-[600px] relative z-20"
          >
            <TamilNadu3DMap />
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FINAL CTA SECTION
      ════════════════════════════════════════ */}
      <section className="relative py-28 px-6 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/tn-hero.png" alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <img src="/tn-logo.png" alt="Tamil Nadu" className="w-16 h-16 object-contain mx-auto drop-shadow-2xl" />
            <h2 className="text-4xl md:text-6xl font-black text-white" style={{ fontFamily: "'Outfit',sans-serif" }}>
              Ready to Build<br /><span className="text-amber-400">Safer Roads?</span>
            </h2>
            <p className="text-base text-white/55 max-w-md mx-auto">
              Join thousands of Tamil Nadu citizens making their roads safer — one report at a time.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.06, boxShadow: "0 0 50px rgba(245,158,11,0.6)" }}
                whileTap={{ scale: 0.97 }}
                className="px-10 py-4 rounded-full bg-amber-500 text-black font-black text-sm flex items-center gap-2 shadow-2xl shadow-amber-500/40"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer className="border-t border-white/8 bg-[#060910] py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] font-mono text-white/30">
          <div className="flex items-center gap-3">
            <img src="/tn-logo.png" alt="" className="w-6 h-6 object-contain opacity-50" />
            <span>சாலையின் குரல் TN — Highways & PWD Department</span>
          </div>
          <span>Digital India Civic Tech Challenge 2026</span>
          <span>© 2026 Government of Tamil Nadu</span>
        </div>
      </footer>

    </div>
  );
}
