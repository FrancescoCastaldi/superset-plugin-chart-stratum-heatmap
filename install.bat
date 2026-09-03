@echo off
setlocal
cd /d "%~dp0"

echo ===================================================
echo   StratumHeatmap Plugin Installer Launcher
echo ===================================================

:: Sblocca automaticamente i file contro il blocco di Windows
powershell -NoProfile -Command "Get-ChildItem -Path '%~dp0' -Recurse | Unblock-File -ErrorAction SilentlyContinue"

:: Avvio installer Python
if exist "%~dp0scripts\installer.py" (
    echo Avvio installer Python...
    python "%~dp0scripts\installer.py"
    pause
    exit /b 0
)

pause
