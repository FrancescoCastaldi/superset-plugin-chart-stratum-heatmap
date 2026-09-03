@echo off
setlocal
cd /d "%~dp0"

echo ===================================================
echo   StratumHeatmap Plugin Installer Launcher
echo ===================================================

:: Sblocca automaticamente i file contro il blocco di Windows
powershell -NoProfile -Command "Get-ChildItem -Path '%~dp0' -Recurse | Unblock-File -ErrorAction SilentlyContinue"

:: 1. Se lo script GUI e' presente, avvia l'interfaccia grafica
if exist "%~dp0scripts\installer_gui.py" (
    echo Avvio interfaccia grafica StratumHeatmap Installer GUI...
    start "" python "%~dp0scripts\installer_gui.py"
    exit /b 0
)

:: 2. Fallback su PowerShell
if exist "%~dp0scripts\install.ps1" (
    echo Avvio installer PowerShell...
    powershell -ExecutionPolicy Bypass -File "%~dp0scripts\install.ps1"
    pause
    exit /b 0
)

:: 3. Fallback su installer Python CLI
if exist "%~dp0scripts\installer.py" (
    echo Avvio installer Python CLI...
    python "%~dp0scripts\installer.py"
    pause
    exit /b 0
)

pause
