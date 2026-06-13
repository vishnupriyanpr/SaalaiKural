"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  DollarSign, BarChart2, ShieldCheck, Info, Calendar, Landmark, 
  ArrowUpRight, PiggyBank, RefreshCw, Star
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import { db } from "@/lib/db";
import { CivilianUser, Complaint, Project } from "@/lib/seedData";

export default function CivilianBudget() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<CivilianUser | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

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
      const comps = await db.getComplaints();
      const projs = await db.getProjects();
      
      setUser(civ);
      setProjects(projs);
      setComplaints(comps.filter(c => c.civilian_id === parsed.userId));
      setLoading(false);
    };

    loadData();

    // Subscribe to DB changes
    const unsubscribe = db.subscribe(async (state) => {
      const civ = state.civilians.find(c => c.id === parsed.userId);
      if (civ) setUser(civ);
      const comps = state.complaints.filter(c => c.civilian_id === parsed.userId);
      setComplaints(comps);
      setProjects(state.projects);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading || !user) return null;

  // 1. Calculate civilian's personal impact
  const totalMobilized = complaints.reduce((sum, c) => sum + c.budget_estimated, 0);
  const totalSpentOnRepairs = complaints
    .filter(c => c.status === "resolved")
    .reduce((sum, c) => sum + (c.budget_actual || 0), 0);

  // Calculate savings from clustered reports (25% saved on Coimbatore RS Puram bulk project)
  const isPartofCluster = complaints.some(c => 
    c.district === "Coimbatore" && 
    c.lat >= 11.014 && c.lat <= 11.020 && 
    c.lng >= 76.953 && c.lng <= 76.960
  );
  const personalClusterSavings = isPartofCluster ? 16250 : 0; // estimated savings attributed to their reports!

  // 2. District PWD Allocations (Public allocations)
  const districtBudgets = [
    { district: "Chennai Region", total: 4500000, spent: 2850000 },
    { district: "Coimbatore Region", total: 3200000, spent: 1950000 },
    { district: "Madurai Region", total: 2400000, spent: 1100000 },
    { district: "Trichy Region", total: 1800000, spent: 850000 }
  ];

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-slate-800 dark:text-slate-100 flex flex-col transition-colors pb-16">
      <Navbar portal="civilian" userName={user.full_name} userPoints={user.points_total} />

      <main className="flex-grow max-w-md md:max-w-4xl w-full mx-auto px-4 mt-6 space-y-6">
        
        {/* Your Impact Header card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-secondary to-slate-900 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="absolute top-[-25%] right-[-10%] w-48 h-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-450 font-bold block">நிதி வெளிப்படைத்தன்மை (Budget Transparency)</span>
            <h2 className="text-2xl font-display font-black tracking-tight leading-none">
              Your Fiscal Mobilization
            </h2>
            <p className="text-xs text-slate-350 mt-1 max-w-sm">
              See the exact amount of public PWD repair funds mobilized in Tamil Nadu by your reports.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 px-5 py-4 rounded-xl text-center self-stretch md:self-auto shrink-0 flex flex-col justify-center items-center">
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-450 block mb-0.5">நிழல் நிதி திரட்டல் (Your PWD Impact)</span>
            <strong className="block text-xl md:text-2xl font-display font-black text-primary leading-tight">
              ₹{totalMobilized.toLocaleString()}
            </strong>
          </div>
        </div>

        {/* Savings Attributed Grid */}
        {personalClusterSavings > 0 && (
          <div className="p-4 rounded-xl border border-success/20 bg-success/5 dark:bg-success-light/10 flex items-center justify-between shadow-sm glow-xp">
            <div className="flex items-center space-x-3.5 pl-1">
              <PiggyBank className="w-6 h-6 text-success animate-bounce shrink-0" />
              <div>
                <span className="text-[9px] font-mono uppercase text-slate-400">Cooperative Spatial Optimization Savings</span>
                <strong className="text-sm font-extrabold block text-success leading-tight">
                  You helped save ₹{personalClusterSavings.toLocaleString()} PWD funds!
                </strong>
                <p className="text-[10.5px] text-slate-500 mt-0.5 leading-snug">
                  Because your pothole report was bundled into a spatial bulk repair zone, dispatch costs were optimized.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Complaint Ledger comparisons (Simulated Chart) */}
        <div className="p-5 rounded-2xl glass border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
          <div>
            <h3 className="font-display font-bold text-sm md:text-base mb-1">நிதி ஒப்பீடு (Estimated vs Actual Cost)</h3>
            <p className="text-xs text-slate-400">Audit trail comparing the AI projected budgets against actual contractor receipts</p>
          </div>

          <div className="space-y-5">
            {complaints.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No reports submitted. File a report to view financial audit trails.</p>
            ) : (
              complaints.map((comp) => {
                const hasCost = comp.status === "resolved";
                const isUnderRepair = comp.status === "in_progress" || comp.status === "assigned";
                const saving = hasCost && comp.budget_actual ? comp.budget_estimated - comp.budget_actual : 0;
                
                // Progress Bar ratios
                const maxBudget = 30000;
                const estPercent = Math.min((comp.budget_estimated / maxBudget) * 100, 100);
                const actPercent = comp.budget_actual ? Math.min((comp.budget_actual / maxBudget) * 100, 100) : 0;

                return (
                  <div key={comp.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-850 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-xs font-bold block dark:text-slate-200 text-slate-700 truncate max-w-[200px]">
                          {comp.title}
                        </strong>
                        <span className="text-[9px] text-slate-400 font-mono block">Status: {comp.status.toUpperCase()}</span>
                      </div>
                      
                      {saving > 0 && (
                        <span className="px-2 py-0.5 rounded bg-success/15 text-success font-mono font-bold text-[9px]">
                          Saved ₹{saving.toLocaleString()} (5%)
                        </span>
                      )}
                    </div>

                    {/* Dual Budget Progress Bars */}
                    <div className="space-y-2">
                      {/* Estimated Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-mono text-slate-450 leading-none">
                          <span>Projected Budget Allocation</span>
                          <span>₹{comp.budget_estimated.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-900 overflow-hidden">
                          <div 
                            className="h-full bg-secondary-hover"
                            style={{ width: `${estPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Actual Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-mono text-slate-450 leading-none">
                          <span>Actual Spent Invoice Receipt</span>
                          <span>{hasCost ? `₹${comp.budget_actual?.toLocaleString()}` : isUnderRepair ? "Under construction..." : "Pending dispatch..."}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-900 overflow-hidden">
                          <div 
                            className="h-full bg-primary"
                            style={{ width: hasCost ? `${actPercent}%` : "0%" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Public District Budgets grid */}
        <div className="p-5 rounded-2xl glass border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
          <div>
            <h3 className="font-display font-bold text-sm md:text-base mb-1">மாநில பொது நிதியொதுக்கீடு (District PWD Allocations)</h3>
            <p className="text-xs text-slate-400">Public transparency ledger showing district infrastructure maintenance funds</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {districtBudgets.map((d, idx) => {
              const spentPercent = Math.round((d.spent / d.total) * 100);
              return (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/60 space-y-2">
                  <strong className="text-xs font-bold block dark:text-slate-200 text-slate-700">{d.district}</strong>
                  <div className="text-xs space-y-1 text-slate-450">
                    <div className="flex justify-between">
                      <span>Total Fund:</span>
                      <strong className="font-mono text-slate-700 dark:text-slate-200">₹{(d.total / 100000).toFixed(1)} Lakhs</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Spent:</span>
                      <strong className="font-mono text-slate-700 dark:text-slate-200">₹{(d.spent / 100000).toFixed(1)} Lakhs ({spentPercent}%)</strong>
                    </div>
                  </div>
                  {/* progress */}
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-900 overflow-hidden">
                    <div 
                      className="h-full bg-primary"
                      style={{ width: `${spentPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}
