@echo off
title SynapseJudge Launcher
echo ============================================
echo   Starting SynapseJudge (Online Judge)
echo ============================================
echo.

echo [1/3] Starting PostgreSQL database...
start "OJ Database (do not close)" cmd /k node "C:\Users\saiaj\oj-database\start-db.js"
timeout /t 8 /nobreak >nul

echo [2/3] Starting backend API on port 5000...
start "OJ Backend (do not close)" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 6 /nobreak >nul

echo [3/3] Starting frontend on port 3000...
start "OJ Frontend (do not close)" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 8 /nobreak >nul

echo.
echo All three servers are starting in their own windows.
echo Opening http://localhost:3000 in your browser...
start http://localhost:3000
echo.
echo You can close THIS window. Keep the other 3 windows open.
pause
