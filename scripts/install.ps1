<#
.SYNOPSIS
    Installer automatico per StratumHeatmap in Apache Superset (Windows PowerShell).
.DESCRIPTION
    Installa e registra il plugin 'StratumHeatmap' all'interno del repository
    Apache Superset.
.PARAMETER SupersetPath
    Percorso della cartella radice di Apache Superset (es. D:\Sviluppo\superset).
.PARAMETER NoDocker
    Non esegue comandi Docker Compose.
#>

[CmdletBinding()]
param (
    [string]$SupersetPath,
    [switch]$NoDocker
)

$ErrorActionPreference = "Stop"

function Write-Color([string]$text, [string]$color) {
    Write-Host $text -ForegroundColor $color
}

Write-Color "================================================================" "Cyan"
Write-Color "   StratumHeatmap - Apache Superset Chart Plugin Installer      " "Cyan"
Write-Color "   Windows PowerShell Automation Script                         " "Cyan"
Write-Color "================================================================" "Cyan"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PluginRoot = Split-Path -Parent $ScriptDir
$PythonInstaller = Join-Path $ScriptDir "installer.py"
$PythonGui = Join-Path $ScriptDir "installer_gui.py"

# Auto-rilevamento percorso se non fornito
if (-not $SupersetPath) {
    $Candidates = @(
        "D:\Sviluppo\superset",
        "C:\Users\fracas\Desktop\superset",
        "C:\Users\fracas\OneDrive - mapsengineering.com\superset-6.1.0",
        "..\superset"
    )
    foreach ($c in $Candidates) {
        if (Test-Path (Join-Path $c "superset-frontend\package.json")) {
            $SupersetPath = (Resolve-Path $c).Path
            Write-Color "[INFO] Trovata installazione Superset automatica: $SupersetPath" "Green"
            break
        }
    }
}

if (-not $SupersetPath) {
    Write-Host ""
    Write-Color "Inserisci il percorso della cartella radice di Apache Superset:" "Yellow"
    $SupersetPath = Read-Host "Percorso (es. D:\Sviluppo\superset)"
}

if (-not (Test-Path $SupersetPath)) {
    Write-Color "[ERRORE] Il percorso '$SupersetPath' non esiste!" "Red"
    exit 1
}

$ResolvedSupersetPath = (Resolve-Path $SupersetPath).Path
Write-Color "[INFO] Cartella Target Superset: $ResolvedSupersetPath" "Gray"
Write-Color "[INFO] Cartella Plugin:          $PluginRoot" "Gray"

# Verifica se Python e' disponibile
$PythonCmd = Get-Command "python" -ErrorAction SilentlyContinue
if (-not $PythonCmd) {
    $PythonCmd = Get-Command "python3" -ErrorAction SilentlyContinue
}

if ($PythonCmd) {
    Write-Color "[INFO] Esecuzione installer Python avanzato..." "Green"
    $argsList = @($PythonInstaller, "--superset-path", $ResolvedSupersetPath)
    if ($NoDocker) {
        $argsList += "--no-docker"
    }

    & $PythonCmd.Source $argsList
} else {
    Write-Color "[INFO] Esecuzione procedura PowerShell nativa..." "Yellow"
    
    $FrontendDir = Join-Path $ResolvedSupersetPath "superset-frontend"
    if (-not (Test-Path $FrontendDir)) {
        Write-Color "[ERRORE] Impossibile trovare la cartella 'superset-frontend' in $ResolvedSupersetPath" "Red"
        exit 1
    }

    $PluginsDir = Join-Path $FrontendDir "plugins"
    if (-not (Test-Path $PluginsDir)) {
        New-Item -ItemType Directory -Path $PluginsDir -Force | Out-Null
    }

    $DestDir = Join-Path $PluginsDir "superset-plugin-chart-stratum-heatmap"
    if (Test-Path $DestDir) {
        Write-Color "[INFO] Rimozione versione precedente in '$DestDir'..." "Yellow"
        Remove-Item -Recurse -Force $DestDir
    }

    Write-Color "[INFO] Copia dei file del plugin in $DestDir..." "Green"
    Copy-Item -Path $PluginRoot -Destination $DestDir -Recurse -Force -Exclude @("node_modules", "dist", ".git", "*.log", "scripts")

    # Patch MainPreset
    $MainPreset = Join-Path $FrontendDir "src\visualizations\presets\MainPreset.ts"
    if (-not (Test-Path $MainPreset)) {
        $MainPreset = Join-Path $FrontendDir "src\visualizations\presets\MainPreset.js"
    }

    if (Test-Path $MainPreset) {
        $Content = Get-Content -Path $MainPreset -Raw
        if ($Content -notmatch "StratumHeatmapPlugin") {
            $ImportLine = "import { StratumHeatmapPlugin } from '../../../plugins/superset-plugin-chart-stratum-heatmap/src';`n"
            $RegisterLine = "        new StratumHeatmapPlugin().configure({ key: 'stratum_heatmap' }).register(),`n"
            
            $Content = $ImportLine + $Content
            $Content = $Content -replace "(plugins\s*:\s*\[)", "`$1`n$RegisterLine"
            Set-Content -Path $MainPreset -Value $Content
            Write-Color "[SUCCESS] StratumHeatmap registrato con successo in $MainPreset" "Green"
        } else {
            Write-Color "[INFO] StratumHeatmapPlugin già registrato in $MainPreset." "Yellow"
        }
    }

    Write-Color "================================================================" "Green"
    Write-Color "   INSTALLAZIONE DI STRATUMHEATMAP COMPLETATA CON SUCCESSO!     " "Green"
    Write-Color "================================================================" "Green"
}
