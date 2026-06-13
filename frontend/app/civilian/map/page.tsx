"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  MapPin, AlertCircle, Info, RefreshCw, Compass, Plus, Navigation
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import { db } from "@/lib/db";
import { Complaint } from "@/lib/seedData";
import DynamicMap from "@/components/shared/DynamicMap";

// Distance helper
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function CivilianMap() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Map view variables
  const [mapCenter, setMapCenter] = useState<[number, number]>([11.0168, 76.9558]);
  const [mapZoom, setMapZoom] = useState(14);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    const sess = localStorage.getItem("roadguard_session");
    if (!sess) {
      router.push("/login");
      return;
    }
    setSession(JSON.parse(sess));

    const loadData = async () => {
      const comps = await db.getComplaints();
      setComplaints(comps);
      setLoading(false);
    };

    loadData();
    locateUser();

    // Subscribe to updates
    const unsubscribe = db.subscribe((state) => {
      setComplaints(state.complaints);
    });

    return () => unsubscribe();
  }, [router]);

  const locateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setMapCenter(coords);
          setUserLocation(coords);
        },
        () => {
          // Coimbatore fallback default
          setMapCenter([11.0168, 76.9558]);
        }
      );
    }
  };

  // Pre-fill coordinates and redirect
  const handleReportHere = () => {
    const [lat, lng] = mapCenter;
    router.push(`/civilian/report?lat=${lat}&lng=${lng}`);
  };

  // Convert complaints data format, filtering for nearby within 5km of center
  const nearbyComplaints = complaints.filter(c => {
    const dist = getDistanceKm(mapCenter[0], mapCenter[1], c.lat, c.lng);
    return dist <= 5; // 5 km radius
  });

  const mapPins = nearbyComplaints.map(c => ({
    id: c.id,
    lat: c.lat,
    lng: c.lng,
    title: c.title,
    type: c.type,
    severity: c.severity,
    status: c.status,
    address: c.address,
    date: new Date(c.created_at).toLocaleDateString("en-IN")
  }));

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Navbar portal="civilian" userName={session?.name} />

      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <DynamicMap
          center={mapCenter}
          zoom={mapZoom}
          pins={mapPins}
        />

        {/* Color Legend panel */}
        <div className="absolute top-4 left-4 z-[1000] p-3.5 glass rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-[200px] text-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-2">
            Status Legend
          </span>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-[#DC2626]" />
              <span className="text-slate-650 dark:text-slate-350">Urgent (Pending)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-[#D97706]" />
              <span className="text-slate-650 dark:text-slate-350">In Progress</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-[#16A34A]" />
              <span className="text-slate-650 dark:text-slate-350">Resolved</span>
            </div>
          </div>
        </div>

        {/* Center Locate Trigger Button */}
        <button
          onClick={locateUser}
          className="absolute top-4 right-4 z-[1000] p-2.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-300 shadow-xl transition"
          title="Recenter my GPS location"
        >
          <Compass className="w-5 h-5 animate-spin-slow" />
        </button>

        {/* Floating Report Button */}
        <div className="absolute bottom-6 right-6 z-[1000] flex flex-col items-end space-y-2.5">
          <div className="p-3 glass border border-slate-200 dark:border-slate-800 rounded-xl text-[10.5px] max-w-[180px] shadow-lg leading-relaxed text-slate-500 text-right">
            Drag/Pan the map center to align pin and select Report.
          </div>
          <button
            onClick={handleReportHere}
            className="py-3 px-5 rounded-2xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xl shadow-primary/20 transition-all flex items-center space-x-1.5 font-display"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Report Defect Here</span>
          </button>
        </div>

      </div>

    </div>
  );
}
