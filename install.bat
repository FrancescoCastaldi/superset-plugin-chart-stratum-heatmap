@echo off
setlocal
cd /d "%~dp0"

echo ===================================================
echo   StratumHeatmap Plugin Installer Launcher
echo ===================================================

:: Sblocca automaticamente i file contro il blocco di Windows
powershell -NoProfile -Command "Get-ChildItem -Path '%~dp0' -Recurse | Unblock-File -ErrorAction SilentlyContinue"

:: 1. Avvia l'installer grafico nativo Windows EXE
if exist "%~dp0StratumHeatmapInstallerGUI.exe" (
    echo Avvio interfaccia grafica StratumHeatmapInstallerGUI.exe...
    start "" "%~dp0StratumHeatmapInstallerGUI.exe"
    exit /b 0
)

:: 2. Fallback su GUI Python se presente
if exist "%~dp0scripts\installer_gui.py" (
    where python >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        echo Avvio interfaccia grafica Python Tkinter...
        start "" python "%~dp0scripts\installer_gui.py"
        exit /b 0
    )
)

:: 3. Fallback su PowerShell GUI / Script
if exist "%~dp0scripts\install.ps1" (
    echo Avvio installer PowerShell...
    powershell -ExecutionPolicy Bypass -File "%~dp0scripts\install.ps1"
    pause
    exit /b 0
)

:: 4. Fallback su Python CLI
if exist "%~dp0scripts\installer.py" (
    echo Avvio installer Python...
    python "%~dp0scripts\installer.py"
    pause
    exit /b 0
)

pause