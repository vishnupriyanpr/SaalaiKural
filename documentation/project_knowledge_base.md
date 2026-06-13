# RoadWatch (சாலையின் குரல்) - Exhaustive Codebase Knowledge Base

**Purpose:** This document serves as a complete, highly detailed technical map of the RoadWatch project. It is intended to allow any AI agent or developer in a separate session to understand the entire architecture, file structure, data flows, integration gaps, and business logic without needing to read the entire codebase from scratch.

---

## 1. Executive Summary & Architecture
RoadWatch is a gamified, AI-powered road defect reporting and management system focused on Tamil Nadu, India. The application consists of three decoupled sub-systems:
1. **Frontend (`/frontend/`)**: Next.js 14 App Router application with heavy 3D visuals, gamification, and an **in-memory mock database**. It currently operates entirely independently of the backend.
2. **Backend (`/backend/`)**: FastAPI application providing real REST endpoints, SQLite storage via SQLAlchemy, and real YOLOv8 object detection for road cracks and potholes.
3. **Chatbot (`/chatbot/`)**: Standalone n8n-powered webhook workflow integrating with the Groq API (GPT-OSS-20b) and a vanilla HTML frontend.

**Crucial System Context:** The frontend and backend are currently disconnected. The frontend relies on `lib/db.ts` for mock data, while the backend exposes a fully functional API at `http://localhost:8000` (or `5000`) that is waiting to be consumed.

---

## 2. BACKEND SUBSYSTEM Deep-Dive
**Stack:** FastAPI, SQLAlchemy, SQLite, Pydantic, PyJWT, YOLOv8 (Ultralytics), Firebase Admin.
**Total Files Analyzed:** 24

### 2.1 Core Configuration & Entry
*   **`backend/app.py`**: The FastAPI entry point. Bootstraps the app, enables wide-open CORS (`allow_origins=["*"]`), creates SQLite tables on startup (`models.Base.metadata.create_all`), creates `uploads/repairs` and `models/` directories, and registers three routers (Auth, Complaints, Dashboard).
*   **`backend/database.py`**: Configures `sqlite:///./road_transparency.db`. Provides the `get_db()` dependency for FastAPI route sessions.
*   **`backend/requirements.txt`**: Contains dependencies like `fastapi`, `uvicorn`, `firebase-admin`, `sqlalchemy`, `pydantic`, `ultralytics`, `pillow`, `folium`. (Note: Some dependencies like `geopy`, `pandas`, `scikit-learn` are listed but unused).

### 2.2 Database Models & Schemas
*   **`backend/models.py` (SQLAlchemy)**:
    *   `User`: id (UUID4), name, email, role (Citizen/Authority/Admin), points, created_at.
    *   `Complaint`: id, user_id (FK), image_path, latitude, longitude, damage_type, confidence, severity, priority, status (Pending/Assigned/In Progress/Resolved), is_duplicate.
    *   `RepairUpdate`: id, complaint_id (FK), repair_image_path, remarks.
    *   `Reward`: id, user_id (FK), points, badge.
*   **`backend/schemas.py` (Pydantic)**: Defines `UserCreate`, `UserLoginRequest`, `ComplaintCreate`, `ComplaintOut`, `RepairUpdateOut`, `RewardOut`, and `LeaderboardEntry` for request validation and response serialization.

### 2.3 Business Logic & Services
*   **`backend/complaint_service.py`**: The central orchestrator. When a complaint is processed:
    1. Saves uploaded image to disk.
    2. Runs YOLO detection via `yolo_service.predict()`.
    3. Computes severity (`severity_service`) and priority (`priority_service`).
    4. Performs geospatial duplicate check (`duplicate_detection`).
    5. Saves to DB and awards gamification points (`reward_service.py`).
*   **`backend/yolo_service.py`**: Loads `models/best.pt`.
    *   **WARNING:** Contains a hardcoded Windows path to the model: `D:\Road_safety_hackathon\RoadTransparency\backend\models\best.pt` (must be fixed in new environments).
    *   Returns highest confidence detection (Crack or Pothole). Includes a random mock fallback if Ultralytics fails to load.
