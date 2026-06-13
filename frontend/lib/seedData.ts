export interface CivilianUser {
  id: string;
  full_name: string;
  phone: string;
  aadhaar_hash?: string;
  district: string;
  city?: string;
  pincode?: string;
  points_total: number;
  points_redeemed: number;
  level: string;
  streak_days: number;
  last_report_date: string | null;
  created_at: string;
  badges: string[];
}

export interface AdminUser {
  id: string;
  name: string;
  role: 'state' | 'district' | 'field';
  district: string;
  created_at: string;
}

export interface Complaint {
  id: string;
  civilian_id: string;
  title: string;
  type: 'pothole' | 'crack' | 'waterlogging' | 'signage' | 'other';
  description: string;
  photo_url: string;
  photo_metadata?: {
    depth_est?: string;
    shadow_analyzed?: boolean;
    reference_object?: string;
  };
  lat: number;
  lng: number;
  address: string;
  district: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ai_classification: {
    type: string;
    severity_score: number; // 1-10
    confidence: number; // 0-1
    estimated_cost: number;
    recommended_points: number;
    depth_est?: string;
  };
  status: 'pending' | 'verified' | 'assigned' | 'in_progress' | 'resolved' | 'rejected';
  points_awarded: number;
  worker_id: string | null;
  budget_estimated: number;
  budget_actual: number | null;
  created_at: string;
  updated_at: string;
}

export interface Worker {
  id: string;
  name: string;
  phone: string;
  skill_tags: string[];
  district: string;
  availability: 'available' | 'busy' | 'offline';
  rating: number;
  is_civilian_worker: boolean;
  created_at: string;
}

export interface RewardItem {
  id: string;
  name: string;
  icon: string;
  points_cost: number;
  category: 'plant' | 'food' | 'eco';
  stock: number;
  active: boolean;
}

export interface RewardRedemption {
  id: string;
  civilian_id: string;
  item_name: string;
  points_cost: number;
  status: 'pending' | 'approved' | 'rejected';
  redeemed_at: string;
}

export interface Notification {
  id: string;
  target_role: 'admin' | 'civilian' | 'all';
  target_id: string | null; // civilian_id or admin_id
  title: string;
  body: string;
  type: 'complaint_update' | 'point_gain' | 'cluster_alert' | 'work_assign' | 'reward_approval';
  read: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  complaint_ids: string[];
  title: string;
  district: string;
  budget_total: number;
  budget_spent: number;
  status: 'planning' | 'approved' | 'active' | 'completed';
  worker_ids: string[];
  start_date: string;
  end_date: string;
}

export const INITIAL_CIVILIANS: CivilianUser[] = [
  {
    id: "civ-111",
    full_name: "Selvam Kumar",
    phone: "9876543210",
    aadhaar_hash: "827364812a3d",
    district: "Coimbatore",
    points_total: 2450,
    points_redeemed: 500,
    level: "Watchdog",
    streak_days: 5,
    last_report_date: "2026-05-29",
    created_at: "2026-04-01T10:00:00Z",
    badges: ["First Report", "Map Pioneer", "7-Day Streak"]
  },
  {
    id: "civ-222",
    full_name: "Anjali Devi",
    phone: "9845612300",
    aadhaar_hash: "284719485c2b",
    district: "Chennai",
    points_total: 620,
    points_redeemed: 0,
    level: "Reporter",
    streak_days: 2,
    last_report_date: "2026-05-30",
    created_at: "2026-05-10T12:00:00Z",
    badges: ["First Report"]
  },
  {
    id: "civ-333",
    full_name: "Karthik Raja",
    phone: "9003312345",
    aadhaar_hash: "1234567890ab",
    district: "Coimbatore",
    points_total: 6850,
    points_redeemed: 3200,
    level: "Road Legend",
    streak_days: 14,
    last_report_date: "2026-05-30",
    created_at: "2026-01-15T08:00:00Z",
    badges: ["First Report", "Map Pioneer", "7-Day Streak", "Top Reporter", "Eco Hero", "Speed Spotter"]
  }
];

export const INITIAL_ADMINS: AdminUser[] = [
  {
    id: "adm-111",
    name: "Dr. K. Srinivasan, IAS",
    role: "state",
    district: "Chennai",
    created_at: "2025-01-01T09:00:00Z"
  },
  {
    id: "adm-222",
    name: "Thiru. M. Prathap, IAS",
    role: "district",
    district: "Coimbatore",
    created_at: "2025-02-15T09:00:00Z"
  },
  {
    id: "adm-333",
    name: "Selvi P. Ramya",
    role: "field",
    district: "Coimbatore",
    created_at: "2025-06-01T09:00:00Z"
  }
];

