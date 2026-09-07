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
.PARAMETER SkipCleanCache
    Non elimina la cartella node_modules/.cache nel frontend di Superset.
#>

[CmdletBinding()]
param (
    [string]$SupersetPath,
    [string]$PluginPath,
    [switch]$NoDocker,
    [switch]$SkipCleanCache
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
$DefaultPluginRoot = Split-Path -Parent $ScriptDir
$PythonInstaller = Join-Path $ScriptDir "installer.py"

# 1. Superset Path
if (-not $SupersetPath) {
    $Candidates = @(
        "D:\Sviluppo\superset",
        "..\superset",
        "..\apache-superset",
        "..\superset-6.1.0",
        "$env:USERPROFILE\Desktop\superset",
        "$env:USERPROFILE\OneDrive - mapsengineering.com\superset-6.1.0",
        "$env:USERPROFILE\superset",
        "$env:USERPROFILE\Projects\superset",
        "$env:USERPROFILE\dev\superset"
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
    $SupersetPath = Read-Host "Percorso Superset (es. D:\Sviluppo\superset)"
}

if (-not (Test-Path $SupersetPath)) {
    Write-Color "[ERRORE] Il percorso '$SupersetPath' non esiste!" "Red"
    exit 1
}

$ResolvedSupersetPath = (Resolve-Path $SupersetPath).Path

# 2. Plugin Path
if (-not $PluginPath) {
    Write-Host ""
    Write-Color "Cartella del Plugin StratumHeatmap [Default: $DefaultPluginRoot]:" "Yellow"
    $InputPlugin = Read-Host "Percorso Plugin (premi INVIO per confermare default)"
    if ($InputPlugin) {
        $PluginPath = $InputPlugin
    } else {
        $PluginPath = $DefaultPluginRoot
    }
}

if (-not (Test-Path $PluginPath)) {
    Write-Color "[ERRORE] Il percorso del plugin '$PluginPath' non esiste!" "Red"
    exit 1
}

$ResolvedPluginPath = (Resolve-Path $PluginPath).Path

Write-Color "[INFO] Cartella Target Superset: $ResolvedSupersetPath" "Gray"
Write-Color "[INFO] Cartella Plugin:          $ResolvedPluginPath" "Gray"

# Verifica se Python e' disponibile
$PythonCmd = Get-Command "python" -ErrorAction SilentlyContinue
if (-not $PythonCmd) {
    $PythonCmd = Get-Command "python3" -ErrorAction SilentlyContinue
}

if ($PythonCmd) {
    Write-Color "[INFO] Esecuzione installer Python avanzato..." "Green"
    $argsList = @($PythonInstaller, "--superset-path", $ResolvedSupersetPath, "--plugin-path", $ResolvedPluginPath)
    if ($NoDocker) {
        $argsList += "--no-docker"
    }
    if ($SkipCleanCache) {
        $argsList += "--no-clean-cache"
    }

    & $PythonCmd.Source $argsList
} else {
    Write-Color "[INFO] Esecuzione procedura PowerShell nativa..." "Yellow"
    
    $FrontendDir = Join-Path $ResolvedSupersetPath "superset-frontend"
    if (-not (Test-Path $FrontendDir)) {
        Write-Color "[ERRORE] Impossibile trovare la cartella 'superset-frontend' in $ResolvedSupersetPath" "Red"
        exit 1
    }

    # Build locale plugin se necessario
    Write-Color "[INFO] Compilazione TypeScript del plugin..." "Yellow"
    try {
        Set-Location $ResolvedPluginPath
        npm run build
    } catch {
        Write-Color "[WARN] Avviso durante npm run build: $_" "Yellow"
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
    New-Item -ItemType Directory -Path $DestDir -Force | Out-Null

    $ItemsToCopy = @("src", "dist", "package.json", "tsconfig.json", "README.md")
    foreach ($item in $ItemsToCopy) {
        $srcItem = Join-Path $ResolvedPluginPath $item
        if (Test-Path $srcItem) {
            Copy-Item -Path $srcItem -Destination $DestDir -Recurse -Force
        }
    }

    # Patch MainPreset
    $MainPreset = Join-Path $FrontendDir "src\visualizations\presets\MainPreset.ts"
    if (-not (Test-Path $MainPreset)) {
        $MainPreset = Join-Path $FrontendDir "src\visualizations\presets\MainPreset.js"
    }

    if (Test-Path $MainPreset) {
        $Content = Get-Content -Path $MainPreset -Raw
        # Pulisci vecchi import/registrazioni
        $Content = $Content -replace "import\s*\{\s*StratumHeatmapPlugin\s*\}\s*from\s*['`"][^'`"]*superset-plugin-chart-stratum-heatmap[^'`"]*['`"];?\r?\n?", ""
        $Content = $Content -replace "[ \t]*new\s+StratumHeatmapPlugin\(\)\.configure\(\{[\s\S]*?\}\)\.register\(\),?\r?\n?", ""

        $ImportLine = "import { StratumHeatmapPlugin } from '../../../plugins/superset-plugin-chart-stratum-heatmap/src';`n"
        $RegisterLine = "        new StratumHeatmapPlugin().configure({ key: 'stratum_heatmap' }),`n"
        
        $Content = $ImportLine + $Content
        $Content = $Content -replace "(plugins\s*:\s*\[)", "`$1`n$RegisterLine"
        Set-Content -Path $MainPreset -Value $Content
        Write-Color "[SUCCESS] StratumHeatmap registrato con successo in $MainPreset" "Green"
    }

    # Pulizia cache Webpack/Babel
    if (-not $SkipCleanCache) {
        $CacheDir = Join-Path $FrontendDir "node_modules\.cache"
        if (Test-Path $CacheDir) {
            Write-Color "[INFO] Pulizia cache Webpack stale: $CacheDir..." "Yellow"
            try {
                Remove-Item -Recurse -Force $CacheDir -ErrorAction SilentlyContinue
                Write-Color "[SUCCESS] Cache eliminata con successo!" "Green"
            } catch {
                Write-Color "[WARN] Impossibile eliminare la cache: $_" "Yellow"
            }
        }
    }

    Write-Color "================================================================" "Green"
    Write-Color "   INSTALLAZIONE DI STRATUMHEATMAP COMPLETATA CON SUCCESSO!     " "Green"
    Write-Color "================================================================" "Green"
    Write-Color "" "White"
    Write-Color "COMANDI CONSIGLIATI PER DOCKER COMPOSE:" "Cyan"
    Write-Color "  cd '$ResolvedSupersetPath'" "White"
    Write-Color "  # Modalità standard/non-dev (consigliata):" "Yellow"
    Write-Color "  docker compose -f docker-compose-non-dev.yml up -d --build superset" "Green"
    Write-Color "" "White"
    Write-Color "  # Modalità sviluppo frontend (hot reload):" "Yellow"
    Write-Color "  docker compose restart superset-node" "Green"
    Write-Color "  oppure:" "Yellow"
    Write-Color "  docker compose up -d --build superset-node" "Green"
    Write-Color "" "White"
}