*   **`backend/duplicate_detection.py`**: Uses Haversine distance. Flags a complaint as a duplicate if another complaint with the same `damage_type` exists within 50 meters and was created within the last 7 days.
*   **`backend/priority_service.py`**: Calculates priority (0-100) using: Severity (0.6 weight) + report_score + pending_score + a *randomly mocked* road importance score (School=20, Hospital=20, etc.). Output: Low, Medium, High, Critical.
*   **`backend/severity_service.py`**: Calculates severity based on YOLO's bounding box area ratio, confidence, and damage weights (Pothole=1.0, Crack=0.8).
*   **`backend/reward_service.py`**: Points logic: Verified Complaint = +10, Resolved = +20. Badges: Bronze (<50), Silver (<150), Gold (<300), Road Guardian (300+).
*   **`backend/dashboard_service.py` & `analytics_service.py`**: Aggregate queries for admin views. Calculates monthly trends using SQLite `substr()` (not Postgres compatible).
*   **`backend/map_service.py`**: Generates literal HTML files (`map.html`, `heatmap.html`) using the `folium` library based on complaint coordinates.
*   **`backend/auth.py` & `firebase_service.py`**: Firebase Admin verifies ID tokens passed in headers. JWT creation exists but relies heavily on Firebase UID validation. Provides `@admin_required` decorators.

### 2.4 API Routes
*   **`/routes/auth_routes.py`**: `POST /auth/register`, `POST /auth/login`, `GET /auth/profile`.
*   **`/routes/complaint_routes.py`**: `POST /complaints/report` (expects multipart form data), `GET /complaints`, `PUT /complaints/update-status/{id}`, `PUT /repairs/update/{id}`, `GET /leaderboard`.
*   **`/routes/dashboard_routes.py`**: `GET /dashboard/stats`, `GET /analytics`, `GET /map` (returns HTML FileResponse).

---

## 3. FRONTEND SUBSYSTEM Deep-Dive
**Stack:** Next.js 14 (App Router), React 19, TypeScript, Tailwind, Three.js, Leaflet, Recharts.
**Total Files Analyzed:** 48
**Critical State Management:** No Redux/Zustand. Uses React hooks + LocalStorage + a custom Pub/Sub event dispatcher.

### 3.1 The Mock Data Layer (CRITICAL KNOWLEDGE)
*   **`frontend/lib/db.ts` (576 lines)**: **This file is the single source of truth for the entire frontend currently.** It simulates a full database using `localStorage` under the key `roadguard_mock_db`.
    *   Implements `getAll()`, `create()`, `update()` for Civilians, Complaints, Projects, Rewards.
    *   Implements `db.subscribe()` using `window.dispatchEvent(new Event("roadguard-db-update"))`. Every UI component subscribes to this to trigger React re-renders when data changes.
    *   Contains complex logic: e.g., `createBulkRepairProject()` groups nearby complaints spatially.
*   **`frontend/lib/seedData.ts`**: Populates the mock DB with 3 fake users (from Chennai, Coimbatore, Madurai) and ~6 realistic fake complaints to make the app look populated on first load.
*   **`frontend/lib/gamification.ts`**: Frontend mirror of the backend's `reward_service.py`. Contains definitions for 6 Tiers (Newcomer to Platinum Champion) and 6 Badges.

### 3.2 Pages & Routing (`/app/`)
*   **`app/page.tsx`**: Landing page. Heavy animations (`LiveBackground`, `GradualBlur`, `OrbitImages`, `TamilNadu3DMap`).
*   **`app/(auth)/login/page.tsx`**: Dual login form (Civilian vs Admin). Hardcoded Admin password: `admin123`. Sets `roadguard_session` in localStorage.

**Admin Portal (`/admin/*`)**:
*   `dashboard/page.tsx`: KPIs and Recharts. Contains a simulated AI predictions panel.
*   `complaints/page.tsx`: Triage table. Clicking "Verify" or "Resolve" triggers `db.updateComplaintStatus()`, which cascades into gamification points in the mock DB.
*   `map/page.tsx`: Leaflet map. **Innovation**: Includes `drawPolygonZone` tool to lasso multiple complaints and group them into a single `BulkRepairProject`.
*   `budget/`, `progress/`, `rewards/`, `work/`: Administrative tracking views.

**Civilian Portal (`/civilian/*`)**:
*   `dashboard/page.tsx`: Personal gamification hub with `PointCounter` and `LevelBadge` animations.
*   `report/page.tsx`: 3-step wizard. Upload photo -> Wait for mock AI analysis delay -> Pick location -> Submit. Uses `idb-keyval` to queue reports in IndexedDB if the device is offline.
*   `map/page.tsx`: Filters complaints within a 5km radius of the user using HTML Geolocation API and Haversine distance.
*   `chat/page.tsx`: Multilingual Web Speech API (Voice-to-Text) chatbot. Currently uses hardcoded keyword matching responses (mocked).
*   `work/page.tsx`: Civic economy job board. Generates a "Civic Skill Passport" PDF using `jsPDF`.