export const INITIAL_WORKERS: Worker[] = [
  {
    id: "wrk-111",
    name: "Arun Construction PWD",
    phone: "9443210987",
    skill_tags: ["Pothole Repair", "Crack Sealing", "Road Laying"],
    district: "Coimbatore",
    availability: "available",
    rating: 4.8,
    is_civilian_worker: false,
    created_at: "2025-03-01T08:00:00Z"
  },
  {
    id: "wrk-222",
    name: "Senthil Drainage Systems",
    phone: "9442109876",
    skill_tags: ["Water Drainage", "Waterlogging", "Culvert Cleansing"],
    district: "Coimbatore",
    availability: "available",
    rating: 4.5,
    is_civilian_worker: false,
    created_at: "2025-04-10T08:00:00Z"
  },
  {
    id: "wrk-333",
    name: "Vetri Signages Ltd",
    phone: "9887766554",
    skill_tags: ["Signage", "Reflector Fixing", "Painting"],
    district: "Coimbatore",
    availability: "available",
    rating: 4.9,
    is_civilian_worker: false,
    created_at: "2025-05-01T08:00:00Z"
  },
  {
    id: "wrk-civ-444",
    name: "Mani (Civilian Repair Volunteer)",
    phone: "9123456789",
    skill_tags: ["Pothole Repair", "Debris Removal"],
    district: "Coimbatore",
    availability: "available",
    rating: 4.7,
    is_civilian_worker: true,
    created_at: "2026-05-20T10:00:00Z"
  }
];

export const INITIAL_REWARDS: RewardItem[] = [
  {
    id: "rew-1",
    name: "Neem Sapling (வேப்ப மரக்கன்று)",
    icon: "🌳",
    points_cost: 150,
    category: "plant",
    stock: 85,
    active: true
  },
  {
    id: "rew-2",
    name: "Pungai Seed Pack (புங்கை விதைப்பந்து)",
    icon: "🌱",
    points_cost: 50,
    category: "plant",
    stock: 200,
    active: true
  },
  {
    id: "rew-3",
    name: "Organic Ponni Rice Bag 5kg (பொன்னி அரிசி)",
    icon: "🌾",
    points_cost: 500,
    category: "food",
    stock: 42,
    active: true
  },
  {
    id: "rew-4",
    name: "Traditional Millet Mix 1kg (சிறுதானிய மாவு)",
    icon: "🥣",
    points_cost: 200,
    category: "food",
    stock: 60,
    active: true
  },
  {
    id: "rew-5",
    name: "Eco-Friendly Jute Bag (மக்கும் சணல் பை)",
    icon: "🛍️",
    points_cost: 100,
    category: "eco",
    stock: 120,
    active: true
  },
  {
    id: "rew-6",
    name: "Compost Bin Kit (உரமாக்கும் தொட்டி)",
    icon: "♻️",
    points_cost: 600,
    category: "eco",
    stock: 15,
    active: true
  }
];

export const INITIAL_REDEMPTIONS: RewardRedemption[] = [
  {
    id: "red-1",
    civilian_id: "civ-111",
    item_name: "Neem Sapling (வேப்ப மரக்கன்று)",
    points_cost: 150,
    status: "approved",
    redeemed_at: "2026-05-15T14:20:00Z"
  },
  {
    id: "red-2",
    civilian_id: "civ-111",
    item_name: "Eco-Friendly Jute Bag (மக்கும் சணல் பை)",
    points_cost: 100,
    status: "approved",
    redeemed_at: "2026-05-20T10:15:00Z"
  },
  {
    id: "red-3",
    civilian_id: "civ-333",
    item_name: "Organic Ponni Rice Bag 5kg (பொன்னி அரிசி)",
    points_cost: 500,
    status: "approved",
    redeemed_at: "2026-05-28T09:00:00Z"
  }
];

