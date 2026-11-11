# Codemap: Modulo Funzionale: StratumHeatmap Density Matrix Plugin

Mappa architetturale e funzionale di dettaglio per la sottocartella `03_Sviluppo_Software/Repositories/superset-plugins/superset-plugin-chart-stratum-heatmap`.

---

## 🎯 Responsabilita del Modulo

Plugin matrice heatmap e mappe termiche per analisi saturazione agende CUP, carichi di lavoro orari e tempi di processo.

---

## 🌳 Albero & Componenti

| Componente | Ruolo Tecnico |
|:---|:---|
| Sorgenti / Script | Implementazione della logica di dettaglio |
| `src/utils/timeValues.ts` | Metriche Time: lettura di `HH:MM:SS.ffffff` e ISO 8601 in secondi, formati di visualizzazione delle durate |
| `src/plugin/timeMetricHints.ts` | Rileva in Explore se la metrica scelta in Dati e un campo Time, per mostrare i controlli delle durate |
| Specifiche | Parametri di runtime e configurazioni collegate |

---

## 🔄 Integrazione con i Moduli Genitori

Questo modulo funzionale e orchestrato e referenziato dal manifest e dalla codemap della cartella genitore.
