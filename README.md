# StratumHeatmap — Interactive ECharts Matrix Grid Plugin for Apache Superset

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Author](https://img.shields.io/badge/Author-Francesco%20Castaldi-blueviolet.svg)](#)
[![Apache Superset](https://img.shields.io/badge/Superset-3.x%20%7C%204.x%20%7C%206.x-green.svg)](#)
[![Engine](https://img.shields.io/badge/Engine-Apache%20ECharts%205.x-orange.svg)](#)

> **StratumHeatmap** è un plugin di visualizzazione ad alte prestazioni per **Apache Superset** progettato per l'analisi avanzata di matrici bidimensionali di densità e volumi (es. **Giorno della Settimana $\times$ Ora del Contatto** per la programmazione sanitaria e il dimensionamento dei canali di accesso).

---

## 🌟 Caratteristiche Principali

* **Motore Grafico Apache ECharts (`echarts/heatmap`):**
  * Rendering fluido Canvas a 60 fps con gestione automatica del resize (`ResizeObserver`).
  * Bordi e raggio di curvatura delle celle personalizzabili (`cellRadius`, `cellBorderWidth`).
* **Dual Mode VisualMap (Slider Continuo vs Scaglioni):**
  * Modalità Continua con slider interattivo per filtrare visivamente range numerici di intensità.
  * Modalità Piecewise a classi/scaglioni discreti con legenda a blocchi cliccabile.
* **Cross-Filtering Nativo Superset (`emit_filter`):**
  * Pieno supporto a `Behavior.InteractiveChart`.
  * Cliccando su una qualsiasi cella della matrice (es. *Giovedì ore 08:00*), il chart emette istantaneamente il filtro sia sulla colonna X che sulla colonna Y, aggiornando tutti gli altri grafici della dashboard.
* **Algoritmo di Contrasto Automatico WCAG 2.1:**
  * Calcolo in tempo reale della luminanza relativa per invertire il colore del testo dei numeri dentro le celle (testo bianco su celle scure, testo blu scuro su celle chiare) per garantire leggibilità assoluta.
* **Ordinamento Cronologico Intelligente (`smartSort`):**
  * Riconosce automaticamente i giorni della settimana (in italiano o inglese, es. `1 - Lunedì`..`7 - Domenica`, `Lunedì`..`Domenica`, `Mon`..`Sun`) e le ore (`00:00`..`23:00`), ordinandoli cronologicamente senza bisogno di artifici SQL.
* **Rich HTML Tooltip Multidimensionale:**
  * Mostra coordinate `[X × Y]`, valore assoluto, `% sul totale di riga`, `% sul totale di colonna` e `% sul grand total`.
* **Palette Aziendale Integrata:**
  * Default con la palette corporate **Waves of Blue** (`#eef4f9` $\to$ `#bcd5ea` $\to$ `#7aa8cf` $\to$ `#3a6a9b` $\to$ `#1c3d5e`), con supporto a tutte le palette Superset.
* **Anteprima Grafica (Thumbnail Gallery):**
  * Include `thumbnail.png`, `thumbnail-dark.png` ed `example.png` integrati nei metadati per la modale di selezione grafici di Superset.

---

## 📁 Struttura della Repository

```
D:\Sviluppo\superset-plugin-chart-stratum-heatmap/
├── package.json
├── tsconfig.json
├── README.md
├── install.bat
├── scripts/
│   ├── installer.py                    # Installer Python multipiattaforma
│   └── generate_thumbnails.py          # Generatore asset di anteprima grafica
├── src/
│   ├── index.ts                        # Entry point plugin
│   ├── types.ts                        # Interfacce TypeScript
│   ├── plugin/
│   │   ├── index.ts                    # Registrazione ChartPlugin e ChartMetadata
│   │   ├── buildQuery.ts               # Query builder per /api/v1/chart/data
│   │   ├── controlPanel.tsx            # Form controls Explore UI
│   │   └── transformProps.ts           # Mappatura coordinate, percentuali e min/max
│   ├── components/
│   │   └── StratumHeatmap.tsx          # Componente React con Apache ECharts
│   ├── utils/
│   │   ├── contrast.ts                 # Calcolo luminanza e contrasto WCAG
│   │   ├── sorters.ts                  # Ordinatore cronologico giorni e ore
│   │   └── formatting.ts               # Formattazione valori e percentuali
│   └── images/
│       ├── thumbnail.png               # Thumbnail per lista chart Superset
│       ├── thumbnail-dark.png          # Thumbnail per tema scuro
│       └── example.png                 # Immagine di esempio galleria
```

---

## 🚀 Installazione Rapida in Apache Superset

### Metodo 1: Installer Automatico (Consigliato)
Esegui semplicemente:
```cmd
install.bat
```
oppure:
```bash
python scripts/installer.py --superset-path "C:\Users\fracas\Desktop\Settaggi superset"
```

L'installer:
1. Copia i sorgenti in `superset-frontend/plugins/superset-plugin-chart-stratum-heatmap`.
2. Registra automaticamente il plugin in `MainPreset.js` con la chiave `stratum_heatmap`.
3. Crea un backup di sicurezza del file di preset.

### Metodo 2: Registrazione Manuale
Nel file `superset-frontend/src/visualizations/presets/MainPreset.js` (o `setupPlugins.ts`):

```javascript
import { StratumHeatmapPlugin } from '../../../plugins/superset-plugin-chart-stratum-heatmap/src';

// All'interno dell'array plugins:
new StratumHeatmapPlugin().configure({ key: 'stratum_heatmap' }).register(),
```

---

## 👨‍💻 Autore

**Francesco Castaldi**  
*Lead Architect & BI Specialist*  
Repository: [github.com/FrancescoCastaldi/superset-plugin-chart-stratum-heatmap](https://github.com/FrancescoCastaldi/superset-plugin-chart-stratum-heatmap)

---

## 📄 Licenza

Distribuito sotto licenza **Apache 2.0**.
