@echo off
title RoadWatch - Starting All Services

echo.
echo  ==========================================
echo   RoadWatch IIT-M - Starting All Services
echo  ==========================================
echo.

echo  [1/3] Starting ML Server (Python - port 5001)...
start "RoadWatch ML Server" cmd /k "cd /d "%~dp0backend" && python ml_server.py"

timeout /t 2 /nobreak > nul

echo  [2/3] Starting Express API Server (Node - port 8000)...
start "RoadWatch Express API" cmd /k "cd /d "%~dp0backend" && node server.js"

timeout /t 2 /nobreak > nul

echo  [3/3] Starting Next.js Frontend (port 3000)...
start "RoadWatch Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo  All services are starting in separate windows:
echo    ML Server   : http://localhost:5001
echo    Express API : http://localhost:8000
echo    Frontend    : http://localhost:3000
echo.
echo  Default Admin Login: admin@tn.gov.in / admin123
echo.
pause
