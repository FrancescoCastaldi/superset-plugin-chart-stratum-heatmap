# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-10-29

### Added
- **Legend 🏆 / 📉 as a separate flag** (`showAnnotationLegend`): it can be used together with the marks on the cells (pin or badge) or on its own. The "Position of 🏆 and 📉" selector now has `pin`, `cell_badge` and `none` (no marks on the cells). The `legend` value from 0.3.0 is still read as "no marks + legend", so charts already saved do not change.
- **Minimum value for 🏆 and 📉** (`smartAnnotationThreshold`, optional): cells below the threshold receive neither marks nor legend. Empty = all cells, as before; with 1, empty or zero cells are ignored.
- **Reference comparison / highlighted comparison** (`comparisonHighlight`, off by default): each cell shows the value and a pill with an arrow and the change (▲ +150 (+9.1%), ▼ -85, = 0, or the label of new cells). The legend becomes the scale of changes, with the extreme values, in place of the value scale that did not match the colors. At the top a header appears with the two periods (the labels Time 1 and Time 2) and the meaning of the arrows. The pill adapts to the cell: below the value if it is tall, beside it if it is low and wide, only the arrow if it is small. Cells that dropped to zero still show their label. With the flag off, or without comparison data, the view is the usual one.

## [0.3.0] - 2026-10-29

### Added
- **Position of 🏆 and 📉** (`smartAnnotationStyle`): new selector under "Show Smart Annotations". `pin` keeps the original behavior; `cell_badge` draws a round badge in the top-right corner of the cell, inside its borders and away from the central value, so it does not cover the numbers or spill into the cell above; `legend` removes the marks from the cells and writes two synthetic lines next to the color scale, for example `🏆 Highest: EMOCROMO · 2026-10 (2.4k)` on the left and `📉 Lowest: PRELIEVO VENOSO · 2026-10 (1.4k)` on the right, computed from the current data. With narrow charts, hidden scale or scale on the right the lines stack one below the other, and long names are shortened.

### Fixed
- **Tooltip**: `buildHeatmapOption` used `time1Label` and `time2Label` without reading them from the parameters, causing an error when hovering over an ordinary cell; they are now read.

## [0.2.11] - 2026-10-26

### Changed
- **Non-Blocking Controls (Zero Required Parameters)**: Removed all `validateNonEmpty` constraints and set `clearable: true` and `validators: []` to guarantee full operational flexibility without blocks in the Superset Explore.

## [0.2.10] - 2026-10-26
### Fixed
- **Differential controls**: Automatic hiding of all secondary options of the time comparison (`time_1_label`, `time_2_label`, `delta_display_type`, `delta_color_scale`, `zero_baseline_badge_label`) in Explore when the mode is set to `none`.
- **Dynamic tooltip**: `buildHeatmapOption` now dynamically uses the custom labels `time1Label` and `time2Label` (instead of the hardcoded strings), returning a clean single-metric block when there is no comparison.

## [0.2.9] - 2026-10-26
### Fixed
- **Optional comparison metric**: In `controlPanel.tsx`, moved the `comparison_metric` control into the Time Comparison section, made it optional (clearable, without mandatory validation) and visible only when the comparison mode is set to `dual_metric`.
- **Query Builder**: In `buildQuery.ts`, `comparison_metric` is appended strictly in the `dual_metric` mode only, avoiding two-metric queries when the mode is `none` (single period).
- **Transform Props**: In `transformProps.ts`, activation of `isComparisonActive` and resolution of the comparison metric are constrained to `heatmap_comparison_mode !== 'none'`, ensuring clean rendering and a single-metric visualMap when the comparison is not active.

## [0.2.8] - 2026-10-26
### Added
- **Dual metric comparison matrix**: Support for direct cell-by-cell comparison between two metrics or two time horizons.
- **Diverging bipolar palette (Red, Neutral, Green)**: Cell delta mode with smart annotations for minimum and maximum coordinates, excluding row and column totals.

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
- **Rigid idempotence of the registration in `MainPreset.ts`**: The check for existing configuration in `install-plugin.ps1` now matches the canonical form line by line: `new StratumHeatmapChartPlugin().configure({ key: 'stratum_heatmap' }),`. Legacy variants with `.register()`, anomalous indentation and duplicates are normalized to the canonical form instead of being considered already configured.

## [0.2.2] - 2026-10-02
### Added
- **Smart Annotations**: Introduced a new toggle `showSmartAnnotations` to highlight the absolute highest (🏆 Max) and lowest (📉 Min) values in the heatmap using ECharts `markPoint`.

### Removed
- **Manual Styling Clutter**: Removed technical UI controls (`cellBorderWidth`, `cellBorderColor`, `autoContrastText`, `xAxisLabelRotation`) from the control panel.
- Hardcoded optimal styling (border radius 4px, white borders, automatic text contrast) to ensure the chart looks great by default without user configuration.

## [0.2.1] - 2026-09-01
### Added
- Initial release for the Stratum Heatmap plugin.
