import { createClient } from "@supabase/supabase-js";
import {
  INITIAL_CIVILIANS,
  INITIAL_ADMINS,
  INITIAL_WORKERS,
  INITIAL_REWARDS,
  INITIAL_REDEMPTIONS,
  INITIAL_COMPLAINTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PROJECTS,
  CivilianUser,
  AdminUser,
  Complaint,
  Worker,
  RewardItem,
  RewardRedemption,
  Notification,
  Project,
} from "./seedData";

// Retrieve Supabase environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const API_URL = "http://localhost:8000/api";

const getToken = () => {
  if (typeof window !== "undefined") {
    const sessionStr = localStorage.getItem("roadguard_session");
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        return session.token;
      } catch (e) {}
    }
  }
  return "";
};

export const isSupabaseConfigured =
  supabaseUrl &&
  supabaseUrl !== "YOUR_SUPABASE_URL" &&
  supabaseAnonKey &&
  supabaseAnonKey !== "YOUR_SUPABASE_ANON_KEY";

// Initialize standard Supabase client if configured
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Mock database type definitions
interface MockDBState {
  civilians: CivilianUser[];
  admins: AdminUser[];
  complaints: Complaint[];
  workers: Worker[];
  rewards: RewardItem[];
  redemptions: RewardRedemption[];
  notifications: Notification[];
  projects: Project[];
  multiplierEvents: {
    district: string;
    multiplier: number;
    startDate: string;
    endDate: string;
  }[];
}

// Check server/client context
const isBrowser = typeof window !== "undefined";

// Retrieve or initialize state
const getInitialState = (): MockDBState => {
  const defaultState: MockDBState = {
    civilians: INITIAL_CIVILIANS,
    admins: INITIAL_ADMINS,
    workers: INITIAL_WORKERS,
    rewards: INITIAL_REWARDS,
    redemptions: INITIAL_REDEMPTIONS,
    complaints: INITIAL_COMPLAINTS,
    notifications: INITIAL_NOTIFICATIONS,
    projects: INITIAL_PROJECTS,
    multiplierEvents: [
      {
        district: "Coimbatore",
        multiplier: 2,
        startDate: "2026-05-25",
        endDate: "2026-06-05",
      },
    ],
  };

  if (isBrowser) {
    const saved = localStorage.getItem("roadguard_db");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Robust fallback: if any key is missing or invalid, merge with default seed values
        return {
          civilians: parsed.civilians || defaultState.civilians,
          admins: parsed.admins || defaultState.admins,
          workers: parsed.workers || defaultState.workers,
          rewards: parsed.rewards || defaultState.rewards,
          redemptions: parsed.redemptions || defaultState.redemptions,
          complaints: parsed.complaints || defaultState.complaints,
          notifications: parsed.notifications || defaultState.notifications,
          projects: parsed.projects || defaultState.projects,
          multiplierEvents: parsed.multiplierEvents || defaultState.multiplierEvents,
        };
      } catch (e) {
        console.error("Failed to parse local storage DB", e);
      }
    }
    localStorage.setItem("roadguard_db", JSON.stringify(defaultState));
  }

  return defaultState;
};

// Server-side safe memory container
const globalForMock = globalThis as unknown as {
  _mockDBState?: MockDBState;
};

const getDBState = (): MockDBState => {
  if (isBrowser) {
    return getInitialState();
  }
  if (!globalForMock._mockDBState) {
    globalForMock._mockDBState = {
      civilians: INITIAL_CIVILIANS,
      admins: INITIAL_ADMINS,
      workers: INITIAL_WORKERS,
      rewards: INITIAL_REWARDS,
      redemptions: INITIAL_REDEMPTIONS,
      complaints: INITIAL_COMPLAINTS,
      notifications: INITIAL_NOTIFICATIONS,
      projects: INITIAL_PROJECTS,
      multiplierEvents: [
        {
          district: "Coimbatore",
          multiplier: 2,
          startDate: "2026-05-25",
          endDate: "2026-06-05",
        },
      ],
    };
  }
  return globalForMock._mockDBState;
};

