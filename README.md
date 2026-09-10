# StratumHeatmap — Interactive ECharts Matrix Grid Plugin for Apache Superset

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Author](https://img.shields.io/badge/Author-Francesco%20Castaldi-blueviolet.svg)](#)
[![Apache Superset](https://img.shields.io/badge/Superset-3.x%20%7C%204.x%20%7C%206.x-green.svg)](#)
[![Engine](https://img.shields.io/badge/Engine-Apache%20ECharts%205.x-orange.svg)](#)

> **StratumHeatmap** is an enterprise-grade, high-performance visualization plugin for **Apache Superset** engineered for deep two-dimensional matrix analysis of volume and density distributions (e.g., **Day of Week $\times$ Hour of Day** for healthcare demand planning, call center workload optimization, and capacity management).

---

## 🌟 Key Features

* **Apache ECharts Engine (`echarts/heatmap`):**
  * Smooth 60 fps Canvas rendering with automatic resize observer integration (`ResizeObserver`).
  * Configurable cell borders and border radius (`cellRadius`, `cellBorderWidth`).
* **Dual-Mode VisualMap (Continuous Slider vs Discrete Piecewise):**
  * Continuous mode with an interactive gradient slider to visually filter intensity ranges.
  * Piecewise mode with clickable discrete legend intervals.
* **Native Superset Cross-Filtering (`emit_filter`):**
  * Full support for `Behavior.InteractiveChart`.
  * Clicking any cell in the matrix (e.g., *Thursday 08:00 AM*) instantly emits coordinated filters on both the X-axis and Y-axis columns, dynamically cross-filtering other charts on the dashboard.
* **Integrated Marginal Totals (Row, Column & Grand Totals):**
  * Dedicated summary rows and columns with independent neutral styling and reinforced borders, preserving the matrix heatmap contrast.
  * Supports both Sum and Average aggregations with customizable labels (`Totale`).
  * Intelligent single-dimension cross-filtering (clicking a row total filters only that row across all columns, clicking a column total filters only that column, clicking grand total resets filters).
* **WCAG 2.1 Automated Contrast Calculation:**
  * Real-time relative luminance calculation that inverts in-cell number colors (white text on dark cells, dark navy text on light cells) to guarantee optimal contrast and accessibility.
* **Intelligent Chronological Sorter (`smartSort`):**
  * Automatically recognizes days of the week (Italian and English, e.g., `1 - Lunedì`..`7 - Domenica`, `Mon`..`Sun`, `Monday`..`Sunday`) and hours (`00:00`..`23:00`), ordering them chronologically without requiring SQL sorter workarounds.
* **Multidimensional Rich HTML Tooltips:**
  * Displays `[X × Y]` coordinates, absolute metric values, `% of row total`, `% of column total`, and `% of grand total`.
* **Integrated Corporate Color Palettes:**
  * Defaults to the elegant **Waves of Blue** corporate palette (`#eef4f9` $\to$ `#bcd5ea` $\to$ `#7aa8cf` $\to$ `#3a6a9b` $\to$ `#1c3d5e`), with full support for all Superset color palettes.
* **Gallery Visual Assets:**
  * Bundled `thumbnail.png`, `thumbnail-dark.png`, and `example.png` for the native Superset chart picker modal.

---

## 📁 Repository Structure

```
superset-plugin-chart-stratum-heatmap/
├── package.json
├── tsconfig.json
├── README.md
├── install.bat                         # Unified Windows batch launcher
├── scripts/
│   ├── install.js                      # Cross-platform zero-dependency Node.js installer
│   ├── install.ps1                     # PowerShell installer with cache cleanup
│   ├── installer.py                    # Advanced cross-platform Python installer
│   ├── installer_gui.py                # Desktop GUI installer (Tkinter)
│   └── generate_thumbnails.py          # Thumbnail and gallery asset generator
├── src/
│   ├── index.ts                        # Plugin entry point
│   ├── types.ts                        # TypeScript interfaces
│   ├── plugin/
│   │   ├── index.ts                    # ChartPlugin and ChartMetadata registration
│   │   ├── buildQuery.ts               # Query builder for /api/v1/chart/data
│   │   ├── controlPanel.tsx            # Explore UI form controls
│   │   └── transformProps.ts           # Coordinate mapping, percentages, and min/max
│   ├── components/
│   │   └── StratumHeatmap.tsx          # React component wrapping Apache ECharts
│   ├── utils/
│   │   ├── contrast.ts                 # WCAG luminance and contrast calculation
│   │   ├── sorters.ts                  # Smart chronological days and hours sorter
│   │   └── formatting.ts               # Number and percentage formatters
│   └── images/
│       ├── thumbnail.png               # Chart picker thumbnail (light)
│       ├── thumbnail-dark.png          # Chart picker thumbnail (dark)
│       └── example.png                 # Gallery preview image
```

---

## 🚀 Quick Installation in Apache Superset

The repository includes a suite of automated installation scripts with **auto-detection** for Apache Superset root directories (e.g., `D:\Sviluppo\superset`, sibling `../superset`, user home, or desktop paths):

### Option 1: Desktop GUI Installer (Recommended for Windows)
Simply double-click:
👉 **`install.bat`**  
or launch the GUI via:
```bash
python scripts/installer_gui.py
```
A desktop window will open displaying chart preview, path auto-detection, a *Browse...* folder picker, a Webpack cache cleaning toggle (`node_modules/.cache`), and a real-time console log.

### Option 2: Zero-Dependency Node.js Installer (Cross-Platform)
Pure Node.js script (`fs`, `path`, `readline`, `child_process`), runnable on any system without extra dependencies:
```bash
# Interactive execution with auto-discovery:
node scripts/install.js

# Or specify the path directly:
node scripts/install.js "D:\Sviluppo\superset"
```
Automatically performs:
1. Cleans up any prior plugin registrations in `MainPreset`.
2. Compiles TypeScript sources (`npm run build`).
3. Copies `src`, `dist`, `package.json`, `tsconfig.json`, and `README.md` into the Superset plugins tree.
4. Patches `MainPreset.ts` / `MainPreset.js` (or `setupPlugins.ts`) registering the `stratum_heatmap` key.
5. Cleans `superset-frontend/node_modules/.cache` to prevent stale bundles.
6. Displays ready-to-run Docker commands.

### Option 3: PowerShell Script
Ideal for Windows environments:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/install.ps1

# Or specify the Superset path directly:
powershell -ExecutionPolicy Bypass -File scripts/install.ps1 -SupersetPath "D:\Sviluppo\superset"
```

### Option 4: Python CLI (Cross-Platform)
```bash
# Interactive / Auto-detection:
python scripts/installer.py

# With explicit path:
python scripts/installer.py --superset-path "D:\Sviluppo\superset"
```

---

## 🐳 Post-Installation Docker Compose Commands

Once installed, run the appropriate command in the Superset root directory to build the frontend bundle and start the service:

### Standard / Non-Dev Mode (Production & Staging)
Rebuilds the Superset image with updated frontend plugins and launches containers in the background:
```bash
cd /path/to/superset   # e.g., cd D:\Sviluppo\superset
docker compose -f docker-compose-non-dev.yml up -d --build superset
```

### Frontend Development Mode (Hot Reload on `superset-node`)
If running a development stack with an active `superset-node` container:
```bash
cd /path/to/superset
# Restart the container's Webpack dev server:
docker compose restart superset-node

# Or rebuild the node container:
docker compose up -d --build superset-node
```

### Local Host Development Mode (Without Docker Frontend)
If building the frontend directly on your host machine:
```bash
cd /path/to/superset/superset-frontend
npm run dev-server
```

Once compilation finishes, open your browser at:
👉 **`http://localhost:8088`**  
Create a new chart and select **StratumHeatmap** from the gallery!

---

## 🛠️ Alternative Manual Registration

To register the plugin manually without scripts:

1. Copy the plugin directory into `superset-frontend/plugins/superset-plugin-chart-stratum-heatmap`.
2. Edit `superset-frontend/src/visualizations/presets/MainPreset.ts` (or `MainPreset.js` / `setupPlugins.ts`):

```typescript
import { StratumHeatmapPlugin } from '../../../plugins/superset-plugin-chart-stratum-heatmap/src';

// Inside the plugins array in MainPreset:
new StratumHeatmapPlugin().configure({ key: 'stratum_heatmap' }).register(),
```
3. Remove stale Webpack cache:
```bash
rm -rf superset-frontend/node_modules/.cache
```

---

## 👨‍💻 Author

**Francesco Castaldi**  
*Lead Architect & BI Specialist*  
Repository: [github.com/FrancescoCastaldi/superset-plugin-chart-stratum-heatmap](https://github.com/FrancescoCastaldi/superset-plugin-chart-stratum-heatmap)

---

## 📄 License

Distributed under the **Apache License 2.0**.

