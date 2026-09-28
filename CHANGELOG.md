# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.1] - 2026-09-28

### Added
- Added `xAxisPosition` control in Explore panel supporting `'top'` (Outlook Calendar style) and `'bottom'` (Standard) axis placement.
- Added automatic grid margin calibration (`gridTop` and `gridBottom`) when X-axis labels are positioned at the top.

### Changed
- Default `xAxisPosition` set to `'top'` for seamless calendar and schedule visualization.

## [0.2.0] - 2026-09-21

### Added
- Smart chronological sorting for week days and hourly slots.
- Marginal row and column totals with dynamic aggregation.
- Auto-contrast text calculation using WCAG relative luminance.
- Interactive cross-filtering support via Superset `setDataMask`.