const saveDBState = (state: MockDBState) => {
  if (isBrowser) {
    localStorage.setItem("roadguard_db", JSON.stringify(state));
    // Emit event for reactive UI update
    window.dispatchEvent(
      new CustomEvent("roadguard-db-update", { detail: state })
    );
  } else {
    globalForMock._mockDBState = state;
  }
};

// Database interfaces
export const db = {
  // --- CIVILIANS ---
  async getCivilians(): Promise<CivilianUser[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from("users_civilian").select("*");
      if (error) throw error;
      return data;
    }
    return getDBState().civilians;
  },

  async getCivilianById(id: string): Promise<CivilianUser | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("users_civilian")
        .select("*")
        .eq("id", id)
        .single();
      if (error) return null;
      return data;
    }
    return getDBState().civilians.find((c) => c.id === id) || null;
  },

  async createCivilian(civilian: Partial<CivilianUser> & { id: string; phone: string }): Promise<CivilianUser> {
    const newCiv: CivilianUser = {
      id: civilian.id,
      full_name: civilian.full_name || "New Civilian",
      phone: civilian.phone,
      aadhaar_hash: civilian.aadhaar_hash || "",
      district: civilian.district || "Chennai",
      city: civilian.city || "",
      pincode: civilian.pincode || "",
      points_total: civilian.points_total ?? 0,
      points_redeemed: civilian.points_redeemed ?? 0,
      level: civilian.level || "Rookie",
      streak_days: civilian.streak_days ?? 0,
      last_report_date: civilian.last_report_date || null,
      created_at: new Date().toISOString(),
      badges: civilian.badges || [],
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("users_civilian")
        .insert(newCiv)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const state = getDBState();
    state.civilians.push(newCiv);
    saveDBState(state);
    return newCiv;
  },

  async updateCivilian(id: string, updates: Partial<CivilianUser>): Promise<CivilianUser> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("users_civilian")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const state = getDBState();
    const idx = state.civilians.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Civilian not found");
    const updated = { ...state.civilians[idx], ...updates };
    state.civilians[idx] = updated;
    saveDBState(state);
    return updated;
  },

  // --- ADMINS ---
  async getAdmins(): Promise<AdminUser[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from("users_admin").select("*");
      if (error) throw error;
      return data;
    }
    return getDBState().admins;
  },

  async getAdminById(id: string): Promise<AdminUser | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("users_admin")
        .select("*")
        .eq("id", id)
        .single();
      if (error) return null;
      return data;
    }
    return getDBState().admins.find((a) => a.id === id) || null;
  },

  // --- COMPLAINTS ---
  async getComplaints(): Promise<Complaint[]> {
    try {
      const res = await fetch(`${API_URL}/complaints`, {
        headers: {
          "Authorization": `Bearer ${getToken()}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        return data.complaints;
      }
    } catch (error) {
      console.error("Failed to fetch complaints from backend", error);
    }
    // Fallback to mock
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
    return [...getDBState().complaints].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  async getComplaintById(id: string): Promise<Complaint | null> {
    try {
      const res = await fetch(`${API_URL}/complaints/${id}`, {
        headers: {
          "Authorization": `Bearer ${getToken()}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        return data.complaint;
      }
    } catch (error) {
      console.error("Failed to fetch complaint by ID from backend", error);
    }
    // Fallback to mock
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .eq("id", id)
        .single();
      if (error) return null;
      return data;
    }
    return getDBState().complaints.find((c) => c.id === id) || null;
  },

  async createComplaint(complaint: Partial<Complaint>): Promise<Complaint> {
    try {
      const res = await fetch(`${API_URL}/complaints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify(complaint)
      });
      if (res.ok) {
        const data = await res.json();
        return data.complaint || { id: data.id, ...complaint } as Complaint;
      }
    } catch (error) {
      console.error("Failed to create complaint in backend", error);
    }

    // Fallback to mock
    const newComp: Complaint = {
      id: complaint.id || `comp-${Math.random().toString(36).substr(2, 9)}`,
      civilian_id: complaint.civilian_id || "",
      title: complaint.title || "Road issue",
      type: complaint.type || "other",
      description: complaint.description || "",
      photo_url: complaint.photo_url || "",
      photo_metadata: complaint.photo_metadata || {},
      lat: complaint.lat || 11.0168,
      lng: complaint.lng || 76.9558,
      address: complaint.address || "Coimbatore, Tamil Nadu",
      district: complaint.district || "Coimbatore",
      severity: complaint.severity || "medium",
      ai_classification: complaint.ai_classification || {
        type: complaint.type || "pothole",
        severity_score: 5,
        confidence: 0.8,
        estimated_cost: 8000,
        recommended_points: 150,
      },
      status: complaint.status || "pending",
      points_awarded: complaint.points_awarded || 0,
      worker_id: complaint.worker_id || null,
      budget_estimated: complaint.budget_estimated || 8000,
      budget_actual: complaint.budget_actual || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("complaints")
        .insert(newComp)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const state = getDBState();
    state.complaints.push(newComp);
    saveDBState(state);
    return newComp;
  },

  async updateComplaint(id: string, updates: Partial<Complaint>): Promise<Complaint> {
    try {
      const res = await fetch(`${API_URL}/complaints/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        return data.complaint;
      }
    } catch (error) {
      console.error("Failed to update complaint in backend", error);
    }

    // Fallback to mock
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("complaints")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const state = getDBState();
    const idx = state.complaints.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Complaint not found");
    const updated = {
      ...state.complaints[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    state.complaints[idx] = updated;
    saveDBState(state);
    return updated;
  },

  // --- WORKERS ---
  async getWorkers(): Promise<Worker[]> {
    try {
      const res = await fetch(`${API_URL}/workers`);
      if (res.ok) {
        const data = await res.json();
        return data.workers;
      }
    } catch (error) {
      console.error("Failed to fetch workers", error);
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from("workers").select("*");
      if (error) throw error;
      return data;
    }
    return getDBState().workers;
  },

  async updateWorker(id: string, updates: Partial<Worker>): Promise<Worker> {
    try {
      const res = await fetch(`${API_URL}/workers/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        return data.worker;
      }
    } catch (error) {
      console.error("Failed to update worker", error);
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("workers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const state = getDBState();
    const idx = state.workers.findIndex((w) => w.id === id);
    if (idx === -1) throw new Error("Worker not found");
    const updated = { ...state.workers[idx], ...updates };
    state.workers[idx] = updated;
    saveDBState(state);
    return updated;
  },

  async createWorker(worker: Partial<Worker>): Promise<Worker> {
    try {
      const res = await fetch(`${API_URL}/workers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify(worker)
      });
      if (res.ok) {
        const data = await res.json();
        return data.worker || { id: data.id, ...worker } as Worker;
      }
    } catch (error) {
      console.error("Failed to create worker", error);
    }

    const newWrk: Worker = {
      id: worker.id || `wrk-${Math.random().toString(36).substr(2, 9)}`,
      name: worker.name || "New Worker",
      phone: worker.phone || "",
      skill_tags: worker.skill_tags || ["Pothole Repair"],
      district: worker.district || "Coimbatore",
      availability: worker.availability || "available",
      rating: worker.rating || 5.0,
      is_civilian_worker: worker.is_civilian_worker ?? false,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("workers")
        .insert(newWrk)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const state = getDBState();
    state.workers.push(newWrk);
    saveDBState(state);
    return newWrk;
  },

  // --- REWARDS & REDEMPTIONS ---
  async getRewards(): Promise<RewardItem[]> {
    try {
      const res = await fetch(`${API_URL}/rewards`);
      if (res.ok) {
        const data = await res.json();
        return data.rewards;
      }
    } catch (error) {
      console.error("Failed to fetch rewards", error);
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from("reward_items").select("*");
      if (error) throw error;
      return data;
    }
    return getDBState().rewards;
  },

  async updateReward(id: string, updates: Partial<RewardItem>): Promise<RewardItem> {
    try {
      const res = await fetch(`${API_URL}/rewards/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        return data.reward;
      }
    } catch (error) {
      console.error("Failed to update reward", error);
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("reward_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const state = getDBState();
    const idx = state.rewards.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Reward item not found");
    const updated = { ...state.rewards[idx], ...updates };
    state.rewards[idx] = updated;
    saveDBState(state);
    return updated;
  },

  async createRewardItem(item: Partial<RewardItem>): Promise<RewardItem> {
    try {
      const res = await fetch(`${API_URL}/rewards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify(item)
      });
      if (res.ok) {
        const data = await res.json();
        return data.reward || { id: data.id, ...item } as RewardItem;
      }
    } catch (error) {
      console.error("Failed to create reward", error);
    }

    const newItem: RewardItem = {
      id: item.id || `rew-${Math.random().toString(36).substr(2, 9)}`,
      name: item.name || "New Reward Item",
      icon: item.icon || "🎁",
      points_cost: item.points_cost || 100,
      category: item.category || "eco",
      stock: item.stock ?? 10,
      active: item.active ?? true,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("reward_items")
        .insert(newItem)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const state = getDBState();
    state.rewards.push(newItem);
    saveDBState(state);
    return newItem;
  },

  async getRedemptions(): Promise<RewardRedemption[]> {
    try {
      const res = await fetch(`${API_URL}/redemptions`, {
        headers: {
          "Authorization": `Bearer ${getToken()}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        return data.redemptions;
      }
    } catch (error) {
      console.error("Failed to fetch redemptions", error);
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("reward_redemptions")
        .select("*")
        .order("redeemed_at", { ascending: false });
      if (error) throw error;
      return data;
    }
    return [...getDBState().redemptions].sort(
      (a, b) => new Date(b.redeemed_at).getTime() - new Date(a.redeemed_at).getTime()
    );
  },

  async createRedemption(redemption: Partial<RewardRedemption>): Promise<RewardRedemption> {
    try {
      const res = await fetch(`${API_URL}/redemptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify(redemption)
      });
      if (res.ok) {
        const data = await res.json();
        return data.redemption || { id: data.id, ...redemption } as RewardRedemption;
      }
    } catch (error) {
      console.error("Failed to create redemption", error);
    }

    const newRed: RewardRedemption = {
      id: redemption.id || `red-${Math.random().toString(36).substr(2, 9)}`,
      civilian_id: redemption.civilian_id || "",
      item_name: redemption.item_name || "Unknown item",
      points_cost: redemption.points_cost || 0,
      status: redemption.status || "pending",
      redeemed_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("reward_redemptions")
        .insert(newRed)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const state = getDBState();
    state.redemptions.push(newRed);
    saveDBState(state);
    return newRed;
  },

  async updateRedemption(id: string, updates: Partial<RewardRedemption>): Promise<RewardRedemption> {
    try {
      const res = await fetch(`${API_URL}/redemptions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        return data.redemption;
      }
    } catch (error) {
      console.error("Failed to update redemption", error);
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("reward_redemptions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const state = getDBState();
    const idx = state.redemptions.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Redemption not found");
    const updated = { ...state.redemptions[idx], ...updates };
    state.redemptions[idx] = updated;
    saveDBState(state);
    return updated;
  },

  // --- NOTIFICATIONS ---
  async getNotifications(): Promise<Notification[]> {
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: {
          "Authorization": `Bearer ${getToken()}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        return data.notifications;
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
    return [...getDBState().notifications].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  async createNotification(notif: Partial<Notification>): Promise<Notification> {
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify(notif)
      });
      if (res.ok) {
        const data = await res.json();
        return data.notification || { id: data.id, ...notif } as Notification;
      }
    } catch (error) {
      console.error("Failed to create notification", error);
    }

    const newNotif: Notification = {
      id: notif.id || `not-${Math.random().toString(36).substr(2, 9)}`,
      target_role: notif.target_role || "all",
      target_id: notif.target_id || null,
      title: notif.title || "New Notification",
      body: notif.body || "",
      type: notif.type || "complaint_update",
      read: notif.read ?? false,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("notifications")
        .insert(newNotif)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const state = getDBState();
    state.notifications.push(newNotif);
    saveDBState(state);
    return newNotif;
  },

  async markNotificationRead(id: string): Promise<Notification> {
    try {
      const res = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${getToken()}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        return data.notification;
      }
    } catch (error) {
      console.error("Failed to mark notification read", error);
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const state = getDBState();
    const idx = state.notifications.findIndex((n) => n.id === id);
    if (idx === -1) throw new Error("Notification not found");
    const updated = { ...state.notifications[idx], read: true };
    state.notifications[idx] = updated;
    saveDBState(state);
    return updated;
  },

  // --- PROJECTS ---
  async getProjects(): Promise<Project[]> {
    try {
      const res = await fetch(`${API_URL}/projects`);
      if (res.ok) {
        const data = await res.json();
        return data.projects;
      }
    } catch (error) {
      console.error("Failed to fetch projects", error);
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from("projects").select("*");
      if (error) throw error;
      return data;
    }
    return getDBState().projects;
  },

  async createProject(project: Partial<Project>): Promise<Project> {
    try {
      const res = await fetch(`${API_URL}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify(project)
      });
      if (res.ok) {
        const data = await res.json();
        return data.project || { id: data.id, ...project } as Project;
      }
    } catch (error) {
      console.error("Failed to create project", error);
    }

    const newProj: Project = {
      id: project.id || `proj-${Math.random().toString(36).substr(2, 9)}`,
      complaint_ids: project.complaint_ids || [],
      title: project.title || "Road Repair Initiative",
      district: project.district || "Coimbatore",
      budget_total: project.budget_total || 0,
      budget_spent: project.budget_spent || 0,
      status: project.status || "planning",
      worker_ids: project.worker_ids || [],
      start_date: project.start_date || new Date().toISOString().split("T")[0],
      end_date: project.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("projects")
        .insert(newProj)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const state = getDBState();
    state.projects.push(newProj);
    saveDBState(state);
    return newProj;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    try {
      const res = await fetch(`${API_URL}/projects/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        return data.project;
      }
    } catch (error) {
      console.error("Failed to update project", error);
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const state = getDBState();
    const idx = state.projects.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Project not found");
    const updated = { ...state.projects[idx], ...updates };
    state.projects[idx] = updated;
    saveDBState(state);
    return updated;
  },

  // --- MULTIPLIER EVENTS ---
  async getMultiplierEvents() {
    return getDBState().multiplierEvents;
  },

  async createMultiplierEvent(district: string, multiplier: number, startDate: string, endDate: string) {
    const state = getDBState();
    const newEvent = { district, multiplier, startDate, endDate };
    state.multiplierEvents.push(newEvent);
    saveDBState(state);
    return newEvent;
  },

  // --- REALTIME SUBSCRIPTION MOCK & SYSTEM ---
  subscribe(callback: (state: MockDBState) => void): () => void {
    if (!isBrowser) return () => {};

    // Standard event handler
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<MockDBState>;
      callback(customEvent.detail);
    };

    window.addEventListener("roadguard-db-update", handler);
    return () => {
      window.removeEventListener("roadguard-db-update", handler);
    };
  },
};
