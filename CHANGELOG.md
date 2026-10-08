# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Changed
- **Build**: `npm run build` now emits only type declarations with `tsc` and bundles the plugin into a single minified ES2020 module (`dist/index.esm.js`, linked source map without embedded sources) through the new `scripts/build.mjs` esbuild driver. React, `@superset-ui/*` and the modular ECharts entry points stay external, gallery images are referenced from `src/images/` instead of being inlined. `dist/` drops from about 125 KB to about 90 KB, and `main`/`module` both point to the bundle.
- **Tree-shaking**: `StratumHeatmap.tsx` imports ECharts from `echarts/core` and registers only what the chart uses (`HeatmapChart`, grid, tooltip, visualMap, markPoint and the canvas renderer) instead of pulling the full `echarts` package. The package is now flagged `"sideEffects": false`.
- **TypeScript**: enabled `noUnusedLocals` and `noUnusedParameters`, removing the unused `React` default import, the unused dark thumbnail import, an unused `BinaryQueryObjectFilterClause` type import and an unread `totalLabel` default in `buildHeatmapOption` (no behavior change).

### Removed
- Unused runtime dependencies `classnames` and `lodash` and the matching `@types/lodash` dev dependency: none of them was imported anywhere in `src/`.

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
