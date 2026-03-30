@echo off
title RAG Visualizer

echo Starting RAG Visualizer...
echo.

:: Start backend
echo [1/2] Starting backend (FastAPI on port 8000)...
start "RAG Backend" cmd /k "cd /d %~dp0backend && pip install -r requirements.txt -q && uvicorn app.main:app --reload --port 8000"
    
:: Start frontend
echo [2/2] Starting frontend (Vite dev server)...
start "RAG Frontend" cmd /k "cd /d %~dp0frontend && npm install && npm run dev"

echo.
echo Both servers are starting in separate windows.
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo.
echo Close this window or press any key to exit.
pause >nul
