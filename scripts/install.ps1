<#
.SYNOPSIS
    Installer automatico per StratumHeatmap in Apache Superset (Windows PowerShell).
.DESCRIPTION
    Reindirizza ed esegue il nuovo script installer unificato 'install-plugin.ps1'.
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

$RootInstaller = Join-Path (Split-Path -Parent $PSScriptRoot) "install-plugin.ps1"
if (Test-Path $RootInstaller) {
    & $RootInstaller @PSBoundParameters
    exit $LASTEXITCODE
} else {
    Write-Error "Impossibile trovare '$RootInstaller'!"
    exit 1
}
