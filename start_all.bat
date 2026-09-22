@echo off
cd /d "C:\Users\KVAKH\Videos\my-project"

:: Start frontend
start "" cmd /c "npm run dev"

:: Start FastAPI backend
start "" cmd /c "cd backend && uvicorn main:app --reload"

:: Start Express backend
start "" cmd /c "cd backend && node server.js"

:: Wait a few seconds to allow frontend to start
timeout /t 5 /nobreak >nul

:: Open frontend in browser
start "" "http://localhost:5173/"
