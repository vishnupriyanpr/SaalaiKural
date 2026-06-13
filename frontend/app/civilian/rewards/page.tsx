"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Award, Filter, ShoppingBag, CheckCircle, Clock, X,
  ArrowRight, TreePine, Leaf, ShieldCheck, Heart, Sparkles
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import { db } from "@/lib/db";
import { CivilianUser, RewardItem, RewardRedemption } from "@/lib/seedData";
import PointCounter from "@/components/civilian/PointCounter";

export default function CivilianRewards() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<CivilianUser | null>(null);
  
  // Datasets
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Selection for redeem confirmation
  const [confirmItem, setConfirmItem] = useState<RewardItem | null>(null);
  const [successRedeemed, setSuccessRedeemed] = useState<RewardItem | null>(null);

  // Load session & data
  useEffect(() => {
    const sess = localStorage.getItem("roadguard_session");
    if (!sess) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(sess);
    setSession(parsed);

    const loadData = async () => {
      const civ = await db.getCivilianById(parsed.userId);
      const rews = await db.getRewards();
      const reds = await db.getRedemptions();

      setUser(civ);
      setRewards(rews);
      setRedemptions(reds.filter(r => r.civilian_id === parsed.userId));
      setLoading(false);
    };

    loadData();

    // Subscribe to realtime updates
    const unsubscribe = db.subscribe((state) => {
      const civ = state.civilians.find(c => c.id === parsed.userId);
      if (civ) setUser(civ);
      setRewards(state.rewards);
      setRedemptions(state.redemptions.filter(r => r.civilian_id === parsed.userId));
    });

    return () => unsubscribe();
  }, [router]);

  const handleRedeemClick = (item: RewardItem) => {
    if (!user) return;
    if (user.points_total < item.points_cost) {
      alert("Insufficient points! Keep reporting road hazards to earn points.");
      return;
    }
    setConfirmItem(item);
  };

  const handleConfirmRedeem = async () => {
    if (!user || !confirmItem) return;

    try {
      // 1. Create redemption transaction
      await db.createRedemption({
        civilian_id: user.id,
        item_name: confirmItem.name,
        points_cost: confirmItem.points_cost,
        status: "pending" // starts as pending approval
      });

      // 2. Deduct points from Civilian User Profile
      await db.updateCivilian(user.id, {
        points_total: user.points_total - confirmItem.points_cost,
        points_redeemed: user.points_redeemed + confirmItem.points_cost
      });

      // 3. Notify Admin
      await db.createNotification({
        target_role: "admin",
        title: "New Redemption Request 🎁",
        body: `Citizen '${user.full_name}' requested redemption for '${confirmItem.name}' (${confirmItem.points_cost} PTS).`,
        type: "reward_approval"
      });

      // 4. Notify Civilian
      await db.createNotification({
        target_role: "civilian",
        target_id: user.id,
        title: "Redemption Submitted! 🎟️",
        body: `Your request for '${confirmItem.name}' is queued for admin approval. We will notify you once ready.`,
        type: "reward_approval"
      });

      setSuccessRedeemed(confirmItem);
      setConfirmItem(null);
    } catch (err) {
      console.error(err);
      alert("Failed to complete redemption.");
    }
  };

  if (loading || !user) return null;

  // INNOVATION: Eco Impact Counter calculations
  // Sum up quantities from approved redemptions
  const approvedReds = redemptions.filter(r => r.status === "approved");
  const treesPlanted = approvedReds.filter(r => r.item_name.includes("Sapling") || r.item_name.includes("Seed")).length * 2 + 10; // default benchmark + earned
  const riceDistributed = approvedReds.filter(r => r.item_name.includes("Rice") || r.item_name.includes("Millet")).length * 5 + 5; // default kgs
  const plasticRecycled = approvedReds.filter(r => r.item_name.includes("Bag") || r.item_name.includes("Bin")).length * 1.5 + 4; // default kg equivalent

  const filteredRewards = rewards.filter(item => {
    return activeCategory === "all" || item.category === activeCategory;
  });

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-slate-800 dark:text-slate-100 flex flex-col transition-colors pb-16">
      <Navbar portal="civilian" userId={user.id} userName={user.full_name} userPoints={user.points_total} />

      <main className="flex-1 max-w-md md:max-w-4xl w-full mx-auto px-4 mt-6 space-y-6">
        
        {/* Eco Impact Ticker */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-success to-emerald-800 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 glow-xp">
          <div className="absolute top-[-20%] right-[-10%] w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          
          <div className="space-y-1 pl-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-200 font-bold block">பசுமை தாக்கம் (Your Eco Impact)</span>
            <h2 className="text-2xl font-display font-black tracking-tight leading-none">
              Sustainability Footprint
            </h2>
            <p className="text-xs text-slate-200 mt-1 max-w-md">
              Converting civic duty rewards directly into environmental benefits for Tamil Nadu.
            </p>
          </div>

          {/* Impact Stats Grid */}
          <div className="grid grid-cols-3 gap-6 bg-black/10 border border-white/10 p-4 rounded-xl text-center self-stretch md:self-auto shrink-0">
            <div className="space-y-1">
              <span className="text-[18px]">🌳</span>
              <strong className="block font-mono font-black text-sm text-white">{treesPlanted} Trees</strong>
              <span className="text-[8.5px] text-emerald-200 block uppercase">Planted</span>
            </div>
            <div className="space-y-1">
              <span className="text-[18px]">🌾</span>
              <strong className="block font-mono font-black text-sm text-white">{riceDistributed} Kg</strong>
              <span className="text-[8.5px] text-emerald-200 block uppercase">Rice/Grain</span>
            </div>
            <div className="space-y-1">
              <span className="text-[18px]">♻️</span>
              <strong className="block font-mono font-black text-sm text-white">{plasticRecycled} Kg</strong>
              <span className="text-[8.5px] text-emerald-200 block uppercase">Recycled</span>
            </div>
          </div>
        </div>

        {/* Balance & Categories Filter */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 rounded-2xl glass border border-slate-200 dark:border-slate-800 shadow-md space-y-3 md:space-y-0">
          <div>
            <span className="text-[9px] uppercase font-mono text-slate-400">உங்களிடம் உள்ள புள்ளிகள் (Balance)</span>
            <div className="flex items-center space-x-2 mt-0.5">
              <PointCounter value={user.points_total} size="md" />
            </div>
          </div>

          {/* Filter Categories */}
          <div className="flex overflow-x-auto p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {["all", "plant", "food", "eco"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold uppercase whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? "bg-primary text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-350"
                }`}
              >
                {cat === "all" ? "All Items" : cat === "plant" ? "Saplings & Seeds" : cat === "food" ? "Food Kits" : "Eco Products"}
              </button>
            ))}
          </div>
        </div>

        {/* Reward Store Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredRewards.map((item) => {
            const canAfford = user.points_total >= item.points_cost;
            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl glass border border-slate-200 dark:border-slate-850 shadow-md flex flex-col justify-between space-y-4 hover:border-slate-350 dark:hover:border-slate-800 transition"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-3xl shadow-inner">
                    {item.icon}
                  </div>
                  <div>
                    <strong className="text-xs font-black block dark:text-slate-200 text-slate-700 leading-snug">
                      {item.name}
                    </strong>
                    <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">
                      Stock: {item.stock} • Category: {item.category}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-850">
                  <span className="font-mono text-sm font-black text-primary">
                    {item.points_cost} PTS
                  </span>
                  <button
                    onClick={() => handleRedeemClick(item)}
                    disabled={!canAfford || item.stock <= 0}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition shadow-sm ${
                      canAfford && item.stock > 0
                        ? "bg-primary hover:bg-primary-hover text-white"
                        : "bg-slate-100 dark:bg-slate-900 text-slate-450 border border-slate-200 dark:border-slate-850 cursor-not-allowed"
                    }`}
                  >
                    Redeem
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Redemption History Table */}
        <div className="p-5 rounded-2xl glass border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
          <div>
            <h3 className="font-display font-bold text-sm md:text-base mb-1">பரிசு வரலாறு (Redemption Ledger)</h3>
            <p className="text-xs text-slate-400">Historical records of redeemed eco benefits</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-150 dark:border-slate-800 text-[10px] uppercase font-mono text-slate-400 tracking-wider">
                  <th className="pb-3">Redeemed Item</th>
                  <th className="pb-3">Points Cost</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Approval Ticket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {redemptions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-xs text-slate-400">No redemptions yet. Redeem your points for eco rewards!</td>
                  </tr>
                ) : (
                  redemptions.map((red) => {
                    const statusColors: any = {
                      pending: "text-warning bg-warning/10",
                      approved: "text-success bg-success/10",
                      rejected: "text-danger bg-danger/10"
                    };

                    return (
                      <tr key={red.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition">
                        <td className="py-3 font-bold dark:text-slate-200 text-slate-700">
                          {red.item_name}
                        </td>
                        <td className="py-3 font-mono font-bold text-primary">
                          {red.points_cost} PTS
                        </td>
                        <td className="py-3 font-mono text-slate-400">
                          {new Date(red.redeemed_at).toLocaleDateString("en-IN")}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${statusColors[red.status]}`}>
                            {red.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setConfirmItem(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm p-6 rounded-2xl glass border border-slate-200 dark:border-slate-800 text-center z-10 shadow-2xl"
            >
              <div className="text-3xl mb-3">{confirmItem.icon}</div>
              <h3 className="font-display font-extrabold text-base mb-1 dark:text-white text-secondary">Confirm Redemption</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Are you sure you want to redeem <strong>{confirmItem.name}</strong> for <strong className="text-primary font-mono">{confirmItem.points_cost} PTS</strong>?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmItem(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 hover:bg-slate-900 text-xs font-bold text-slate-400 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRedeem}
                  className="flex-1 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md transition"
                >
                  Confirm Redemption
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Success Modal */}
        {successRedeemed && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSuccessRedeemed(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm p-6 rounded-2xl glass border border-success/30 text-center z-10 shadow-2xl flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success mb-3 animate-bounce">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="font-display font-extrabold text-base mb-1 text-success">Redemption Queued!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Your order ticket for <strong>{successRedeemed.name}</strong> has been submitted. Check your SMS or present your QR ticket at Coimbatore PWD Nursery once approved!
              </p>
              <button
                onClick={() => setSuccessRedeemed(null)}
                className="w-full py-2.5 rounded-xl bg-success hover:bg-success-hover text-white text-xs font-bold shadow-md transition"
              >
                Close Ticket
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
