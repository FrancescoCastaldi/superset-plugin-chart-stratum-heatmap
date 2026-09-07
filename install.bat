@echo off
setlocal
cd /d "%~dp0"

:: Sblocca automaticamente eventuali file scaricati/estratti
powershell -NoProfile -Command "Get-ChildItem -Path '%~dp0' -Recurse | Unblock-File -ErrorAction SilentlyContinue"

:: Se sono passati argomenti da linea di comando, inoltrali direttamente all'installer PowerShell
if not "%~1"=="" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-plugin.ps1" %*
    exit /b %ERRORLEVEL%
)

echo ============================================================
echo   StratumHeatmap - Apache Superset Plugin Installer
echo ============================================================
echo   [1] Esegui Installer PowerShell (install-plugin.ps1) [Consigliato]
echo   [2] Avvia Interfaccia Grafica Windows (StratumHeatmapInstallerGUI.exe)
echo   [3] Esegui Installer Python (scripts\installer.py)
echo   [4] Esegui Installer Node.js (scripts\install.js)
echo ============================================================
set /p CHOICE="Seleziona un'opzione [1/2/3/4, Invio per default: 1]: "

if "%CHOICE%"=="2" goto run_gui
if "%CHOICE%"=="3" goto run_python
if "%CHOICE%"=="4" goto run_node
goto run_ps

:run_ps
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-plugin.ps1"
goto end

:run_gui
if exist "%~dp0StratumHeatmapInstallerGUI.exe" (
    echo Avvio interfaccia grafica StratumHeatmapInstallerGUI.exe...
    start "" "%~dp0StratumHeatmapInstallerGUI.exe"
    exit /b 0
) else (
    echo [ERRORE] StratumHeatmapInstallerGUI.exe non trovato!
    pause
    exit /b 1
)

:run_python
where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    python "%~dp0scripts\installer.py"
) else (
    echo [ERRORE] Python non trovato nel PATH!
)
goto end

:run_node
where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    node "%~dp0scripts\install.js"
) else (
    echo [ERRORE] Node.js non trovato nel PATH!
)
goto end

:end
pause
