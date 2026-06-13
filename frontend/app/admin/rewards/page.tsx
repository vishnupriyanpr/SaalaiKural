"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Award, TrendingUp, Check, X, Tag, Plus, Edit3, 
  Trash2, RefreshCw, Sparkles, Zap, Percent, ShieldCheck
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import { db } from "@/lib/db";
import { RewardItem, RewardRedemption, CivilianUser } from "@/lib/seedData";

export default function AdminRewards() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  
  // Datasets
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [civilians, setCivilians] = useState<CivilianUser[]>([]);
  const [multipliers, setMultipliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newItem, setNewItem] = useState({
    name: "",
    icon: "🌳",
    pointsCost: 100,
    category: "eco" as "plant" | "food" | "eco",
    stock: 50
  });

  const [newMultiplier, setNewMultiplier] = useState({
    district: "Coimbatore",
    multiplier: 2,
    startDate: "",
    endDate: ""
  });

  // Load session & datasets
  useEffect(() => {
    const sess = localStorage.getItem("roadguard_session");
    if (!sess) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(sess);
    if (parsed.role !== "admin") {
      router.push("/login");
      return;
    }
    setSession(parsed);

    const loadData = async () => {
      const rews = await db.getRewards();
      const reds = await db.getRedemptions();
      const civs = await db.getCivilians();
      const mults = await db.getMultiplierEvents();

      setRewards(rews);
      setRedemptions(reds);
      setCivilians(civs);
      setMultipliers(mults);
      setLoading(false);
    };

    loadData();

    // Subscribe to database updates
    const unsubscribe = db.subscribe((state) => {
      setRewards(state.rewards);
      setRedemptions(state.redemptions);
      setCivilians(state.civilians);
      setMultipliers(state.multiplierEvents);
    });

    return () => unsubscribe();
  }, [router]);

  // Actions
  const handleApproveRedemption = async (redId: string) => {
    try {
      const red = redemptions.find(r => r.id === redId);
      if (!red) return;

      // 1. Update redemption status to approved
      await db.updateRedemption(redId, { status: "approved" });

      // 2. Decrement stock on reward item
      const item = rewards.find(r => r.name === red.item_name);
      if (item) {
        await db.updateReward(item.id, { stock: Math.max(item.stock - 1, 0) });
      }

      // 3. Create Notification for civilian
      await db.createNotification({
        target_role: "civilian",
        target_id: red.civilian_id,
        title: "Eco Reward Approved! 🌳",
        body: `Your redemption request for '${red.item_name}' was verified by the admin team. Present your QR ticket to pick it up!`,
        type: "reward_approval"
      });

      alert("Redemption request approved!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectRedemption = async (redId: string) => {
    try {
      const red = redemptions.find(r => r.id === redId);
      if (!red) return;

      // 1. Update status
      await db.updateRedemption(redId, { status: "rejected" });

      // 2. Return points back to Civilian profile
      const civilian = civilians.find(c => c.id === red.civilian_id);
      if (civilian) {
        await db.updateCivilian(civilian.id, {
          points_total: civilian.points_total + red.points_cost,
        });
      }

      // 3. Notify civilian
      await db.createNotification({
        target_role: "civilian",
        target_id: red.civilian_id,
        title: "Redemption Cancelled",
        body: `Your request for '${red.item_name}' was rejected. Points refunded back to balance.`,
        type: "reward_approval"
      });

      alert("Redemption request rejected. Points refunded.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRewardItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name) return;

    try {
      await db.createRewardItem({
        name: newItem.name,
        icon: newItem.icon,
        points_cost: newItem.pointsCost,
        category: newItem.category,
        stock: newItem.stock,
        active: true
      });

      setNewItem({
        name: "",
        icon: "🌳",
        pointsCost: 100,
        category: "eco",
        stock: 50
      });
      alert("Eco Item created in Catalog.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateMultiplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMultiplier.startDate || !newMultiplier.endDate) {
      alert("Please select date ranges.");
      return;
    }

    try {
      await db.createMultiplierEvent(
        newMultiplier.district,
        newMultiplier.multiplier,
        newMultiplier.startDate,
        newMultiplier.endDate
      );

      // Create Admin notification
      await db.createNotification({
        target_role: "admin",
        title: "Point Multiplier Activated! ⚡",
        body: `Active: ${newMultiplier.multiplier}x points enabled for ${newMultiplier.district} between ${newMultiplier.startDate} and ${newMultiplier.endDate}.`,
        type: "cluster_alert"
      });

      // Create broadcast to all civilians in Coimbatore/Chennai
      await db.createNotification({
        target_role: "all",
        target_id: null,
        title: `Point Booster Event in ${newMultiplier.district}! 🔥`,
        body: `Monsoon Pre-Alert: All road damage reports verified in ${newMultiplier.district} earn ${newMultiplier.multiplier}x points! Help clear waterlogging quickly.`,
        type: "point_gain"
      });

      alert("Point Multiplier Event registered and broadcasted!");
      setNewMultiplier({
        district: "Coimbatore",
        multiplier: 2,
        startDate: "",
        endDate: ""
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return null;

  // Calculate Points Analytics
  const pointsIssued = civilians.reduce((sum, c) => sum + c.points_total, 0);
  const pointsRedeemed = civilians.reduce((sum, c) => sum + c.points_redeemed, 0);

  const pendingRedemptions = redemptions.filter(r => r.status === "pending");

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-slate-800 dark:text-slate-100 flex flex-col transition-colors pb-12">
      <Navbar portal="admin" userName={session?.name} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Redemptions & Catalog panel */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Redemption queue */}
          <div className="p-5 rounded-2xl glass border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
            <div>
              <h2 className="text-base md:text-lg font-display font-black tracking-tight dark:text-white text-secondary">
                Pending Eco Redemptions
              </h2>
              <p className="text-[11px] text-slate-400">Citizen requests waiting for physical sapling/seeds distribution approvals</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-mono text-slate-450 tracking-wider">
                    <th className="pb-3">Citizen</th>
                    <th className="pb-3">Reward Item</th>
                    <th className="pb-3">Points Cost</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Approve</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
                  {pendingRedemptions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-400">No pending requests. All tickets resolved!</td>
                    </tr>
                  ) : (
                    pendingRedemptions.map((red) => {
                      const userObj = civilians.find(c => c.id === red.civilian_id);
                      return (
                        <tr key={red.id} className="text-xs hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition">
                          <td className="py-3 font-bold dark:text-slate-200 text-slate-700">
                            {userObj?.full_name || "Unknown Citizen"}
                            <span className="text-[10px] text-slate-400 font-mono block">District: {userObj?.district}</span>
                          </td>
                          <td className="py-3">
                            {red.item_name}
                          </td>
                          <td className="py-3 font-mono font-bold text-primary">
                            {red.points_cost} PTS
                          </td>
                          <td className="py-3 capitalize">
                            <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning font-bold text-[9px]">
                              {red.status}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end space-x-1.5">
                              <button
                                onClick={() => handleRejectRedemption(red.id)}
                                className="p-1 rounded bg-danger/10 hover:bg-danger/20 text-danger transition"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleApproveRedemption(red.id)}
                                className="p-1 rounded bg-success/10 hover:bg-success/20 text-success transition"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reward Catalog Editor */}
          <div className="p-5 rounded-2xl glass border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
            <div>
              <h2 className="text-base md:text-lg font-display font-black tracking-tight dark:text-white text-secondary">
                Reward Catalog Catalog
              </h2>
              <p className="text-[11px] text-slate-400">Eco-store catalog inventory stocks and points pricing adjustments</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rewards.map((item) => (
                <div key={item.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/60 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <strong className="text-xs font-bold block dark:text-slate-200 text-slate-700 leading-snug">
                        {item.name}
                      </strong>
                      <span className="text-[10px] text-slate-500 capitalize">
                        Category: {item.category} • Cost: <strong className="font-mono text-primary">{item.points_cost} PTS</strong>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10.5px] px-2 py-0.5 rounded font-bold ${
                      item.stock > 10 ? "text-success bg-success/10" : "text-danger bg-danger/10"
                    }`}>
                      {item.stock} in stock
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Multipliers & Side additions pane */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Points Multiplier engine */}
          <div className="p-5 rounded-2xl glass border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
            <div className="flex items-center space-x-1.5 text-primary font-bold text-base font-display">
              <Zap className="w-5 h-5 animate-pulse" />
              <span>Points Multiplier Engine</span>
            </div>
            
            <form onSubmit={handleCreateMultiplier} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 block">District Zone</label>
                <select
                  value={newMultiplier.district}
                  onChange={(e) => setNewMultiplier(prev => ({ ...prev, district: e.target.value }))}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-xs focus:outline-none"
                >
                  <option value="Coimbatore">Coimbatore (கோயம்புத்தூர்)</option>
                  <option value="Chennai">Chennai (சென்னை)</option>
                  <option value="Madurai">Madurai</option>
                  <option value="Salem">Salem</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 block">Point Multiplier Scale</label>
                <select
                  value={newMultiplier.multiplier}
                  onChange={(e) => setNewMultiplier(prev => ({ ...prev, multiplier: Number(e.target.value) }))}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-xs font-mono font-bold focus:outline-none"
                >
                  <option value={1.5}>1.5x Points Booster</option>
                  <option value={2}>2.0x Double Points</option>
                  <option value={3}>3.0x Triple Points (Emergency)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-400 block">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newMultiplier.startDate}
                    onChange={(e) => setNewMultiplier(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-400 block">End Date</label>
                  <input
                    type="date"
                    required
                    value={newMultiplier.endDate}
                    onChange={(e) => setNewMultiplier(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold transition flex items-center justify-center space-x-1"
              >
                <Zap className="w-4 h-4" />
                <span>Deploy Multiplier Booster</span>
              </button>
            </form>

            {/* Active Multipliers List */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[9.5px] font-mono uppercase tracking-wider text-slate-450 block">Active point boosters</span>
              {multipliers.map((m, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-primary/20 bg-primary/5 flex items-center justify-between text-xs">
                  <div>
                    <strong className="font-bold text-primary">{m.district} Booster</strong>
                    <span className="text-[10px] text-slate-400 block font-mono">Range: {m.startDate} to {m.endDate}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-primary text-white font-mono font-bold">
                    {m.multiplier}x
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Catalog Add form */}
          <div className="p-5 rounded-2xl glass border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400">Add reward item</h2>
            <form onSubmit={handleCreateRewardItem} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-450 block">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Teak Sapling (தேக்கு)"
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-450 block">Emoji Icon</label>
                  <input
                    type="text"
                    required
                    value={newItem.icon}
                    onChange={(e) => setNewItem(prev => ({ ...prev, icon: e.target.value }))}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 focus:outline-none text-center text-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-450 block">Stock Qty</label>
                  <input
                    type="number"
                    required
                    value={newItem.stock}
                    onChange={(e) => setNewItem(prev => ({ ...prev, stock: Number(e.target.value) }))}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 focus:outline-none text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 font-semibold">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-450 block">Points Cost</label>
                  <input
                    type="number"
                    required
                    value={newItem.pointsCost}
                    onChange={(e) => setNewItem(prev => ({ ...prev, pointsCost: Number(e.target.value) }))}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 focus:outline-none text-center text-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-450 block">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 focus:outline-none"
                  >
                    <option value="plant">Plant / seeds</option>
                    <option value="food">Food staples</option>
                    <option value="eco">Eco Products</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-secondary hover:bg-secondary-hover text-white font-bold rounded-xl transition"
              >
                Publish Reward Catalog Item
              </button>
            </form>
          </div>

        </div>

      </main>
    </div>
  );
}
