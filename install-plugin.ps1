<#
.SYNOPSIS
    Automated installer script for StratumHeatmap Chart Plugin in Apache Superset.
.DESCRIPTION
    Installs and registers the StratumHeatmap chart plugin into an Apache Superset repository:
    1. Locates and validates the Apache Superset root directory.
    2. Builds the plugin (TypeScript compilation) if npm is available.
    3. Copies plugin files into superset-frontend/plugins/superset-plugin-chart-stratum-heatmap.
    4. Safely parses and updates MainPreset.ts with backup and idempotency:
       - import { StratumHeatmapChartPlugin } from '../../../plugins/superset-plugin-chart-stratum-heatmap/src';
       - new StratumHeatmapChartPlugin().configure({ key: 'stratum_heatmap' }).register(),
    5. Cleans stale Webpack/Babel cache.
    6. Optionally prompts or restarts Docker containers.
.PARAMETER SupersetPath
    Path to the Apache Superset root directory (e.g. C:\Users\admmaps\superset_6_1_0\superset).
.PARAMETER PluginPath
    Path to the StratumHeatmap plugin root directory (default: script root).
.PARAMETER SkipBuild
    Skips running 'npm run build' before copying files.
.PARAMETER NoDocker
    Skips Docker Compose prompts and operations.
.PARAMETER SkipCleanCache
    Skips removing superset-frontend/node_modules/.cache.
.PARAMETER Force
    Runs non-interactively using defaults without prompting.
.EXAMPLE
    .\install-plugin.ps1
.EXAMPLE
    .\install-plugin.ps1 -SupersetPath "C:\Users\admmaps\superset_6_1_0\superset"
.EXAMPLE
    .\install-plugin.ps1 -SupersetPath "D:\Sviluppo\superset" -Force
#>

