@echo off
title CYBERGUARD - Scam & Spam Threat Detection System
echo ========================================================
echo   CYBERGUARD // SCAM AND SPAM THREAT DETECTION SYSTEM
echo ========================================================
echo.
echo [*] Checking Python environment...
python --version
if errorlevel 1 (
    echo [!] Python is not installed or not in PATH. Please install Python.
    pause
    exit /b 1
)

echo.
echo [*] Starting CyberGuard Defense Server...
echo [*] Open your web browser and navigate to: http://localhost:5000
echo [*] Press Ctrl+C to stop the server.
echo.

python app.py
pause
