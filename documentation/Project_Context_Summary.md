# RoadWatch IIT-M - Project Documentation & Conversation History

## 1. Project Overview
RoadWatch is a dual-backend application designed for citizens to report road damage (cracks and potholes), which are then automatically analyzed by an AI (YOLOv8) to calculate severity and priority. The admin dashboard allows authorities to track and update the status of these reports.

### Architecture
- **Frontend:** Next.js (React) running on Port 3000.
- **Main API Backend:** Node.js (Express) running on Port 8000.
- **ML Processing Server:** Python native HTTP server running on Port 5001.
- **Database:** SQLite (`roadwatch.db` via Sequelize/raw queries).

## 2. Conversation & Progress Summary

### What We Have Accomplished So Far:
1. **Express Backend Overhaul:** 
   - We migrated away from a broken Express setup that kept crashing due to SQLite event loop issues on Windows. 
   - Fixed CORS errors that were blocking the Next.js frontend from communicating with the backend.
   - Set up robust JWT authentication for both Citizens and Admins.
   - Automatically seeded a default admin account (`admin@tn.gov.in` / `admin123`).

2. **ML Backend Integration:**
   - Discovered that the original FastAPI implementation was broken because the Python virtual environment lacked packages like `fastapi`, `uvicorn`, and `pip`.
   - Built a native Python server (`ml_server.py`) using only the standard library + `ultralytics` to handle ML processing.
   - Configured Express to proxy photo uploads via `multer` securely to the Python ML server.
   - Implemented a "smart mock fallback" in the Python server that generates realistic severity and priority scores when the actual YOLO model (`best.pt`) is missing.

3. **Startup Process Optimization:**
   - Created `start_roadwatch.bat` to launch the Next.js frontend, Node.js backend, and Python ML server simultaneously in independent, easily manageable `cmd` windows.

## 3. API Routes

### Authentication (`/api/auth`)
- `POST /api/auth/citizen/register` (phone, password)
- `POST /api/auth/citizen/login` (phone, password)
- `POST /api/auth/admin/login` (email, password)

### Core Logic (`/api`)
- `POST /api/analyze` - Protected route. Accepts multipart form data (image). Forwards to Python ML server, calculates YOLO bounding boxes, severity, and priority. Returns JSON + saved photo URL.

## 4. Current State of the ML Model
As of right now, there is **no actual YOLO model weights file** (`best.pt`) present in the `backend/models` directory. Because of this, `ml_server.py` is safely intercepting image requests and returning randomly generated but mathematically consistent mock data (e.g., classifying a random bounding box as a "Pothole" with 85% confidence, which translates into a specific severity score). 

**The immediate next step is to write a script that downloads a dataset and trains a real YOLOv8 model to replace this mock behavior.**
