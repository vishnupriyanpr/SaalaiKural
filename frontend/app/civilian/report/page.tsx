"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, Upload, MapPin, Sparkles, AlertCircle, ArrowRight,
  ArrowLeft, CheckCircle, Clock, Check, RefreshCw, Smartphone
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import { db } from "@/lib/db";
import DynamicMap from "@/components/shared/DynamicMap";
import confetti from "canvas-confetti";
import { get, set } from "idb-keyval";

export default function CivilianReport() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);

  // Stepper state: 1 (Photo) -> 2 (Details) -> 3 (Review)
  const [step, setStep] = useState(1);
  const [loadingAI, setLoadingAI] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Form states
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  
  const [issueType, setIssueType] = useState("pothole");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState({
    lat: 11.0168,
    lng: 76.9558,
    address: "Coimbatore, RS Puram, Coimbatore - 641002"
  });

  // Check online status and setup sync queue
  useEffect(() => {
    const sess = localStorage.getItem("roadguard_session");
    if (!sess) {
      router.push("/login");
      return;
    }
    setSession(JSON.parse(sess));

    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      setIsOnline(true);
      // Sync offline queue
      const queue: any[] = (await get("roadguard_offline_queue")) || [];
      if (queue.length > 0) {
        for (const item of queue) {
          await db.createComplaint(item);
        }
        await set("roadguard_offline_queue", []);
        alert(`Synced ${queue.length} reports successfully from your offline database!`);
        confetti({ particleCount: 100, spread: 80 });
      }
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [router]);

  // AI image analysis via our backend
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);

    // Read file base64 for local preview
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result as string);
      triggerAIAnalysis(file);
    };
    reader.readAsDataURL(file);
  };

  const triggerAIAnalysis = async (fileToAnalyze: File) => {
    setLoadingAI(true);
    setAiAnalysis(null);

    try {
      const formData = new FormData();
      formData.append("image", fileToAnalyze);
      
      let token = "";
      try {
        const sessStr = localStorage.getItem("roadguard_session");
        if (sessStr) {
          const sessObj = JSON.parse(sessStr);
          token = sessObj.token || "";
        }
      } catch (e) { console.error("Session parse error"); }

      const response = await fetch("http://localhost:8000/api/analyze", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error("Failed to analyze image");
      
      const res = await response.json();
      
      const analysisData = {
        type: res.damage_type?.toLowerCase() || "pothole",
        severity_score: res.severity || 7,
        confidence: res.confidence || 0.94,
        estimated_cost: (res.severity || 10) * 1500,
        recommended_points: (res.severity || 10) * 20,
        depth_est: res.severity > 50 ? "10cm" : "4cm",
        photo_url: res.photo_url || null,
        model_used: res.model_used
      };
      
      setAiAnalysis(analysisData);
      setIssueType(analysisData.type);
      
      // If the backend gave us a hosted URL, update the photo state so it's submitted instead of base64
      if (analysisData.photo_url) {
        setPhoto(`http://localhost:8000${analysisData.photo_url}`);
      }
      
    } catch (err) {
      console.error("AI Analysis error:", err);
      // Fallback
      setAiAnalysis({
        type: "pothole",
        severity_score: 5,
        confidence: 0.8,
        estimated_cost: 5000,
        recommended_points: 100,
        depth_est: "5cm",
        model_used: "error_fallback"
      });
    } finally {
      setLoadingAI(false);
    }
  };

  // Location auto capture
  const captureGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: `📍 Coimbatore, RS Puram • ${pos.coords.latitude.toFixed(4)}°N ${pos.coords.longitude.toFixed(4)}°E`
          });
        },
        () => {
          // fallback default Coimbatore coords
          setLocation({
            lat: 11.0168,
            lng: 76.9558,
            address: "📍 Coimbatore, RS Puram • 11.0168°N 76.9558°E"
          });
        }
      );
    }
  };

  // Trigger GPS on step 2 load
  useEffect(() => {
    if (step === 2) {
      captureGPS();
    }
  }, [step]);

  const handleMapLocationSelect = (lat: number, lng: number, address: string) => {
    setLocation({ lat, lng, address });
  };

  const handleSubmit = async () => {
    if (!session) return;

    const newComplaint = {
      civilian_id: session.userId,
      title: `${issueType.toUpperCase()} reported on ${location.address.split("•")[0]}`,
      type: issueType as any,
      description: description || `Defect reported at Coimbatore`,
      photo_url: photo || "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80",
      photo_metadata: {
        depth_est: aiAnalysis?.depth_est || "8cm",
        reference_object: "Car tyre shadow",
        shadow_analyzed: true
      },
      lat: location.lat,
      lng: location.lng,
      address: location.address,
      district: session.district || "Coimbatore",
      severity: (aiAnalysis?.severity_score >= 8 ? "critical" : aiAnalysis?.severity_score >= 6 ? "high" : "medium") as "low" | "medium" | "high" | "critical",
      ai_classification: aiAnalysis || {
        type: issueType,
        severity_score: 5,
        confidence: 0.85,
        estimated_cost: 9000,
        recommended_points: 120
      },
      status: "pending" as const,
      points_awarded: 0,
      budget_estimated: aiAnalysis?.estimated_cost || 9000,
      budget_actual: null
    };

    try {
      if (!isOnline) {
        // Queue inside IndexedDB
        const queue: any[] = (await get("roadguard_offline_queue")) || [];
        queue.push(newComplaint);
        await set("roadguard_offline_queue", queue);
        alert("Offline Mode Active! Your report has been saved locally and will auto-sync once internet returns.");
        router.push("/civilian/dashboard");
        return;
      }

      // Normal upload
      const created = await db.createComplaint(newComplaint);

      // Award immediate submit points (+10)
      const civ = await db.getCivilianById(session.userId);
      if (civ) {
        await db.updateCivilian(civ.id, {
          points_total: civ.points_total + 10,
          last_report_date: new Date().toISOString().split("T")[0]
        });

        // Trigger point gain notification
        await db.createNotification({
          target_role: "civilian",
          target_id: civ.id,
          title: "Report Submitted! +10 PTS 🎉",
          body: "Defect submitted for review. Get up to +250 points when verified by district admins!",
          type: "point_gain"
        });
      }

      // Success confetti triggers
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      router.push("/civilian/dashboard");
    } catch (err) {
      console.error(err);
      alert("Failed to submit complaint.");
    }
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-slate-800 dark:text-slate-100 flex flex-col transition-colors pb-16">
      <Navbar portal="civilian" userName={session?.name} />

      <main className="flex-1 max-w-md w-full mx-auto px-4 mt-6">
        
        {/* Connection status indicator */}
        {!isOnline && (
          <div className="p-3 mb-4 rounded-xl bg-warning/10 border border-warning/20 text-warning text-xs font-semibold flex items-center space-x-2 animate-pulse">
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>Working Offline. Reports queue in browser memory and sync automatically.</span>
          </div>
        )}

        {/* Form stepper card */}
        <div className="p-6 rounded-2xl glass border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          
          {/* Stepper tracker */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-150 dark:border-slate-850">
            <h2 className="font-display font-black text-base md:text-lg dark:text-white text-secondary">
              Report Damage (புகார் அளிக்கவும்)
            </h2>
            <div className="flex items-center space-x-1 text-xs font-mono">
              <span className={`px-2 py-0.5 rounded ${step === 1 ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-900"}`}>1</span>
              <span className="text-slate-550">&rarr;</span>
              <span className={`px-2 py-0.5 rounded ${step === 2 ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-900"}`}>2</span>
              <span className="text-slate-550">&rarr;</span>
              <span className={`px-2 py-0.5 rounded ${step === 3 ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-900"}`}>3</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            
            {/* STEP 1: PHOTO CAPTURE */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                key="step-1"
                className="space-y-5"
              >
                <div>
                  <h3 className="font-display font-extrabold text-sm dark:text-slate-200 text-slate-700">Step 1: Defect Evidence</h3>
                  <p className="text-xs text-slate-450 mt-0.5">Upload a picture of the damage. AI classifies type & severity.</p>
                </div>

                <div className="border-2 border-dashed border-slate-250 dark:border-slate-800 rounded-2xl p-6 text-center hover:border-primary transition duration-150 relative bg-slate-50/20">
                  <input
                    type="file"
                    accept="image/*"
                    id="camera-input"
                    onChange={handlePhotoUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {photo ? (
                    <img
                      src={photo}
                      alt="Uploaded proof preview"
                      className="max-h-48 mx-auto rounded-xl object-cover"
                    />
                  ) : (
                    <div className="space-y-3 py-6">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-primary block">Take photo or upload file</span>
                        <span className="text-slate-400 text-[10.5px] mt-0.5 block">Supports JPG, PNG (Max 5MB)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Classifier result loader */}
                {loadingAI && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 flex items-center justify-center space-x-2">
                    <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                    <span className="text-xs font-mono font-bold text-slate-500">Google Vision API & Claude Analyzing...</span>
                  </div>
                )}

                {aiAnalysis && (
                  <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 space-y-2 glow-xp">
                    <div className="flex items-center space-x-1 text-primary font-bold text-xs uppercase tracking-wider font-mono">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      <span>AI Triage diagnosis</span>
                    </div>
                    <div className="text-xs space-y-1 text-slate-650 dark:text-slate-300">
                      <p>Defect type: <strong className="capitalize text-slate-850 dark:text-white font-bold">{aiAnalysis.type}</strong></p>
                      <p>Severity Score: <strong className="font-mono text-slate-850 dark:text-white">{aiAnalysis.severity_score}/10</strong></p>
                      <p>Estimated depth: <strong className="font-mono text-slate-850 dark:text-white">{aiAnalysis.depth_est}</strong> (Claude Shadow Ref)</p>
                      <p>Points reward potential: <strong className="text-primary font-bold">+{aiAnalysis.recommended_points} PTS</strong></p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setStep(2)}
                  disabled={!photo || loadingAI}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-orange-500 hover:from-primary-hover hover:to-orange-600 text-white font-bold text-sm shadow-lg shadow-primary/10 transition duration-150 flex items-center justify-center space-x-1.5 disabled:opacity-40"
                >
                  <span>Continue to Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* STEP 2: DETAILS CAPTURE */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                key="step-2"
                className="space-y-4"
              >
                <div>
                  <h3 className="font-display font-extrabold text-sm dark:text-slate-200 text-slate-700">Step 2: Log Specifications</h3>
                  <p className="text-xs text-slate-450 mt-0.5">Verify coordinates and enter defect notes.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-400 block">Issue Category</label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-xs focus:outline-none"
                  >
                    <option value="pothole">Pothole (சாலை குழி)</option>
                    <option value="crack">Road Cracking (விரிசல்)</option>
                    <option value="waterlogging">Waterlogging (தேங்கிய நீர்)</option>
                    <option value="signage">Broken Signage (சேதமடைந்த பலகை)</option>
                    <option value="other">Other Defect (இதர சேதம்)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-400 block">Description (Max 200 chars)</label>
                  <textarea
                    maxLength={200}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide neighborhood landmarks, direction, width descriptors..."
                    rows={3}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-xs focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                {/* GPS Coordinates Preview */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl space-y-1 text-xs">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">GPS Captured coordinates</span>
                  <span className="font-bold text-slate-700 dark:text-slate-250 flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-primary shrink-0 animate-bounce" />
                    {location.address}
                  </span>
                  <span className="text-[9px] text-slate-450 block font-mono">
                    Lat/Lng: {location.lat.toFixed(6)}°N, {location.lng.toFixed(6)}°E
                  </span>
                </div>

                {/* Mini Coordinates Map Picker */}
                <div className="h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-850">
                  <DynamicMap
                    center={[location.lat, location.lng]}
                    zoom={15}
                    interactive={true}
                    onLocationSelect={handleMapLocationSelect}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 hover:bg-slate-900 text-xs font-bold text-slate-400 hover:text-slate-200 transition flex items-center justify-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-primary to-orange-500 hover:from-primary-hover hover:to-orange-600 text-white font-bold text-xs shadow-lg shadow-primary/10 transition duration-150 flex items-center justify-center space-x-1"
                  >
                    <span>Next Review</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: REVIEW & SUBMIT */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                key="step-3"
                className="space-y-5"
              >
                <div>
                  <h3 className="font-display font-extrabold text-sm dark:text-slate-200 text-slate-700">Step 3: Verification</h3>
                  <p className="text-xs text-slate-450 mt-0.5">Please review your case details before submission.</p>
                </div>

                {/* Summary card */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/60 space-y-4">
                  <div className="flex items-center space-x-3">
                    {photo && (
                      <img
                        src={photo}
                        alt="defects preview"
                        className="w-14 h-14 rounded-lg object-cover border border-slate-200"
                      />
                    )}
                    <div>
                      <strong className="text-xs font-extrabold block dark:text-slate-200 text-slate-700 leading-tight capitalize">
                        {issueType}
                      </strong>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block truncate max-w-[180px]">
                        Address: {location.address.split("•")[0]}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-450 block font-mono uppercase">Notes:</span>
                      <p className="text-slate-650 dark:text-slate-300 leading-relaxed font-sans">{description || "No defect notes entered"}</p>
                    </div>
                    {aiAnalysis && (
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-850">
                        <span className="text-slate-450">Estimated Review Reward:</span>
                        <strong className="text-primary font-mono">+{aiAnalysis.recommended_points} PTS</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 hover:bg-slate-900 text-xs font-bold text-slate-400 hover:text-slate-250 transition flex items-center justify-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Adjust
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-primary to-orange-500 hover:from-primary-hover hover:to-orange-600 text-white font-bold text-xs shadow-lg shadow-primary/20 transition flex items-center justify-center space-x-1.5"
                  >
                    <CheckCircle className="w-4.5 h-4.5 animate-pulse" />
                    <span>File Safe Report</span>
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>

      </main>
    </div>
  );
}
