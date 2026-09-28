@echo off
REM StratumHeatmap Chart Plugin Installer Runner
echo Avvio installazione StratumHeatmap Chart Plugin per Apache Superset...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-plugin.ps1" %*
pause
