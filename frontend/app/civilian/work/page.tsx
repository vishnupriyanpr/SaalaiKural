"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HardHat, Calendar, MapPin, Award, CheckCircle, Download,
  Clock, Star, PlusCircle, ShieldCheck, RefreshCw, FileText, Check
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import { db } from "@/lib/db";
import { CivilianUser, Complaint } from "@/lib/seedData";
import { jsPDF } from "jspdf";

interface JobApplication {
  id: string;
  skill: string;
  availability: string;
  status: "pending" | "approved" | "rejected";
  appliedAt: string;
}

export default function CivilianWork() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<CivilianUser | null>(null);
  const [assignedJobs, setAssignedJobs] = useState<Complaint[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Application form states
  const [skill, setSkill] = useState("Pothole Repair");
  const [availability, setAvailability] = useState("weekends");
  const [idFile, setIdFile] = useState(false);

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
      
      setUser(civ);

      // Find resolved or active complaints assigned to this civilian worker.
      // Selvam Kumar uses worker_id = "wrk-civ-444" in our mock db schema!
      // Let's check for any complaint assigned to worker 'wrk-civ-444'.
      const jobs = comps.filter(c => c.worker_id === "wrk-civ-444");
      setAssignedJobs(jobs);

      // Load applications from localStorage
      if (typeof window !== "undefined") {
        const savedApps = localStorage.getItem(`roadguard_apps_${parsed.userId}`);
        if (savedApps) {
          setApplications(JSON.parse(savedApps));
        } else {
          // default initial pending application
          const defaultApp: JobApplication = {
            id: "app-1",
            skill: "Pothole Repair",
            availability: "Flexible (Weekends)",
            status: "approved",
            appliedAt: "2026-05-20T10:00:00Z"
          };
          setApplications([defaultApp]);
          localStorage.setItem(`roadguard_apps_${parsed.userId}`, JSON.stringify([defaultApp]));
        }
      }

      setLoading(false);
    };

    loadData();

    // Subscribe to DB updates
    const unsubscribe = db.subscribe(async (state) => {
      const civ = state.civilians.find(c => c.id === parsed.userId);
      if (civ) setUser(civ);
      const jobs = state.complaints.filter(c => c.worker_id === "wrk-civ-444");
      setAssignedJobs(jobs);
    });

    return () => unsubscribe();
  }, [router]);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idFile) {
      alert("Please upload/confirm your ID documentation.");
      return;
    }

    const newApp: JobApplication = {
      id: `app-${Math.random().toString(36).substr(2, 9)}`,
      skill,
      availability: availability === "weekends" ? "Weekends Only" : "Daily (Full time)",
      status: "pending",
      appliedAt: new Date().toISOString()
    };

    const updated = [newApp, ...applications];
    setApplications(updated);
    if (session) {
      localStorage.setItem(`roadguard_apps_${session.userId}`, JSON.stringify(updated));
    }

    setIdFile(false);
    alert("Application submitted! PWD district engineers will review your profile credentials.");
  };

  // INNOVATION: jsPDF Skill Passport Generator
  const generatePDFPassport = () => {
    if (!user) return;

    const doc = new jsPDF();
    
    // Draw background borders & design elements
    doc.setDrawColor(26, 58, 92); // Secondary color
    doc.setLineWidth(1.5);
    doc.rect(10, 10, 190, 277);

    doc.setDrawColor(255, 107, 44); // Primary color
    doc.setLineWidth(0.5);
    doc.rect(12, 12, 186, 273);

    // Header insignia
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(26, 58, 92);
    doc.text("GOVERNMENT OF TAMIL NADU", 105, 25, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("PUBLIC WORKS & HIGHWAYS DEPARTMENT (PWD)", 105, 30, { align: "center" });

    // Certificate Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 107, 44);
    doc.text("CIVIC SKILL PASSPORT", 105, 45, { align: "center" });

    // Divider line
    doc.setDrawColor(255, 107, 44);
    doc.line(40, 52, 170, 52);

    // Certificate explanation
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text("This credential verifies active civic engagement, technical repair contributions,", 105, 60, { align: "center" });
    doc.text("and volunteer service towards road safety maintenance in Tamil Nadu.", 105, 65, { align: "center" });

    // User Details section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(26, 58, 92);
    doc.text("HOLDER IDENTIFICATION", 25, 85);
    
    doc.setDrawColor(26, 58, 92);
    doc.line(25, 88, 185, 88);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(`Full Name:  ${user.full_name}`, 25, 98);
    doc.text(`District:      ${user.district} State Unit`, 25, 104);
    doc.text(`Member Level: ${user.level}`, 25, 110);
    doc.text(`Total Score:   ${user.points_total} Points Earned`, 25, 116);

    // Completed Projects ledger
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(26, 58, 92);
    doc.text("VERIFIED CIVIC REPAIR dispatches", 25, 135);
    doc.line(25, 138, 185, 138);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    let yPos = 148;

    if (assignedJobs.length === 0) {
      doc.text("No PWD-dispatched tasks logged on this passport yet.", 25, yPos);
    } else {
      assignedJobs.forEach((job, index) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}. ${job.title}`, 25, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(`Location: ${job.address.split("•")[0]} | Status: Resolved`, 30, yPos + 5);
        yPos += 14;
      });
    }

    // Performance assessment rating
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(26, 58, 92);
    doc.text("PWD PERFORMANCE RATING", 25, 205);
    doc.line(25, 208, 185, 208);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Supervisor rating:  4.8 / 5.0 Stars (Excellent)", 25, 218);
    doc.text("Certified Skills:       Pothole Repair, Debris clearance", 25, 224);

    // IAS Signature Stamp block
    doc.setDrawColor(200, 200, 200);
    doc.rect(25, 240, 50, 25);
    doc.setFontSize(8);
    doc.text("OFFICIAL STAMP", 50, 253, { align: "center" });

    // Signature line
    doc.line(130, 255, 175, 255);
    doc.text("Dr. K. Srinivasan, IAS", 152, 260, { align: "center" });
    doc.setFontSize(7);
    doc.text("State Highways Commissioner, Chennai", 152, 264, { align: "center" });

    doc.save(`RoadGuard_Skill_Passport_${user.full_name.replace(" ", "_")}.pdf`);
  };

  if (loading || !user) return null;

  // Mock approved jobs
  const completedJobsCount = assignedJobs.filter(j => j.status === "resolved").length;

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-slate-800 dark:text-slate-100 flex flex-col transition-colors pb-16">
      <Navbar portal="civilian" userName={user.full_name} userPoints={user.points_total} />

      <main className="flex-grow max-w-md md:max-w-4xl w-full mx-auto px-4 mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Application Form */}
        <div className="p-6 rounded-2xl glass border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-between">
          <form onSubmit={handleApply} className="space-y-5">
            <div>
              <h2 className="text-base md:text-lg font-display font-black tracking-tight dark:text-white text-secondary">
                Apply for Road Repair Tasks
              </h2>
              <p className="text-[11px] text-slate-400">Join the civilian worker micro-economy. Get paid in INR for completing repair tasks.</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 block">Select Primary Skill</label>
                <select
                  value={skill}
                  onChange={(e) => setSkill(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-xs focus:outline-none"
                >
                  <option value="Pothole Repair">Pothole Filling (குழி மூடுதல்)</option>
                  <option value="Debris Removal">Debris Removal (குப்பைகளை அகற்றுதல்)</option>
                  <option value="Drain Cleansing">Drainage Clearance (நீர் வடிகால் சீரமைப்பு)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 block">Weekly Availability</label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-xs focus:outline-none"
                >
                  <option value="weekends">Flexible (Weekends Only)</option>
                  <option value="fulltime">Daily (Full-Time Contractor)</option>
                </select>
              </div>

              {/* ID verification */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-slate-400 block">Identity Verification</label>
                <button
                  type="button"
                  onClick={() => setIdFile(true)}
                  className={`w-full py-3 rounded-xl border-2 border-dashed text-center text-xs transition duration-200 ${
                    idFile
                      ? "bg-success/5 border-success text-success font-semibold"
                      : "border-slate-250 dark:border-slate-800 hover:border-primary text-slate-400 bg-slate-50/20"
                  }`}
                >
                  {idFile ? (
                    <span className="flex items-center justify-center space-x-1">
                      <Check className="w-4 h-4" />
                      <span>Govt ID Uploaded (Mock verified)</span>
                    </span>
                  ) : "Select & Upload Government Identity Document"}
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold transition flex items-center justify-center space-x-1"
              >
                <PlusCircle className="w-4.5 h-4.5" />
                <span>Submit Job Application</span>
              </button>
            </div>
          </form>
        </div>

        {/* Skill Passport & Active Tasks */}
        <div className="space-y-6">
          
          {/* Skill Passport PDF Innovation card */}
          <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/10 space-y-4 shadow-lg glow-xp relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
            <div className="pl-2 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold block">CIVIC PASS CREDENTIAL</span>
              <h3 className="font-display font-black text-sm md:text-base dark:text-white text-secondary leading-none">
                Skill Passport Credential
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-355 max-w-xs mt-1">
                Complete PWD-approved volunteer repair jobs, gather positive ratings, and export a certified government contribution PDF.
              </p>
            </div>

            <button
              onClick={generatePDFPassport}
              className="w-full py-2 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md transition flex items-center justify-center space-x-1.5 font-display"
            >
              <Download className="w-4 h-4" />
              <span>Download Skill Passport (PDF)</span>
            </button>
          </div>

          {/* Applications list */}
          <div className="p-5 rounded-2xl glass border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <div>
              <h3 className="font-display font-bold text-sm md:text-base mb-1">விண்ணப்ப நிலை (Application Log)</h3>
              <p className="text-xs text-slate-400">Status logs of your volunteer contractor applications</p>
            </div>

            <div className="space-y-3.5">
              {applications.map((app) => {
                const statusColors: any = {
                  pending: "text-warning bg-warning/10",
                  approved: "text-success bg-success/10",
                  rejected: "text-danger bg-danger/10"
                };

                return (
                  <div key={app.id} className="flex justify-between items-center text-xs">
                    <div>
                      <strong className="font-bold block dark:text-slate-200 text-slate-700">{app.skill}</strong>
                      <span className="text-[9px] text-slate-400 font-mono">Shift: {app.availability} • Applied {new Date(app.appliedAt).toLocaleDateString()}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded font-bold text-[9px] uppercase ${statusColors[app.status]}`}>
                      {app.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assigned Jobs list with ratings */}
          <div className="p-5 rounded-2xl glass border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <div>
              <h3 className="font-display font-bold text-sm md:text-base mb-1">ஒதுக்கப்பட்ட பணிகள் (Active Contracts)</h3>
              <p className="text-xs text-slate-400">Assigned PWD dispatch tasks and contractor ratings</p>
            </div>

            <div className="space-y-3">
              {assignedJobs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No active dispatches. Work applications must be approved first.</p>
              ) : (
                assignedJobs.map((job) => (
                  <div key={job.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-850 text-xs space-y-2">
                    <div className="flex justify-between items-start">
                      <strong className="font-bold truncate max-w-[150px]">{job.title}</strong>
                      <span className="px-2 py-0.5 rounded bg-success/10 text-success font-bold text-[9px] uppercase">
                        {job.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-snug">{job.address}</p>
                    
                    {/* rating display */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-850 flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 flex items-center">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 mr-0.5" />
                        Supervisor Rating:
                      </span>
                      <strong className="font-bold">4.8 / 5.0 Stars</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
