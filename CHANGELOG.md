# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.4] - 2026-10-08
### Changed
- **Internal Refactor (no behavior change)**: Extracted the cell click / cross-filtering logic from `src/plugin/transformProps.ts` into a pure `src/plugin/eventHandlers.ts` module (`resolveActiveCell`, `buildCellFilterClauses`, `computeDataMaskPayload`, `createCellClickHandler`).
- **Internal Refactor (no behavior change)**: Extracted the ECharts option assembly from `src/components/StratumHeatmap.tsx` into a pure `buildHeatmapOption(...)` function in `src/components/buildHeatmapOption.ts`.

### Added
- Unit tests for the extracted event handlers (`test/eventHandlers.test.ts`, 23 cases) and a characterization suite for `buildHeatmapOption` backed by a frozen pre-refactor option fixture (`test/buildHeatmapOption.test.ts`, 9 cases). The 42 pre-existing tests pass unmodified.

## [0.2.3] - 2026-10-07
### Fixed
- **Idempotenza Rigida della Registrazione in `MainPreset.ts`**: La verifica di configurazione esistente in `install-plugin.ps1` e' ora riga-esatta sulla forma canonica `new StratumHeatmapChartPlugin().configure({ key: 'stratum_heatmap' }),`: le varianti legacy con `.register()`, le indentazioni anomale e i duplicati vengono normalizzati alla forma canonica invece di essere considerati gia' configurati.

## [0.2.2] - 2026-10-02
### Added
- **Smart Annotations**: Introduced a new toggle `showSmartAnnotations` to highlight the absolute highest (🏆 Max) and lowest (📉 Min) values in the heatmap using ECharts `markPoint`.

### Removed
- **Manual Styling Clutter**: Removed technical UI controls (`cellBorderWidth`, `cellBorderColor`, `autoContrastText`, `xAxisLabelRotation`) from the control panel.
- Hardcoded optimal styling (border radius 4px, white borders, automatic text contrast) to ensure the chart looks great by default without user configuration.

## [0.2.1] - 2026-09-01
### Added
- Initial release for the Stratum Heatmap plugin.
