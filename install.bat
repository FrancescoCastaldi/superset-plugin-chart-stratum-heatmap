@echo off
setlocal
cd /d "%~dp0"

echo ===================================================
echo   StratumHeatmap Plugin Installer Launcher
echo ===================================================

:: Sblocca automaticamente i file contro il blocco di Windows
powershell -NoProfile -Command "Get-ChildItem -Path '%~dp0' -Recurse | Unblock-File -ErrorAction SilentlyContinue"

:: 1. Se Python e' installato e la GUI e' presente, avvia l'interfaccia grafica
where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    if exist "%~dp0scripts\installer_gui.py" (
        echo [INFO] Rilevato Python sul sistema. Avvio interfaccia grafica StratumHeatmap GUI...
        start "" python "%~dp0scripts\installer_gui.py"
        exit /b 0
    )
)

where py >nul 2>nul
if %ERRORLEVEL% equ 0 (
    if exist "%~dp0scripts\installer_gui.py" (
        echo [INFO] Rilevato launcher py. Avvio interfaccia grafica StratumHeatmap GUI...
        start "" py "%~dp0scripts\installer_gui.py"
        exit /b 0
    )
)

:: 2. Se Node.js e' presente, avvia lo script cross-platform Node
where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    if exist "%~dp0scripts\install.js" (
        echo [INFO] Rilevato Node.js sul sistema. Avvio installer scripts/install.js...
        node "%~dp0scripts\install.js"
        pause
        exit /b 0
    )
)

:: 3. Fallback su PowerShell scripts/install.ps1
if exist "%~dp0scripts\install.ps1" (
    echo [INFO] Avvio installer PowerShell scripts/install.ps1...
    powershell -ExecutionPolicy Bypass -File "%~dp0scripts\install.ps1"
    pause
    exit /b 0
)

:: 4. Fallback estremo su Python CLI se presente
if exist "%~dp0scripts\installer.py" (
    echo [INFO] Avvio installer Python CLI scripts/installer.py...
    python "%~dp0scripts\installer.py"
    pause
    exit /b 0
)

echo [ERRORE] Nessun interprete supportato (Python, Node.js o PowerShell) trovato per eseguire l'installazione.
pause
