@echo off
REM ============================================================
REM  RoadWatch - Git Setup & Push Script
REM  Run this script from the project root directory
REM  Double-click OR run: setup_and_push.bat
REM ============================================================

echo.
echo  ============================================
echo   RoadWatch - Git Setup ^& Push to GitHub
echo  ============================================
echo.

REM Navigate to project root
cd /d "%~dp0"

echo  [Step 1] Checking git installation...
git --version
if errorlevel 1 (
    echo  ERROR: git not found. Please install Git from https://git-scm.com/
    pause
    exit /b 1
)

echo.
echo  [Step 2] Checking if git repo is initialized...
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo  Initializing new git repository...
    git init
    echo  Git repository initialized.
) else (
    echo  Git repository already exists.
)

echo.
echo  [Step 3] Setting up remote (GitHub)...
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo  Adding remote origin...
    git remote add origin https://github.com/vishnupriyanpr/RoadWatch.git
    echo  Remote added: https://github.com/vishnupriyanpr/RoadWatch.git
) else (
    echo  Updating remote origin...
    git remote set-url origin https://github.com/vishnupriyanpr/RoadWatch.git
    echo  Remote updated.
)

echo.
echo  [Step 4] Staging all files...
git add .
echo  Files staged.

echo.
echo  [Step 5] Creating commit...
git commit -m "feat: RoadWatch full codebase - AI road damage monitoring platform

- Express.js API server (port 8000) with SQLite, JWT auth, rewards
- Python ML server (port 5001) with YOLOv8 damage detection
- Next.js 14 frontend with Leaflet maps, Recharts, Framer Motion
- YOLOv8 trained models: best.pt, yolo26n.pt, yolov8n.pt
- Training dataset with images and labels
- Chatbot integration via n8n webhook
- Comprehensive README with setup instructions
- Updated .gitignore (excludes node_modules, keeps models & dataset)"

echo.
echo  [Step 6] Setting branch to main...
git branch -M main

echo.
echo  [Step 7] Pushing to GitHub...
echo  (You may be prompted for GitHub credentials)
git push -u origin main

if errorlevel 1 (
    echo.
    echo  Push failed. Common fixes:
    echo  1. Make sure you are logged into GitHub
    echo  2. Try: git push -u origin main --force
    echo  3. Or use GitHub Desktop to push
) else (
    echo.
    echo  ============================================
    echo   SUCCESS! Code pushed to GitHub!
    echo   https://github.com/vishnupriyanpr/RoadWatch
    echo  ============================================
)

echo.
pause