export const INITIAL_COMPLAINTS: Complaint[] = [
  // Coimbatore RS Puram Cluster (5 complaints within 500m)
  {
    id: "comp-coi-1",
    civilian_id: "civ-111",
    title: "Massive pothole in RS Puram East Street",
    type: "pothole",
    description: "Deep pothole right in the middle of the road near Kovai Pazhamudir Nilayam. Extremely dangerous for two-wheelers at night.",
    photo_url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80",
    photo_metadata: {
      depth_est: "12cm",
      shadow_analyzed: true,
      reference_object: "Soda bottle"
    },
    lat: 11.0168,
    lng: 76.9558,
    address: "East St, Near Pazhamudir, RS Puram, Coimbatore - 641002",
    district: "Coimbatore",
    severity: "high",
    ai_classification: {
      type: "pothole",
      severity_score: 8,
      confidence: 0.94,
      estimated_cost: 12500,
      recommended_points: 200,
      depth_est: "12cm"
    },
    status: "pending",
    points_awarded: 200,
    worker_id: null,
    budget_estimated: 12500,
    budget_actual: null,
    created_at: "2026-05-30T10:12:00Z",
    updated_at: "2026-05-30T10:12:00Z"
  },
  {
    id: "comp-coi-2",
    civilian_id: "civ-111",
    title: "Secondary pothole next to RS Puram central signal",
    type: "pothole",
    description: "Another pothole starting to expand right near the signal box. Approx 120 meters from the other one.",
    photo_url: "https://images.unsplash.com/photo-1621259182978-f09e5e2b07ae?auto=format&fit=crop&w=600&q=80",
    photo_metadata: {
      depth_est: "5cm",
      shadow_analyzed: true,
      reference_object: "Car tyre"
    },
    lat: 11.0180,
    lng: 76.9570,
    address: "DB Road Crossing, RS Puram, Coimbatore - 641002",
    district: "Coimbatore",
    severity: "medium",
    ai_classification: {
      type: "pothole",
      severity_score: 5,
      confidence: 0.88,
      estimated_cost: 6000,
      recommended_points: 150,
      depth_est: "5cm"
    },
    status: "pending",
    points_awarded: 150,
    worker_id: null,
    budget_estimated: 6000,
    budget_actual: null,
    created_at: "2026-05-30T10:20:00Z",
    updated_at: "2026-05-30T10:20:00Z"
  },
  {
    id: "comp-coi-3",
    civilian_id: "civ-333",
    title: "Water clogging on West Club Road",
    type: "waterlogging",
    description: "Rainwater is pooling completely and flooding the footpath because of a blocked drain outlet. About 200m from DB road.",
    photo_url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80",
    photo_metadata: {
      depth_est: "15cm",
      shadow_analyzed: false
    },
    lat: 11.0160,
    lng: 76.9545,
    address: "West Club Road, Behind RS Puram Club, Coimbatore - 641002",
    district: "Coimbatore",
    severity: "critical",
    ai_classification: {
      type: "waterlogging",
      severity_score: 9,
      confidence: 0.91,
      estimated_cost: 25000,
      recommended_points: 250,
      depth_est: "15cm"
    },
    status: "pending",
    points_awarded: 250,
    worker_id: null,
    budget_estimated: 25000,
    budget_actual: null,
    created_at: "2026-05-30T10:32:00Z",
    updated_at: "2026-05-30T10:32:00Z"
  },
  {
    id: "comp-coi-4",
    civilian_id: "civ-111",
    title: "Edge cracking and pothole on DB Road",
    type: "pothole",
    description: "Dangerous pothole on the asphalt edge. Very risky for parking cars and bikes.",
    photo_url: "https://images.unsplash.com/photo-1599740831464-6729a3a3bc41?auto=format&fit=crop&w=600&q=80",
    photo_metadata: {
      depth_est: "8cm",
      shadow_analyzed: true,
      reference_object: "Brick"
    },
    lat: 11.0190,
    lng: 76.9560,
    address: "Opposite Post Office, DB Road, RS Puram, Coimbatore - 641002",
    district: "Coimbatore",
    severity: "high",
    ai_classification: {
      type: "pothole",
      severity_score: 7,
      confidence: 0.95,
      estimated_cost: 11000,
      recommended_points: 180,
      depth_est: "8cm"
    },
    status: "pending",
    points_awarded: 180,
    worker_id: null,
    budget_estimated: 11000,
    budget_actual: null,
    created_at: "2026-05-30T10:45:00Z",
    updated_at: "2026-05-30T10:45:00Z"
  },
  {
    id: "comp-coi-5",
    civilian_id: "civ-333",
    title: "Severe road cracking near RS Puram library",
    type: "crack",
    description: "Deep structural cracks across the entire road width. The sub-base seems to be sinking.",
    photo_url: "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=600&q=80",
    photo_metadata: {
      depth_est: "3cm",
      shadow_analyzed: false
    },
    lat: 11.0175,
    lng: 76.9550,
    address: "Library Road, Near Corporation Library, RS Puram, Coimbatore - 641002",
    district: "Coimbatore",
    severity: "medium",
    ai_classification: {
      type: "crack",
      severity_score: 6,
      confidence: 0.89,
      estimated_cost: 9500,
      recommended_points: 160,
      depth_est: "3cm"
    },
    status: "pending",
    points_awarded: 160,
    worker_id: null,
    budget_estimated: 9500,
    budget_actual: null,
    created_at: "2026-05-30T10:50:00Z",
    updated_at: "2026-05-30T10:50:00Z"
  },
  // Other Scattered Complaints
  {
    id: "comp-coi-active-1",
    civilian_id: "civ-111",
    title: "Large crack on Avinashi Road flyover entrance",
    type: "crack",
    description: "Long alligator cracking near the flyover loop. Needs immediate overlay sealing before monsoons.",
    photo_url: "https://images.unsplash.com/photo-11515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80",
    lat: 11.0232,
    lng: 76.9725,
    address: "Avinashi Road flyover entrance, Coimbatore - 641018",
    district: "Coimbatore",
    severity: "medium",
    ai_classification: {
      type: "crack",
      severity_score: 5,
      confidence: 0.90,
      estimated_cost: 18000,
      recommended_points: 120
    },
    status: "in_progress",
    points_awarded: 120,
    worker_id: "wrk-111",
    budget_estimated: 18000,
    budget_actual: null,
    created_at: "2026-05-28T09:15:00Z",
    updated_at: "2026-05-29T14:30:00Z"
  },
  {
    id: "comp-coi-resolved-1",
    civilian_id: "civ-333",
    title: "Waterlogging at Gandhipuram Bus Stand entrance",
    type: "waterlogging",
    description: "Massive stagnation of water blocking passengers. Drains are completely choked with plastic waste.",
    photo_url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80",
    lat: 11.0185,
    lng: 76.9690,
    address: "Gandhipuram Central Bus Stand, Coimbatore - 641012",
    district: "Coimbatore",
    severity: "critical",
    ai_classification: {
      type: "waterlogging",
      severity_score: 9,
      confidence: 0.97,
      estimated_cost: 32000,
      recommended_points: 250
    },
    status: "resolved",
    points_awarded: 250,
    worker_id: "wrk-222",
    budget_estimated: 32000,
    budget_actual: 28500,
    created_at: "2026-05-20T08:00:00Z",
    updated_at: "2026-05-25T17:00:00Z"
  },
  {
    id: "comp-che-1",
    civilian_id: "civ-222",
    title: "Missing stop sign near T-Nagar Metro",
    type: "signage",
    description: "The warning stop sign has been bent down and is completely invisible to oncoming traffic.",
    photo_url: "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&w=600&q=80",
    lat: 13.0418,
    lng: 80.2337,
    address: "Venkatnarayana Rd, Near Metro, T-Nagar, Chennai - 600017",
    district: "Chennai",
    severity: "low",
    ai_classification: {
      type: "signage",
      severity_score: 3,
      confidence: 0.85,
      estimated_cost: 3500,
      recommended_points: 100
    },
    status: "verified",
    points_awarded: 100,
    worker_id: null,
    budget_estimated: 3500,
    budget_actual: null,
    created_at: "2026-05-29T11:00:00Z",
    updated_at: "2026-05-30T09:00:00Z"
  }
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "not-1",
    target_role: "civilian",
    target_id: "civ-111",
    title: "Report Verified! 🏆",
    body: "Your report of 'Avinashi Road flyover entrance crack' has been verified by the Coimbatore Admin. +120 points added!",
    type: "point_gain",
    read: true,
    created_at: "2026-05-29T14:30:00Z"
  },
  {
    id: "not-2",
    target_role: "civilian",
    target_id: "civ-333",
    title: "Road Repaired! 🎉",
    body: "Your report 'Waterlogging at Gandhipuram Bus Stand' has been resolved. You have been awarded +50 bonus points for quick response!",
    type: "complaint_update",
    read: false,
    created_at: "2026-05-25T17:05:00Z"
  },
  {
    id: "not-3",
    target_role: "admin",
    target_id: null,
    title: "AI Cluster Alert 🚨",
    body: "5 active complaints detected within 500m of RS Puram East St, Coimbatore. Combined budget saving of 25% (₹16,000) projected.",
    type: "cluster_alert",
    read: false,
    created_at: "2026-05-30T10:51:00Z"
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: "proj-1",
    complaint_ids: ["comp-coi-resolved-1"],
    title: "Gandhipuram Drainage Clearance",
    district: "Coimbatore",
    budget_total: 32000,
    budget_spent: 28500,
    status: "completed",
    worker_ids: ["wrk-222"],
    start_date: "2026-05-21",
    end_date: "2026-05-25"
  }
];
