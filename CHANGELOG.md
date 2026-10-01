# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.2] - 2026-10-02
### Added
- **Smart Annotations**: Introduced a new toggle `showSmartAnnotations` to highlight the absolute highest (🏆 Max) and lowest (📉 Min) values in the heatmap using ECharts `markPoint`.

### Removed
- **Manual Styling Clutter**: Removed technical UI controls (`cellBorderWidth`, `cellBorderColor`, `autoContrastText`, `xAxisLabelRotation`) from the control panel.
- Hardcoded optimal styling (border radius 4px, white borders, automatic text contrast) to ensure the chart looks great by default without user configuration.

## [0.2.1] - 2026-09-01
### Added
- Initial release for the Stratum Heatmap plugin.
