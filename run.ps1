# CYBERGUARD - Scam & Spam Threat Detection System Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  CYBERGUARD // SCAM & SPAM THREAT DETECTION SYSTEM     " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] Error: Python is not available in PATH." -ForegroundColor Red
    exit 1
}

Write-Host "[*] Python runtime: $pythonVersion" -ForegroundColor Green
Write-Host "[*] Launching Web Operations Center on http://localhost:5000" -ForegroundColor Yellow
Write-Host "[*] Press Ctrl+C to terminate." -ForegroundColor Gray
Write-Host ""

python app.py
