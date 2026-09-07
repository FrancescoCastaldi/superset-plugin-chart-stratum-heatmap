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
├── install.bat                         # Launcher unificato automatico
├── scripts/
│   ├── install.js                      # Installer Node.js multipiattaforma (zero dipendenze)
│   ├── install.ps1                     # Installer Windows PowerShell con cleanup cache
│   ├── installer.py                    # Installer Python multipiattaforma avanzato
│   ├── installer_gui.py                # Interfaccia grafica Desktop (Tkinter)
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

La repository include una suite completa di installer automatici con **auto-rilevamento** della cartella Superset (es. `D:\Sviluppo\superset`, cartelle sorelle `../superset`, desktop o percorsi utente):

### Opzione 1: Interfaccia Grafica Desktop GUI (Consigliata per Windows)
Fai semplicemente doppio clic su:
👉 **`install.bat`**  
oppure avvia l'interfaccia grafica con:
```bash
python scripts/installer_gui.py
```
Si aprirà una finestra desktop con anteprima del chart, rilevamento automatico del path, pulsante *Sfoglia...*, opzione per la pulizia della cache Webpack (`node_modules/.cache`) e console dei log in tempo reale.

### Opzione 2: Installer Node.js Multipiattaforma (Zero Dipendenze)
Script Node.js puro (`fs`, `path`, `readline`, `child_process`), eseguibile ovunque senza installare librerie esterne:
```bash
# Con auto-rilevamento interattivo della cartella Superset:
node scripts/install.js

# Oppure specificando direttamente il percorso:
node scripts/install.js "D:\Sviluppo\superset"
```
Esegue automaticamente:
1. Pulizia di eventuali vecchie versioni del plugin e deduplicazione delle registrazioni in `MainPreset`.
2. Build TypeScript del plugin (`npm run build`) per verificare e generare `dist/`.
3. Copia pulita e ordinata di `src`, `dist`, `package.json`, `tsconfig.json`, `README.md` escludendo file non necessari.
4. Patch di `MainPreset.ts` / `MainPreset.js` (o `setupPlugins.ts`) con import e registrazione della chiave `stratum_heatmap`.
5. Frontend Safety Cleanup di `superset-frontend/node_modules/.cache` per prevenire bundle stale.
6. Riepilogo comandi Docker pronti all'uso.

### Opzione 3: PowerShell Script
Ideale per ambienti Windows PowerShell senza Python:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/install.ps1

# Oppure specificando la cartella:
powershell -ExecutionPolicy Bypass -File scripts/install.ps1 -SupersetPath "D:\Sviluppo\superset"
```

### Opzione 4: Python CLI Multipiattaforma
```bash
# Esecuzione con auto-rilevamento o interattivo:
python scripts/installer.py

# Con percorso esplicito:
python scripts/installer.py --superset-path "D:\Sviluppo\superset"
```

---

## 🐳 Comandi Docker Compose Post-Installazione

Una volta completata l'installazione tramite uno degli script sopra, esegui i seguenti comandi nella cartella radice di Superset per compilare il bundle frontend e avviare il servizio:

### Modalità Standard / Non-Dev (Produzione & Collaudo)
Ricostruisce l'immagine Superset con il frontend aggiornato e avvia il container in background:
```bash
cd /path/to/superset   # es. cd D:\Sviluppo\superset
docker compose -f docker-compose-non-dev.yml up -d --build superset
```

### Modalità Sviluppo Frontend (Hot Reload su `superset-node`)
Se hai Superset avviato con lo stack di sviluppo e il container `superset-node` attivo:
```bash
cd /path/to/superset
# Riavvia il compilatore Webpack del container frontend
docker compose restart superset-node

# Oppure ricostruisci superset-node:
docker compose up -d --build superset-node
```

### Modalità Sviluppo Locale Host (Senza Docker Frontend)
Se compili il frontend direttamente sulla tua macchina host:
```bash
cd /path/to/superset/superset-frontend
npm run dev-server
```

Una volta terminata la compilazione, apri il browser su:
👉 **`http://localhost:8088`**  
Crea una nuova visualizzazione (Chart) e troverai **StratumHeatmap** nella galleria dei grafici!

---

## 🛠️ Registrazione Manuale Alternativa

Se preferisci effettuare la registrazione a mano senza script:

1. Copia l'intera cartella del plugin in `superset-frontend/plugins/superset-plugin-chart-stratum-heatmap`
2. Modifica `superset-frontend/src/visualizations/presets/MainPreset.ts` (o `MainPreset.js` / `setupPlugins.ts`):

```typescript
import { StratumHeatmapPlugin } from '../../../plugins/superset-plugin-chart-stratum-heatmap/src';

// All'interno dell'array plugins di MainPreset:
new StratumHeatmapPlugin().configure({ key: 'stratum_heatmap' }).register(),
```
3. Rimuovi la cache stale per sicurezza:
```bash
rm -rf superset-frontend/node_modules/.cache
```

---

## 👨‍💻 Autore

**Francesco Castaldi**  
*Lead Architect & BI Specialist*  
Repository: [github.com/FrancescoCastaldi/superset-plugin-chart-stratum-heatmap](https://github.com/FrancescoCastaldi/superset-plugin-chart-stratum-heatmap)

---

## 📄 Licenza

Distribuito sotto licenza **Apache 2.0**.