[CmdletBinding()]
param (
    [Parameter(Position = 0)]
    [string]$SupersetPath,

    [Parameter(Position = 1)]
    [string]$PluginPath,

    [switch]$SkipBuild,
    [switch]$NoDocker,
    [switch]$SkipCleanCache,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

function Write-Color([string]$text, [string]$color = "White") {
    Write-Host $text -ForegroundColor $color
}

Write-Color "================================================================" "Cyan"
Write-Color "   StratumHeatmap - Apache Superset Chart Plugin Installer      " "Cyan"
Write-Color "   Interactive ECharts Matrix Grid & Density Visualizer         " "Cyan"
Write-Color "================================================================" "Cyan"
Write-Color ""

# -------------------------------------------------------------
# 1. Resolve Plugin Path
# -------------------------------------------------------------
if (-not $PluginPath) {
    if (Test-Path (Join-Path $PSScriptRoot "src\index.ts")) {
        $PluginPath = $PSScriptRoot
    } elseif (Test-Path (Join-Path (Split-Path -Parent $PSScriptRoot) "src\index.ts")) {
        $PluginPath = Split-Path -Parent $PSScriptRoot
    } else {
        $PluginPath = $PSScriptRoot
    }
}

$ResolvedPluginPath = (Resolve-Path $PluginPath).Path
if (-not (Test-Path (Join-Path $ResolvedPluginPath "package.json"))) {
    Write-Color "[ERRORE] Impossibile trovare package.json del plugin in '$ResolvedPluginPath'!" "Red"
    exit 1
}
Write-Color "[INFO] Cartella Plugin: $ResolvedPluginPath" "Gray"

# -------------------------------------------------------------
# 2. Resolve Superset Path
# -------------------------------------------------------------
$DefaultRemoteCandidate = "C:\Users\admmaps\superset_6_1_0\superset"

if (-not $SupersetPath) {
    $Candidates = @(
        $DefaultRemoteCandidate,
        "D:\Sviluppo\superset",
        (Join-Path $ResolvedPluginPath "..\superset"),
        (Join-Path $ResolvedPluginPath "..\apache-superset"),
        (Join-Path $ResolvedPluginPath "..\superset-6.1.0"),
        (Join-Path $env:USERPROFILE "superset_6_1_0\superset"),
        (Join-Path $env:USERPROFILE "Desktop\superset"),
        (Join-Path $env:USERPROFILE "OneDrive - mapsengineering.com\superset-6.1.0"),
        (Join-Path $env:USERPROFILE "superset"),
        (Join-Path $env:USERPROFILE "Projects\superset"),
        (Join-Path $env:USERPROFILE "dev\superset")
    )

    foreach ($cand in $Candidates) {
        if ($cand -and (Test-Path (Join-Path $cand "superset-frontend\package.json"))) {
            $SupersetPath = (Resolve-Path $cand).Path
            Write-Color "[INFO] Trovata installazione Superset automatica: $SupersetPath" "Green"
            break
        }
    }
}

if (-not $SupersetPath) {
    if ($Force) {
        $SupersetPath = $DefaultRemoteCandidate
    } else {
        Write-Color "Inserisci il percorso della cartella radice di Apache Superset" "Yellow"
        Write-Color "[Default: $DefaultRemoteCandidate]:" "Gray"
        $InputPath = Read-Host "Percorso Superset"
        if ([string]::IsNullOrWhiteSpace($InputPath)) {
            $SupersetPath = $DefaultRemoteCandidate
        } else {
            $SupersetPath = $InputPath.Trim('"', "'").Trim()
        }
    }
}

if (-not (Test-Path $SupersetPath)) {
    Write-Color "[ERRORE] Il percorso specificato '$SupersetPath' non esiste!" "Red"
    Write-Color "Verifica che il percorso punti alla radice di Apache Superset contenente 'superset-frontend'." "Yellow"
    exit 1
}

$ResolvedSupersetPath = (Resolve-Path $SupersetPath).Path
$FrontendDir = Join-Path $ResolvedSupersetPath "superset-frontend"

if (-not (Test-Path (Join-Path $FrontendDir "package.json"))) {
    Write-Color "[ERRORE] 'superset-frontend\package.json' non trovato in '$ResolvedSupersetPath'!" "Red"
    Write-Color "Assicurati di selezionare la cartella principale del repository Superset." "Yellow"
    exit 1
}
Write-Color "[INFO] Cartella Target Superset: $ResolvedSupersetPath" "Green"
Write-Color "[INFO] Cartella superset-frontend: $FrontendDir" "Gray"
Write-Color ""

# -------------------------------------------------------------
# 3. Build Plugin (TypeScript compilation)
# -------------------------------------------------------------
if (-not $SkipBuild) {
    Write-Color "=== FASE 1: Compilazione TypeScript del Plugin ===" "Cyan"
    $NpmCmd = Get-Command "npm" -ErrorAction SilentlyContinue
    if ($NpmCmd) {
        Write-Color "[INFO] Esecuzione 'npm run build' in '$ResolvedPluginPath'..." "Yellow"
        $OrigLoc = Get-Location
        try {
            Set-Location $ResolvedPluginPath
            & $NpmCmd.Source run build
            if ($LASTEXITCODE -eq 0) {
                Write-Color "[SUCCESS] Compilazione TypeScript completata con successo." "Green"
            } else {
                Write-Color "[WARN] 'npm run build' ha restituito codice $LASTEXITCODE. Si prosegue con i file presenti." "Yellow"
            }
        } catch {
            Write-Color "[WARN] Avviso durante compilazione npm: $_" "Yellow"
        } finally {
            Set-Location $OrigLoc
        }
    } else {
        Write-Color "[INFO] 'npm' non rilevato nel PATH. Si prosegue usando dist/src preesistenti." "Gray"
    }
    Write-Color ""
}

# -------------------------------------------------------------
# 4. Copy/Sync Plugin to superset-frontend/plugins
# -------------------------------------------------------------
Write-Color "=== FASE 2: Copia e Sincronizzazione Plugin ===" "Cyan"
$PluginsTargetRoot = Join-Path $FrontendDir "plugins"
if (-not (Test-Path $PluginsTargetRoot)) {
    New-Item -ItemType Directory -Path $PluginsTargetRoot -Force | Out-Null
}

$DestPluginDir = Join-Path $PluginsTargetRoot "superset-plugin-chart-stratum-heatmap"
if (Test-Path $DestPluginDir) {
    Write-Color "[INFO] Pulizia versione precedente in '$DestPluginDir'..." "Yellow"
    try {
        Remove-Item -Recurse -Force $DestPluginDir -ErrorAction Stop
    } catch {
        # Fallback in caso di file bloccati temporaneamente
        Start-Sleep -Milliseconds 300
        Remove-Item -Recurse -Force $DestPluginDir -ErrorAction SilentlyContinue
    }
}

New-Item -ItemType Directory -Path $DestPluginDir -Force | Out-Null

$ItemsToCopy = @("src", "dist", "package.json", "tsconfig.json", "README.md")
foreach ($item in $ItemsToCopy) {
    $srcItem = Join-Path $ResolvedPluginPath $item
    if (Test-Path $srcItem) {
        $destItem = Join-Path $DestPluginDir $item
        $isDir = (Get-Item $srcItem) -is [System.IO.DirectoryInfo]
        if ($isDir) {
            Copy-Item -Path $srcItem -Destination $DestPluginDir -Recurse -Force
            Write-Color "  [+] Copiata cartella: $item" "Gray"
        } else {
            Copy-Item -Path $srcItem -Destination $destItem -Force
            Write-Color "  [+] Copiato file:     $item" "Gray"
        }
    }
}
Write-Color "[SUCCESS] Plugin copiato con successo in '$DestPluginDir'" "Green"
Write-Color ""

# -------------------------------------------------------------
# 5. Safely parse and update MainPreset.ts / MainPreset.js
# -------------------------------------------------------------
Write-Color "=== FASE 3: Registrazione in MainPreset.ts ===" "Cyan"

$PresetCandidates = @(
    (Join-Path $FrontendDir "src\visualizations\presets\MainPreset.ts"),
    (Join-Path $FrontendDir "src\visualizations\presets\MainPreset.js"),
    (Join-Path $FrontendDir "src\setup\setupPlugins.ts"),
    (Join-Path $FrontendDir "src\setup\setupPlugins.js")
)

$PresetFile = $null
foreach ($pf in $PresetCandidates) {
    if (Test-Path $pf) {
        $PresetFile = $pf
        break
    }
}

if (-not $PresetFile) {
    Write-Color "[ERRORE] Impossibile trovare MainPreset.ts o setupPlugins.ts in '$FrontendDir\src'!" "Red"
    exit 1
}

Write-Color "[INFO] File preset individuato: $PresetFile" "Gray"

# 5.1 Backup di sicurezza
$BackupFile = "$PresetFile.bak"
if (-not (Test-Path $BackupFile)) {
    Copy-Item -Path $PresetFile -Destination $BackupFile -Force
    Write-Color "[SUCCESS] Creato backup di sicurezza: $(Split-Path -Leaf $BackupFile)" "Green"
} else {
    Write-Color "[INFO] Backup di sicurezza preesistente mantenuto: $(Split-Path -Leaf $BackupFile)" "Gray"
}

# 5.2 Lettura e parsing
$RawContent = [System.IO.File]::ReadAllText($PresetFile, [System.Text.Encoding]::UTF8)
$NL = if ($RawContent.Contains("`r`n")) { "`r`n" } else { "`n" }

$TargetImport = "import { StratumHeatmapChartPlugin } from '../../../plugins/superset-plugin-chart-stratum-heatmap/src';"
$TargetRegister = "        new StratumHeatmapChartPlugin().configure({ key: 'stratum_heatmap' }).register(),"

# Verifica se il file e' gia' esattamente configurato e privo di duplicati
$hasExactImport = $RawContent.Contains($TargetImport)
$hasExactRegister = $RawContent.Contains("new StratumHeatmapChartPlugin().configure({ key: 'stratum_heatmap' }).register()")
$importCount = ([regex]::Matches($RawContent, "from\s*['`"][^'`"]*superset-plugin-chart-stratum-heatmap")).Count
$registerCount = ([regex]::Matches($RawContent, "new\s+StratumHeatmap")).Count

if ($hasExactImport -and $hasExactRegister -and ($importCount -eq 1) -and ($registerCount -eq 1)) {
    Write-Color "[INFO] MainPreset.ts e' gia' registrato correttamente (idempotente - nessuna modifica necessaria)." "Green"
} else {
    Write-Color "[INFO] Aggiornamento import e registrazione in corso..." "Yellow"

    # Step A: Rimozione di eventuali import obsoleti o duplicati
    $lines = [System.Collections.Generic.List[string]]($RawContent -split "\r?\n")
    $filteredLines = [System.Collections.Generic.List[string]]::new()
    $lastImportIdx = -1

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        # Salta import vecchi o duplicati relativi al plugin
        if ($line -match "from\s*['`"][^'`"]*superset-plugin-chart-stratum-heatmap") {
            continue
        }
        if ($line.Trim().StartsWith("import ")) {
            $lastImportIdx = $filteredLines.Count
        }
        $filteredLines.Add($line)
    }

    # Inserimento del nuovo import subito dopo l'ultimo blocco import
    if ($lastImportIdx -ge 0) {
        $filteredLines.Insert($lastImportIdx + 1, $TargetImport)
    } else {
        $filteredLines.Insert(0, $TargetImport)
    }

    $intermediateContent = $filteredLines -join $NL

    # Step B: Rimozione di registrazioni duplicate e inserimento nel blocco plugins: [
    $regLines = [System.Collections.Generic.List[string]]($intermediateContent -split "\r?\n")
    $finalLines = [System.Collections.Generic.List[string]]::new()
    $pluginsIdx = -1

    for ($i = 0; $i -lt $regLines.Count; $i++) {
        $line = $regLines[$i]
        # Salta eventuali registrazioni precedenti
        if ($line -match 'new\s+StratumHeatmap') {
            continue
        }
        $finalLines.Add($line)
        if ($line -match 'plugins\s*:\s*\[') {
            $pluginsIdx = $finalLines.Count
        }
    }

    if ($pluginsIdx -ge 0) {
        $finalLines.Insert($pluginsIdx, $TargetRegister)
    } else {
        # Fallback se non trova plugins: [
        $finalLines.Add($TargetRegister)
    }

    $NewContent = $finalLines -join $NL
    $Utf8NoBom = [System.Text.UTF8Encoding]::new($false)
    [System.IO.File]::WriteAllText($PresetFile, $NewContent, $Utf8NoBom)

    Write-Color "[SUCCESS] Aggiunto import:       $TargetImport" "Green"
    Write-Color "[SUCCESS] Aggiunta registrazione: $TargetRegister" "Green"
    Write-Color "[SUCCESS] File $(Split-Path -Leaf $PresetFile) aggiornato e salvato con successo." "Green"
}
Write-Color ""

# -------------------------------------------------------------
# 6. Safety Cache Cleanup
# -------------------------------------------------------------
if (-not $SkipCleanCache) {
    Write-Color "=== FASE 4: Pulizia Cache Frontend Webpack ===" "Cyan"
    $CacheItems = @(
        (Join-Path $FrontendDir "node_modules\.cache"),
        (Join-Path $FrontendDir ".temp_cache"),
        (Join-Path $FrontendDir "dist")
    )

    foreach ($item in $CacheItems) {
        if (Test-Path $item) {
            try {
                Remove-Item -Recurse -Force $item -ErrorAction SilentlyContinue
                $parentName = Split-Path -Leaf (Split-Path -Parent $item)
                $leafName = Split-Path -Leaf $item
                Write-Color "  [OK] Eliminata cache: $parentName\$leafName" "Green"
            } catch {
                Write-Color "  [!] Avviso eliminazione $($item): $_" "Yellow"
            }
        }
    }
    Write-Color ""
}

# -------------------------------------------------------------
# 7. Summary & Docker Compose Instructions
# -------------------------------------------------------------
Write-Color "================================================================" "Green"
Write-Color "   INSTALLAZIONE COMPLETATA CON SUCCESSO!                      " "Green"
Write-Color "================================================================" "Green"
Write-Color ""
Write-Color "Riepilogo:" "White"
Write-Color "  - Plugin installato in:  $DestPluginDir" "Gray"
Write-Color "  - Preset aggiornato in:  $PresetFile" "Gray"
Write-Color "  - Import registrato:     import { StratumHeatmapChartPlugin } from '...'" "Gray"
Write-Color "  - Plugin key:            stratum_heatmap" "Gray"
Write-Color ""
Write-Color "ISTRUZIONI PER IL RIAVVIO DI APACHE SUPERSET:" "Yellow"
Write-Color "  Apri un terminale nella cartella di Superset:" "White"
Write-Color "    cd '$ResolvedSupersetPath'" "Cyan"
Write-Color ""
Write-Color "  Opzione 1 (Produzione / Non-Dev - Consigliata):" "White"
Write-Color "    docker compose -f docker-compose-non-dev.yml up -d --build superset" "Green"
Write-Color ""
Write-Color "  Opzione 2 (Sviluppo Frontend con Hot-Reload):" "White"
Write-Color "    docker compose restart superset-node" "Green"
Write-Color "    oppure:" "White"
Write-Color "    docker compose up -d --build superset-node" "Green"
Write-Color ""

if (-not $NoDocker -and -not $Force) {
    $DockerCmd = Get-Command "docker" -ErrorAction SilentlyContinue
    if ($DockerCmd) {
        Write-Color "Vuoi eseguire automaticamente il riavvio del container Docker adesso?" "Cyan"
        Write-Color "  [1] docker compose -f docker-compose-non-dev.yml up -d --build superset" "White"
        Write-Color "  [2] docker compose restart superset-node" "White"
        Write-Color "  [3] Nessuna azione (eseguirò manualmente)" "White"
        $Choice = Read-Host "Scelta [1/2/3, Default: 3]"
        if ($Choice -eq "1") {
            Set-Location $ResolvedSupersetPath
            docker compose -f docker-compose-non-dev.yml up -d --build superset
        } elseif ($Choice -eq "2") {
            Set-Location $ResolvedSupersetPath
            docker compose restart superset-node
        } else {
            Write-Color "[INFO] Nessun comando Docker eseguito. Procedi manualmente quando pronto." "Gray"
        }
    }
}
