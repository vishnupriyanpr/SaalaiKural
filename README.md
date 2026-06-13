# 🚦 RoadWatch — AI-Powered Road Transparency Platform

> **IIT-M Hackathon Project** | Empowering citizens to report road damage and holding authorities accountable through AI-driven insights.

---

## 📋 Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Backend — Express API Server (Node.js)](#2-backend--express-api-server-nodejs)
  - [3. Backend — ML Server (Python + YOLOv8)](#3-backend--ml-server-python--yolov8)
  - [4. Frontend — Next.js App](#4-frontend--nextjs-app)
  - [5. Environment Variables](#5-environment-variables)
  - [6. Start All Services](#6-start-all-services)
- [Default Credentials](#default-credentials)
- [API Reference](#api-reference)
- [Features](#features)
- [Troubleshooting](#troubleshooting)

---

## Overview

**RoadWatch** is a full-stack AI-powered platform for transparent public road monitoring. Citizens can report road damage (potholes, cracks) with photos, earn reward points, and track complaint resolution in real time. Admins/authorities can manage complaints, assign workers, allocate budgets, and view analytics.

Key capabilities:
- 📸 **AI Damage Detection** — YOLOv8-based pothole & crack detection with severity scoring
- 🗺️ **Map Integration** — Leaflet-powered interactive maps for complaint locations
- 🏆 **Gamified Rewards** — Citizens earn points per complaint; redeem for rewards
- 📊 **Admin Dashboard** — Analytics, worker management, budget tracking
- 🤖 **Chatbot** — n8n-powered AI chatbot for citizen queries

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                   │
│                    http://localhost:3000                     │
│   Next.js 14 · React · Leaflet · Recharts · Framer Motion   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP (REST API)
         ┌─────────────────▼──────────────────┐
         │    EXPRESS API SERVER (Node.js)     │
         │         http://localhost:8000       │
         │   Auth · Complaints · Rewards       │
         │   Workers · Projects · Chatbot      │
         │         SQLite (roadwatch.db)       │
         └──────────┬──────────────┬───────────┘
                    │              │ /api/analyze (image proxy)
          Firebase  │              │
          (Auth/    │    ┌─────────▼──────────┐
          optional) │    │   ML SERVER (Py)   │
                    │    │  http://localhost:5001│
                    │    │  YOLOv8 / best.pt  │
                    │    │  Severity · Priority│
                    │    └────────────────────┘
                    │
         ┌──────────▼──────────────┐
         │  FastAPI (Python) — opt  │
         │  http://localhost:8001   │
         │  SQLAlchemy · Firebase   │
         └─────────────────────────┘
```

> **Note**: The primary backend is the **Express (Node.js) server on port 8000**. The FastAPI Python server (`app.py`) is an alternative/auxiliary backend. The ML server on port 5001 is required for AI analysis.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, React 18, TypeScript, TailwindCSS |
| **Mapping** | Leaflet, React-Leaflet |
| **Charts** | Recharts |
| **Animations** | Framer Motion |
| **3D** | Three.js, @react-three/fiber |
| **Express API** | Node.js, Express 5, SQLite3, JWT, bcryptjs, Multer |
| **ML Server** | Python 3.10+, Ultralytics YOLOv8, stdlib HTTP server |
| **FastAPI (alt)** | Python, FastAPI, SQLAlchemy, Firebase Admin SDK |
| **Auth** | Firebase Auth (frontend) + JWT (backend) |
| **Database** | SQLite (auto-created) |
| **Chatbot** | n8n webhook integration |

---

## Project Structure

```
RoadWatch - IIT-M/
├── .gitignore
├── README.md
├── start_roadwatch.bat        # One-click startup (Windows)
│
├── frontend/                  # Next.js Application
│   ├── app/                   # App Router pages
│   ├── components/            # Reusable React components
│   ├── lib/                   # Utilities & API clients
│   ├── public/                # Static assets
│   ├── .env.local             # ⚠️  Firebase config (YOU must create this)
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   └── package.json
│
├── backend/                   # Express API + ML Server + FastAPI
│   ├── server.js              # ★ Main Express API server (port 8000)
│   ├── ml_server.py           # ★ YOLOv8 ML analysis server (port 5001)
│   ├── db.js                  # SQLite schema & connection
│   ├── app.py                 # FastAPI server (alternative backend)
│   ├── models/
│   │   └── best.pt            # Trained YOLO model weights
│   ├── yolo26n.pt             # YOLO fallback model
│   ├── yolov8n.pt             # YOLO base model
│   ├── dataset/               # Training dataset
│   │   ├── dataset.yaml
│   │   ├── images/
│   │   └── labels/
│   ├── routes/                # FastAPI route modules
│   ├── requirements.txt       # Python dependencies
│   └── package.json           # Node.js dependencies
│
├── chatbot/                   # n8n chatbot configuration
└── documentation/             # Project docs
```

---

## Prerequisites

Make sure you have the following installed on your machine:

| Tool | Version | Purpose |
|---|---|---|
| **Node.js** | ≥ 18.x | Express server & Next.js |
| **npm** | ≥ 9.x | Package management |
| **Python** | ≥ 3.10 | ML server & FastAPI |
| **pip** | latest | Python packages |
| **Git** | any | Clone repository |

**Optional but recommended:**
- Python `venv` or `conda` for virtual environments
- [Firebase project](https://console.firebase.google.com/) for authentication

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/vishnupriyanpr/RoadWatch.git
cd RoadWatch
```

---

### 2. Backend — Express API Server (Node.js)

The Express server handles all API routes: auth, complaints, workers, projects, rewards, and AI photo analysis proxy.

```bash
cd backend
npm install
```

This installs: `express`, `cors`, `bcryptjs`, `jsonwebtoken`, `multer`, `sqlite3`, `dotenv`.

**The SQLite database (`roadwatch_express.db`) is auto-created** on first run — no manual setup needed.

---

### 3. Backend — ML Server (Python + YOLOv8)

The ML server runs on port 5001 and performs AI image analysis using YOLOv8.

**Create and activate a virtual environment (recommended):**

```bash
# Windows
cd backend
python -m venv venv
venv\Scripts\activate

# macOS / Linux
cd backend
python3 -m venv venv
source venv/bin/activate
```

**Install Python dependencies:**

```bash
pip install -r requirements.txt
```

`requirements.txt` includes: `fastapi`, `uvicorn`, `firebase-admin`, `sqlalchemy`, `pydantic`, `python-multipart`, `httpx`, `opencv-python`, `ultralytics`, `pillow`, `folium`, `geopy`, `numpy`, `pandas`, `scikit-learn`

> 💡 **ultralytics** is the package that provides YOLOv8. It may take a few minutes to install as it downloads model weights.

**Model files included in the repository:**
| File | Description |
|---|---|
| `backend/models/best.pt` | Custom-trained YOLO model (potholes & cracks) |
| `backend/yolo26n.pt` | YOLO v2.6 nano fallback |
| `backend/yolov8n.pt` | YOLOv8 nano base model |

The ML server auto-detects available models in order: `models/best.pt` → `yolo26n.pt` → smart mock.

---

### 4. Frontend — Next.js App

```bash
cd frontend
npm install
```

---

### 5. Environment Variables

#### Frontend — Firebase Configuration

Create `frontend/.env.local` with your Firebase project credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**How to get Firebase credentials:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Go to **Project Settings → General → Your Apps → Web App**
4. Copy the `firebaseConfig` values into `.env.local`

> ⚠️ **The app works without Firebase** — the Express backend handles auth via JWT. Firebase is used for additional auth flows in the frontend.

#### Backend — Optional JWT Secret

By default, `server.js` uses a hardcoded JWT secret. For production, set:

```env
# Create backend/.env
JWT_SECRET=your_secure_random_secret_here
```

---

### 6. Start All Services

#### Option A — One-Click (Windows only)

Double-click `start_roadwatch.bat` or run:

```cmd
start_roadwatch.bat
```

This opens 3 separate terminal windows:
- 🤖 **ML Server** → `http://localhost:5001`
- 🖥️ **Express API** → `http://localhost:8000`
- 🌐 **Frontend** → `http://localhost:3000`

---

#### Option B — Manual (All platforms)

Open **3 separate terminal windows**:

**Terminal 1 — ML Server (Python):**
```bash
cd backend
# Activate venv first if you created one:
# venv\Scripts\activate   (Windows)
# source venv/bin/activate (Mac/Linux)
python ml_server.py
```
Expected output: `[ML] RoadWatch ML Server running on http://localhost:5001`

**Terminal 2 — Express API (Node.js):**
```bash
cd backend
node server.js
```
Expected output: `✅ Express server running on http://localhost:8000`

**Terminal 3 — Frontend (Next.js):**
```bash
cd frontend
npm run dev
```
Expected output: `▲ Next.js 14.2.3` → `Local: http://localhost:3000`

---

## Default Credentials

| Role | Login Field | Credential |
|---|---|---|
| **Admin** | Email | `admin@tn.gov.in` |
| **Admin** | Password | `admin123` |
| **Citizen** | Phone | (register first) |

---

## API Reference

The Express API runs on `http://localhost:8000`. All protected endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
```

### Authentication
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/citizen/register` | Register new citizen | ❌ |
| `POST` | `/api/auth/citizen/login` | Citizen login | ❌ |
| `POST` | `/api/auth/admin/login` | Admin login | ❌ |
| `GET` | `/api/users/me` | Get own profile | ✅ |

### Complaints
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/complaints` | List all complaints | ❌ |
| `POST` | `/api/complaints` | Create complaint | ✅ |
| `GET` | `/api/complaints/:id` | Get single complaint | ❌ |
| `PATCH` | `/api/complaints/:id` | Update status/worker | ✅ |
| `POST` | `/api/analyze` | AI image analysis | ✅ |

### Workers, Projects, Rewards
| Method | Endpoint | Description |
|---|---|---|
| `GET/POST` | `/api/workers` | List / add workers (admin) |
| `GET/POST` | `/api/projects` | List / create projects (admin) |
| `GET/POST` | `/api/rewards` | Reward catalog |
| `GET/POST` | `/api/redemptions` | Reward redemptions |
| `GET/POST` | `/api/notifications` | Notifications |
| `POST` | `/chatbot` | Chatbot proxy (n8n) |

### ML Server (`http://localhost:5001`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health & model status |
| `POST` | `/analyze` | Analyze image (multipart/form-data with `image` field) |

**Sample `/analyze` response:**
```json
{
  "damage_type": "Pothole",
  "confidence": 0.8923,
  "bbox": [45, 120, 310, 280],
  "severity": 67.4,
  "severity_category": "High",
  "priority": 78.2,
  "priority_category": "High",
  "road_type": "Main Road",
  "model_used": "best.pt"
}
```

---

## Features

### 👤 Citizen Portal
- Register/Login with phone number
- Report road damage with photo + GPS location
- AI auto-classifies damage type, severity, and priority
- Track complaint status in real time
- Earn points (10 pts/complaint) → Redeem for rewards
- Interactive map view of nearby complaints

### 🏛️ Admin Dashboard
- Overview analytics (total complaints, pending, in-progress, resolved)
- Complaint management (assign workers, update status, set budget)
- Worker registry (add/manage workers, track availability)
- Project management (group complaints into repair projects)
- Reward catalog management
- District-wise analytics and reporting

### 🤖 AI Analysis Pipeline
1. Citizen uploads photo → Express API receives it
2. Express proxies image to ML server (port 5001)
3. YOLOv8 detects damage type (Pothole / Crack)
4. Severity score calculated from bounding box area ratio
5. Priority score computed based on road type + severity
6. Results returned to frontend for display

---

## Troubleshooting

### `node_modules not found` or `npm install fails`
```bash
# Make sure Node.js >= 18 is installed
node --version
npm --version
# Then:
cd frontend && npm install
cd ../backend && npm install
```

### `ultralytics` or YOLO import errors
```bash
pip install --upgrade ultralytics
# If on M1/M2 Mac:
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install ultralytics
```

### ML Server not detecting model
The ML server searches for models in this order:
1. `backend/models/best.pt` ← custom trained
2. `backend/yolo26n.pt` ← fallback
3. Mock detection (always works, random output)

If you see `[ML] No models found — using smart mock fallback`, it means no `.pt` file was found. Check the file paths.

### Port already in use
```bash
# Kill process on port 5001 (ML server)
# Windows:
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:5001 | xargs kill -9
```

### Frontend can't connect to backend
- Make sure Express server is running on port 8000
- Check CORS is allowing `http://localhost:3000` (it is, by default)
- Check `frontend/lib/` for the API base URL config

### Firebase auth not working
- Verify `.env.local` has the correct Firebase credentials
- Enable **Email/Password** auth in Firebase Console → Authentication → Sign-in methods
- The app falls back to JWT-only auth if Firebase is misconfigured

---

## Contributing

This is a hackathon project. For improvements, open a PR or issue on [GitHub](https://github.com/vishnupriyanpr/RoadWatch).

---

## License

MIT © 2026 RoadWatch Team — IIT-M Hackathon
