@echo off
title NETRISH - Law Enforcement Command Server
echo ========================================================
echo    NETRISH - AI Criminal Network Analysis System
echo    National Entity Tracking, Relationship, Investigation
echo ========================================================
echo.
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
node server/index.js
pause
