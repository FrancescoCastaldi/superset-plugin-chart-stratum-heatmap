import {
  ControlPanelConfig,
  ControlPanelsContainerProps,
  sharedControls,
} from '@superset-ui/chart-controls';
import { showDurationControl } from './timeMetricHints';

const validateNonEmpty = (value: unknown): string | false =>
  value === null ||
  value === undefined ||
  value === '' ||
  (Array.isArray(value) && value.length === 0)
    ? 'Campo obbligatorio'
    : false;

const isComparing = ({ controls }: ControlPanelsContainerProps) =>
  Boolean(controls?.heatmap_comparison_mode?.value && controls.heatmap_comparison_mode.value !== 'none');

const hasAnyTotals = ({ controls }: ControlPanelsContainerProps) =>
  controls?.showRowTotals?.value !== false || controls?.showColumnTotals?.value !== false;

const config: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: 'Dati',
      expanded: true,
      tabOverride: 'data',
      description: 'Dimensioni di colonne e righe, metrica da misurare, filtri e ordinamento.',
      controlSetRows: [
        [
          {
            name: 'xAxisDimension',
            config: {
              ...sharedControls.groupby,
              label: 'Dimensione asse X (colonne)',
              description:
                'Colonna usata per le intestazioni orizzontali della matrice. Esempio: Giorno della settimana, Mese, Reparto.',
              multi: false,
              clearable: true,
              validators: [validateNonEmpty],
            },
          },
        ],
        [
          {
            name: 'yAxisDimension',
            config: {
              ...sharedControls.groupby,
              label: 'Dimensione asse Y (righe)',
              description:
                'Colonna usata per le etichette verticali della matrice. Esempio: Fascia oraria, Sede, Tipologia di accesso.',
              multi: false,
              clearable: true,
              validators: [validateNonEmpty],
            },
          },
        ],
        [
          {
            name: 'metric',
            config: {
              ...sharedControls.metric,
              label: 'Metrica (valore delle celle)',
              description:
                'Valore numerico o durata visualizzato in ogni cella e usato per la scala colore. Esempi: Accessi, Ricavi, Tempo medio attesa.',
              clearable: true,
              validators: [validateNonEmpty],
            },
          },
        ],
        [
          {
            name: 'smartSort',
            config: {
              type: 'CheckboxControl',
              label: 'Ordinamento cronologico intelligente',
              default: true,
              renderTrigger: true,
              description:
                'Ordina automaticamente giorni della settimana, mesi e orari in sequenza naturale invece che alfabetica. Esempio: Lunedì, Martedì invece di Domenica, Giovedì.',
            },
          },
        ],
        [
          {
            name: 'xAxisSortAsc',
            config: {
              type: 'CheckboxControl',
              label: 'Asse X crescente',
              default: true,
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                controls?.smartSort?.value !== false,
              description:
                'Direzione dell\'ordinamento cronologico sulle colonne (es. Lunedì prima di Domenica).',
            },
          },
          {
            name: 'yAxisSortAsc',
            config: {
              type: 'CheckboxControl',
              label: 'Asse Y crescente',
              default: true,
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                controls?.smartSort?.value !== false,
              description:
                'Direzione dell\'ordinamento cronologico sulle righe (es. 08:00 prima delle 20:00).',
            },
          },
        ],
        ['adhoc_filters'],
        ['row_limit'],
      ],
    },
    {
      label: 'Confronto tra periodi',
      expanded: false,
      tabOverride: 'data',
      description: 'Confronta il periodo principale con un periodo precedente o una seconda metrica.',
      controlSetRows: [
        [
          {
            name: 'heatmap_comparison_mode',
            config: {
              type: 'SelectControl',
              label: 'Modalità di confronto',
              default: 'none',
              clearable: false,
              renderTrigger: false,
              choices: [
                ['none', 'Nessun confronto (singolo periodo)'],
                ['dual_metric', 'Metrica di confronto esplicita (T1 vs T2)'],
                ['time_offsets', 'Calendar Filter o spostamento temporale (__prev)'],
                ['period_column', 'Colonne di confronto già nei dati'],
              ],
              description:
                'Sceglie come ricavare il periodo di confronto. Esempio: usa "Calendar Filter o spostamento temporale" con un filtro calendario in dashboard.',
            },
          },
        ],
        [
          {
            name: 'comparison_metric',
            config: {
              ...sharedControls.metric,
              label: 'Metrica di confronto (T2)',
              description:
                'Seconda metrica da confrontare con la principale. Esempio: accessi_anno_precedente rispetto ad accessi.',
              clearable: true,
              validators: [],
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                controls?.heatmap_comparison_mode?.value === 'dual_metric',
            },
          },
        ],
        [
          {
            name: 'time_1_label',
            config: {
              type: 'TextControl',
              label: 'Nome periodo corrente (T1)',
              default: '',
              renderTrigger: true,
              visibility: isComparing,
              description:
                'Etichetta del periodo di riferimento nell\'intestazione e nel tooltip. Lascia vuoto per usare automaticamente il Calendar Filter. Esempio: Anno corrente.',
            },
          },
          {
            name: 'time_2_label',
            config: {
              type: 'TextControl',
              label: 'Nome periodo di confronto (T2)',
              default: '',
              renderTrigger: true,
              visibility: isComparing,
              description:
                'Etichetta del periodo di confronto nell\'intestazione e nel tooltip. Lascia vuoto per usare automaticamente il Calendar Filter. Esempio: Anno precedente.',
            },
          },
        ],
        [
          {
            name: 'delta_display_type',
            config: {
              type: 'SelectControl',
              label: 'Formato dello scostamento',
              default: 'both',
              clearable: false,
              renderTrigger: true,
              visibility: isComparing,
              choices: [
                ['both', 'Assoluto e percentuale (es. +20 (+20,0%))'],
                ['absolute', 'Solo variazione assoluta (es. +20)'],
                ['percentage', 'Solo variazione percentuale (es. +20,0%)'],
              ],
              description:
                'Sceglie quali componenti della variazione mostrare nelle celle e nei tooltip. Esempio: "+20 (+20,0%)".',
            },
          },
          {
            name: 'delta_color_scale',
            config: {
              type: 'SelectControl',
              label: 'Scala colori per scostamento',
              default: 'bipolar_diverging',
              clearable: false,
              renderTrigger: true,
              visibility: isComparing,
              choices: [
                ['bipolar_diverging', 'Bipolare divergente (Rosso calo / Verde crescita)'],
                ['polarity_inverted', 'Polarità invertita (Verde calo / Rosso crescita)'],
                ['sequential_standard', 'Sequenziale sul valore (ignora delta nel colore)'],
              ],
              description:
                'Colora le celle in base al delta centrato su zero oppure mantiene la scala colore del valore. Esempio: Polarità invertita per tempi di attesa.',
            },
          },
        ],
        [
          {
            name: 'comparisonHighlight',
            config: {
              type: 'CheckboxControl',
              label: 'Vista evidenziata (badge e intestazione T1 vs T2)',
              default: false,
              renderTrigger: true,
              visibility: isComparing,
              description:
                'Mostra l\'intestazione T1 vs T2 ai bordi del grafico, badge direzionali nelle celle e mantiene visibili le celle azzerate in T1 presenti in T2.',
            },
          },
          {
            name: 'zero_baseline_badge_label',
            config: {
              type: 'TextControl',
              label: 'Etichetta per celle con T2 = 0',
              default: 'New',
              renderTrigger: true,
              visibility: isComparing,
              description:
                'Testo mostrato al posto del delta percentuale quando il valore del periodo di confronto è zero. Esempio: "New" o "Nuovo".',
            },
          },
        ],
      ],
    },
    {
      label: 'Formato dei valori',
      expanded: false,
      tabOverride: 'customize',
      description: 'Formattazione numerica e visualizzazione delle metriche temporali (durate).',
      controlSetRows: [
        [
          {
            name: 'numberFormat',
            config: {
              ...sharedControls.y_axis_format,
              label: 'Formato dei numeri',
              default: 'SMART_NUMBER',
              renderTrigger: true,
              clearable: true,
              description:
                'Formato D3 applicato ai numeri in celle, legenda e tooltip. Esempi: SMART_NUMBER, ,.0f, .1%, €,.2f.',
            },
          },
        ],
        [
          {
            name: 'timeDisplayFormat',
            config: {
              type: 'SelectControl',
              label: 'Formato delle durate',
              default: 'auto',
              clearable: false,
              renderTrigger: true,
              visibility: showDurationControl('timeDisplayFormat', 'auto'),
              choices: [
                ['auto', 'Automatico (mm:ss, oppure h:mm:ss da un\'ora)'],
                ['hms', 'Ore, minuti e secondi (1:05:30)'],
                ['ms', 'Minuti e secondi (65:30)'],
                ['minutes', 'Minuti decimali (65,5 min)'],
                ['hours', 'Ore decimali (1,09 h)'],
                ['seconds', 'Secondi (3930 s)'],
              ],
              description:
                'Per metriche di tipo Time: converte i secondi in durata leggibile in celle, legenda e tooltip. Esempio: 12:54.',
            },
          },
          {
            name: 'timeFractionDigits',
            config: {
              type: 'SelectControl',
              label: 'Decimali delle durate',
              default: 0,
              clearable: false,
              renderTrigger: true,
              visibility: showDurationControl('timeFractionDigits', 0),
              choices: [
                [0, 'Nessuno (0)'],
                [1, 'Uno (1)'],
                [2, 'Due (2)'],
                [3, 'Tre (3)'],
              ],
              description:
                'Cifre decimali sui secondi nei formati orologio o sui formati decimali. Esempio: 0 scrive 12:54, 2 scrive 12:54.43.',
            },
          },
        ],
      ],
    },
    {
      label: 'Totali',
      expanded: false,
      tabOverride: 'customize',
      description: 'Riga e colonna dei totali marginali ed eventuale metodo di aggregazione.',
      controlSetRows: [
        [
          {
            name: 'showRowTotals',
            config: {
              type: 'CheckboxControl',
              label: 'Mostra totali di riga',
              default: true,
              renderTrigger: true,
              description:
                'Aggiunge a destra una colonna riepilogativa calcolata su tutte le celle della riga.',
            },
          },
          {
            name: 'showColumnTotals',
            config: {
              type: 'CheckboxControl',
              label: 'Mostra totali di colonna',
              default: true,
              renderTrigger: true,
              description:
                'Aggiunge in basso una riga riepilogativa calcolata su tutte le celle della colonna.',
            },
          },
        ],
        [
          {
            name: 'totalLabel',
            config: {
              type: 'TextControl',
              label: 'Etichetta dei totali',
              default: 'Total',
              renderTrigger: true,
              visibility: hasAnyTotals,
              description:
                'Testo mostrato nell\'intestazione della riga e della colonna di totale. Esempio: Total, Totale, Media.',
            },
          },
          {
            name: 'totalAggregation',
            config: {
              type: 'SelectControl',
              label: 'Aggregazione dei totali',
              default: 'sum',
              clearable: false,
              renderTrigger: true,
              visibility: hasAnyTotals,
              choices: [
                ['sum', 'Somma (totale cumulativo)'],
                ['avg', 'Media (valore medio delle celle)'],
              ],
              description:
                'Metodo per calcolare i totali marginali di metriche numeriche (le metriche Time usano sempre la media). Esempio: Media per tassi percentuali.',
            },
          },
        ],
      ],
    },
    {
      label: 'Aspetto',
      expanded: false,
      tabOverride: 'customize',
      description: 'Palette colori, scala legenda, geometria delle celle, testi e indicatori max/min.',
      controlSetRows: [
        [
          {
            name: 'linearColorScheme',
            config: {
              type: 'ColorSchemeControl',
              label: 'Palette colori',
              default: 'wavesOfBlue',
              renderTrigger: true,
              schemes: () => ({
                wavesOfBlue: {
                  id: 'wavesOfBlue',
                  label: 'Waves of Blue (Corporate)',
                  colors: ['#eef4f9', '#bcd5ea', '#7aa8cf', '#3a6a9b', '#1c3d5e'],
                },
                supersetColors: {
                  id: 'supersetColors',
                  label: 'Superset Standard',
                  colors: ['#f0f4f8', '#90cdf4', '#3182ce', '#1a365d'],
                },
                emeraldHeat: {
                  id: 'emeraldHeat',
                  label: 'Emerald Health',
                  colors: ['#f0fff4', '#9ae6b4', '#38a169', '#1c4532'],
                },
                sunsetWarm: {
                  id: 'sunsetWarm',
                  label: 'Sunset Warmth',
                  colors: ['#fffaf0', '#fbd38d', '#ed8936', '#9c4221'],
                },
              }),
              description:
                'Scala cromatica applicata alle celle in modalità sequenziale. Esempio: Waves of Blue (Corporate).',
            },
          },
        ],
        [
          {
            name: 'reversePalette',
            config: {
              type: 'CheckboxControl',
              label: 'Inverti scala colori',
              default: false,
              renderTrigger: true,
              description:
                'Scambia i colori minimo e massimo (es. scuro sui valori bassi invece che sui valori alti).',
            },
          },
          {
            name: 'zeroCellNeutral',
            config: {
              type: 'CheckboxControl',
              label: 'Sfondo neutro per celle a zero',
              default: true,
              renderTrigger: true,
              description:
                'Usa un grigio neutro sulle celle con valore 0 o mancante per distinguerle dal resto della scala.',
            },
          },
        ],
        [
          {
            name: 'visualMapMode',
            config: {
              type: 'SelectControl',
              label: 'Modalità della scala colori',
              default: 'continuous',
              clearable: false,
              renderTrigger: true,
              choices: [
                ['continuous', 'Gradiente continuo (slider sfumato)'],
                ['piecewise', 'Classi discrete a blocchi (legenda cliccabile)'],
              ],
              description:
                'Sceglie tra gradiente sfumato continuo o fasce discrete selezionabili in legenda.',
            },
          },
          {
            name: 'piecewiseBuckets',
            config: {
              type: 'SliderControl',
              label: 'Numero di classi discrete',
              default: 5,
              min: 2,
              max: 10,
              step: 1,
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                controls?.visualMapMode?.value === 'piecewise',
              description:
                'Numero di fasce discrete quando la modalità è "Classi discrete". Esempio: 5.',
            },
          },
        ],
        [
          {
            name: 'customMinValue',
            config: {
              type: 'TextControl',
              label: 'Minimo scala manuale (opzionale)',
              default: null,
              renderTrigger: true,
              description:
                'Fissa manualmente il minimo della scala colori; lascia vuoto per usare il minimo dei dati. Esempio: 0.',
            },
          },
          {
            name: 'customMaxValue',
            config: {
              type: 'TextControl',
              label: 'Massimo scala manuale (opzionale)',
              default: null,
              renderTrigger: true,
              description:
                'Fissa manualmente il massimo della scala colori; lascia vuoto per usare il massimo dei dati. Esempio: 100.',
            },
          },
        ],
        [
          {
            name: 'cellRadius',
            config: {
              type: 'SliderControl',
              label: 'Arrotondamento angoli cella (px)',
              default: 4,
              min: 0,
              max: 12,
              step: 1,
              renderTrigger: true,
              description:
                'Raggio di curvatura degli angoli delle celle in pixel (0 = squadrate, 4 = arrotondate).',
            },
          },
          {
            name: 'xAxisPosition',
            config: {
              type: 'SelectControl',
              label: 'Posizione asse X (colonne)',
              default: 'top',
              clearable: false,
              renderTrigger: true,
              choices: [
                ['top', 'In alto (stile calendario)'],
                ['bottom', 'In basso (standard)'],
              ],
              description:
                'Posiziona le etichette delle colonne sopra la griglia (stile calendario) o sotto.',
            },
          },
        ],
        [
          {
            name: 'showValues',
            config: {
              type: 'CheckboxControl',
              label: 'Mostra valori nelle celle',
              default: true,
              renderTrigger: true,
              description:
                'Visualizza il numero o la durata all\'interno delle celle della matrice.',
            },
          },
        ],
        [
          {
            name: 'valueFontSize',
            config: {
              type: 'SliderControl',
              label: 'Dimensione font valori (px)',
              default: 11,
              min: 8,
              max: 24,
              step: 1,
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                controls?.showValues?.value !== false,
              description:
                'Dimensione del testo numerico nelle celle in pixel. Esempio: 11.',
            },
          },
          {
            name: 'showZeroValues',
            config: {
              type: 'CheckboxControl',
              label: 'Mostra "0" sulle celle vuote',
              default: false,
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                controls?.showValues?.value !== false,
              description:
                'Scrive lo zero esplicito sulle celle prive di occorrenze invece di lasciarle vuote.',
            },
          },
        ],
        [
          {
            name: 'showSmartAnnotations',
            config: {
              type: 'CheckboxControl',
              label: 'Evidenzia massimo e minimo',
              default: true,
              renderTrigger: true,
              description:
                'Evidenzia automaticamente la cella con il valore massimo e quella con il minimo (esclusi i totali).',
            },
          },
        ],
        [
          {
            name: 'smartAnnotationStyle',
            config: {
              type: 'SelectControl',
              label: 'Stile indicatore max/min',
              default: 'pin',
              clearable: false,
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                controls?.showSmartAnnotations?.value !== false,
              choices: [
                ['pin', 'Pin sopra la cella (classico)'],
                ['cell_badge', 'Badge in alto a destra nella cella'],
                ['none', 'Nessun segno sulle celle'],
              ],
              description:
                'Come segnalare massimo e minimo sulla matrice. Esempio: Badge in alto a destra per celle piccole, oppure Nessun segno insieme al riepilogo in legenda.',
            },
          },
          {
            name: 'showAnnotationLegend',
            config: {
              type: 'CheckboxControl',
              label: 'Riepilogo max/min in legenda',
              default: false,
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                controls?.showSmartAnnotations?.value !== false,
              description:
                'Mostra i valori e le coordinate di massimo e minimo accanto alla legenda colori.',
            },
          },
        ],
        [
          {
            name: 'smartAnnotationThreshold',
            config: {
              type: 'TextControl',
              label: 'Valore minimo per max/min (opzionale)',
              default: null,
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                controls?.showSmartAnnotations?.value !== false,
              description:
                'Esclude dal calcolo di massimo e minimo le celle sotto questa soglia. Esempio: 5 per ignorare valori marginali.',
            },
          },
        ],
        [
          {
            name: 'showLegend',
            config: {
              type: 'CheckboxControl',
              label: 'Mostra barra legenda colori',
              default: true,
              renderTrigger: true,
              description:
                'Mostra la barra della scala cromatica dei valori (o la scala dei delta quando le celle sono colorate per scostamento).',
            },
          },
          {
            name: 'legendPosition',
            config: {
              type: 'SelectControl',
              label: 'Posizione della legenda',
              default: 'bottom',
              clearable: false,
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                controls?.showLegend?.value !== false,
              choices: [
                ['bottom', 'In basso (orizzontale)'],
                ['top', 'In alto (orizzontale)'],
                ['right', 'A destra (verticale)'],
              ],
              description:
                'Posizione della barra legenda intorno alla heatmap. Esempio: In basso.',
            },
          },
        ],
      ],
    },
    {
      label: 'Interazione',
      expanded: false,
      tabOverride: 'customize',
      description: 'Cross-filtering sui clic e contenuto del tooltip al passaggio del mouse.',
      controlSetRows: [
        [
          {
            name: 'emitFilter',
            config: {
              type: 'CheckboxControl',
              label: 'Abilita cross-filtering al clic',
              default: true,
              renderTrigger: false,
              description:
                'Cliccando una cella o un totale emette un filtro verso gli altri grafici della dashboard; un secondo clic lo rimuove.',
            },
          },
        ],
        [
          {
            name: 'showPercentages',
            config: {
              type: 'CheckboxControl',
              label: 'Mostra percentuali su riga e colonna nel tooltip',
              default: true,
              renderTrigger: true,
              description:
                'Mostra nel tooltip il peso percentuale della cella su riga, colonna e totale complessivo. Esempio: 24,5% della riga.',
            },
          },
        ],
      ],
    },
  ],
};

export default config;