### 3.3 Key Components (`/components/`)
*   **`shared/Lanyard.tsx` (Three.js)**: A physics-based interactive 3D ID card. Uses `@react-three/rapier` for rope physics. Loads `card.glb` and `lanyard.png`.
*   **`shared/DynamicMap.tsx` & `LeafletMap.tsx`**: Wraps `react-leaflet` in a dynamic import (`ssr: false`) because Leaflet requires the `window` object. Handles pins, popups, and the polygon lasso tool.
*   **`civilian/PointCounter.tsx`**: Triggers `canvas-confetti` when points increase.

---

## 4. CHATBOT SUBSYSTEM Deep-Dive
**Stack:** Vanilla HTML/JS, n8n Cloud (Webhook + LLM Workflow), Groq API.
**Total Files Analyzed:** 7

### 4.1 Architecture & Workflow
The chatbot acts as a fully stateless, linear NLP pipeline.
*   **`chatbot/frontend/index.html`**: A single 22KB HTML file containing all styles and JS. Sends the user's message as `JSON.stringify` inside a `text/plain` POST request to avoid CORS preflight options. Sets a 20-second `AbortController` timeout.
*   **`chatbot/n8n/workflow.json`**: The actual backend logic, meant to be imported into an n8n instance. It contains 9 nodes:
    1.  **Webhook Trigger**: Listens at `/roadwatch-chat`.
    2.  **Validate**: Ensures input is 2-2000 characters.
    3.  **Build Prompt**: Combines user input with the system persona (defined in `docs/system-prompt.txt`).
    4.  **Call Groq API**: Sends prompt to `api.groq.com` using model `openai/gpt-oss-20b`.
        *   **SECURITY WARNING**: The Groq API key is hardcoded directly into this JSON file. Replace `YOUR_GROQ_API_KEY_HERE` with your actual key from [console.groq.com](https://console.groq.com) before importing into n8n.
    5.  **Format Response**: A code node that uses Regex to classify the user's initial message into categories (`emergency`, `road_issue`, `traffic_rules`, etc.) and determines the "guidance type" (e.g., `emergency_action` → advises calling 112).
    6.  **Send Response**: Returns a rigid JSON contract: `{ success, reply, category, guidance_type, follow_up_options }`.

### 4.2 Documentation Staleness
*   The `README.md` correctly reflects the current Groq implementation.
*   **WARNING:** `docs/architecture.md` and `docs/setup-guide.md` are **outdated**. They reference NVIDIA NIM, Gemma 4, and environment variables (`$env.NVIDIA_API_KEY`), which were deprecated due to timeout issues. Rely on `workflow.json` for truth.

---

## 5. REQUIRED INTEGRATION ROADMAP (For Future AI Sessions)

To make RoadWatch a fully functional, integrated application, the following tasks must be completed by whoever reads this:

1.  **Frontend API Client Implementation**:
    *   Create an Axios or Fetch utility in `/frontend/lib/api.ts` pointing to the backend URL (`http://localhost:8000` or `5000`).
2.  **Rip Out the Mock Database**:
    *   Systematically replace calls to `db.ts` (e.g., `db.getComplaints()`, `db.createComplaint()`) across all 14 pages with standard React `useEffect` + fetch or React Query fetching from the FastAPI endpoints.
    *   Remove the `window.dispatchEvent` pub/sub pattern in favor of standard server-state management.
3.  **Authentication Overhaul**:
    *   Currently, the frontend writes a mock JSON object to localStorage on login.
    *   This must be replaced by implementing actual Firebase Authentication on the frontend, retrieving the ID Token, and passing it to FastAPI's `POST /auth/login`.
4.  **Real AI Triage**:
    *   In `frontend/app/civilian/report/page.tsx`, remove the `setTimeout` mock AI simulation.
    *   POST the user's uploaded image file directly to FastAPI. Wait for YOLOv8 to return the actual `severity` and `damage_type`.
5.  **Backend Fixes**:
    *   Fix the hardcoded Windows path in `yolo_service.py` to use `os.path.join(os.path.dirname(__file__), "models", "best.pt")`.
    *   Implement real geocoding for the `road_importance` score in `priority_service.py` (which currently uses `random.choice()`).
6.  **Chatbot Embedding**:
    *   Convert `chatbot/frontend/index.html` into a React component (`<ChatWidget />`) within the Next.js app.
    *   Optionally, proxy the n8n webhook call through a Next.js API route (`/api/chat`) to hide the webhook URL and handle CORS cleanly.
