import {
  ControlPanelConfig,
  sharedControls,
} from '@superset-ui/chart-controls';

const t = (str: string) => str;

const config: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: t('Query Configuration'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'xAxisDimension',
            config: {
              ...sharedControls.groupby,
              label: t('X-Axis Dimension (Columns)'),
              description: t('Dimension for the horizontal axis (e.g., Giorno della Settimana)'),
              multi: false,
              clearable: false,
            },
          },
        ],
        [
          {
            name: 'yAxisDimension',
            config: {
              ...sharedControls.groupby,
              label: t('Y-Axis Dimension (Rows)'),
              description: t('Dimension for the vertical axis (e.g., Ora o Fascia del Contatto)'),
              multi: false,
              clearable: false,
            },
          },
        ],
        [
          {
            name: 'metric',
            config: {
              ...sharedControls.metric,
              label: t('Metric / Cell Value'),
              description: t('Metric to measure intensity and density (e.g., Volume Prenotazioni)'),
            },
          },
        ],
        ['adhoc_filters'],
        ['row_limit'],
      ],
    },
    {
      label: t('Customize: Palette & Colori'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'linearColorScheme',
            config: {
              type: 'ColorSchemeControl',
              label: t('Color Palette'),
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
              description: t('Select gradient color palette. Defaults to Waves of Blue Corporate.'),
            },
          },
          {
            name: 'reversePalette',
            config: {
              type: 'CheckboxControl',
              label: t('Inverti Scala Colori'),
              renderTrigger: true,
              default: false,
              description: t('Inverte la direzione della scala cromatica (dal più scuro al più chiaro).'),
            },
          },
        ],
        [
          {
            name: 'visualMapMode',
            config: {
              type: 'SelectControl',
              label: t('Modalità Scala Colori'),
              default: 'continuous',
              choices: [
                ['continuous', t('Gradiente Continuo (Smooth Slider)')],
                ['piecewise', t('Classi Discrete a Blocchi (Clickable Legend)')],
              ],
              renderTrigger: true,
              description: t(
                'Scegli tra scala a gradiente continuo uniforme o classi discrete di intervallo.',
              ),
            },
          },
          {
            name: 'piecewiseBuckets',
            config: {
              type: 'SliderControl',
              label: t('Numero Classi Discrete'),
              renderTrigger: true,
              min: 2,
              max: 10,
              step: 1,
              default: 5,
              visibility: ({ controls }: { controls: Record<string, any> }) =>
                Boolean(controls?.visualMapMode?.value === 'piecewise'),
              description: t('Numero di intervalli cromatici discreti quando si usa la modalità a blocchi.'),
            },
          },
        ],
        [
          {
            name: 'customMinValue',
            config: {
              type: 'TextControl',
              label: t('Minimo Scala Personalizzato (Opzionale)'),
              renderTrigger: true,
              default: null,
              description: t('Forza il valore minimo della scala colori (se vuoto usa il minimo reale dei dati).'),
            },
          },
          {
            name: 'customMaxValue',
            config: {
              type: 'TextControl',
              label: t('Massimo Scala Personalizzato (Opzionale)'),
              renderTrigger: true,
              default: null,
              description: t('Forza il valore massimo della scala colori per normalizzare outlier o picchi.'),
            },
          },
        ],
      ],
    },
    {
      label: t('Customize: Stile Celle & Spaziature'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'cellRadius',
            config: {
              type: 'SliderControl',
              label: t('Raggio Angoli Cella (px)'),
              renderTrigger: true,
              min: 0,
              max: 16,
              step: 1,
              default: 4,
              description: t('Arrotondamento degli angoli di ogni singolo blocco della matrice.'),
            },
          },
          {
            name: 'cellBorderWidth',
            config: {
              type: 'SliderControl',
              label: t('Spaziatura / Margine Cella (px)'),
              renderTrigger: true,
              min: 0,
              max: 8,
              step: 1,
              default: 2,
              description: t('Spessore della linea di separazione e spaziatura tra celle contigue.'),
            },
          },
        ],
        [
          {
            name: 'cellBorderColor',
            config: {
              type: 'TextControl',
              label: t('Colore Bordo Separatore Cella'),
              renderTrigger: true,
              default: '#ffffff',
              description: t('Codice colore esadecimale per la griglia di separazione (default #ffffff).'),
            },
          },
          {
            name: 'zeroCellNeutral',
            config: {
              type: 'CheckboxControl',
              label: t('Colore Neutro per Celle a Zero/Vuote'),
              renderTrigger: true,
              default: true,
              description: t('Colora le celle con valore 0 in grigio neutro tenue (#f1f5f9) per distinguerle visivamente.'),
            },
          },
        ],
      ],
    },
    {
      label: t('Customize: Valori & Tipografia'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'showValues',
            config: {
              type: 'CheckboxControl',
              label: t('Mostra Numeri nelle Celle'),
              renderTrigger: true,
              default: true,
              description: t('Visualizza il valore numerico esatto al centro di ogni cella.'),
            },
          },
          {
            name: 'valueFontSize',
            config: {
              type: 'SliderControl',
              label: t('Dimensione Font Valori (px)'),
              renderTrigger: true,
              min: 8,
              max: 18,
              step: 1,
              default: 11,
              visibility: ({ controls }: { controls: Record<string, any> }) =>
                Boolean(controls?.showValues?.value !== false),
              description: t('Dimensione del testo numerico all\'interno delle celle.'),
            },
          },
        ],
        [
          {
            name: 'showZeroValues',
            config: {
              type: 'CheckboxControl',
              label: t('Mostra "0" sulle Celle Vuote'),
              renderTrigger: true,
              default: false,
              visibility: ({ controls }: { controls: Record<string, any> }) =>
                Boolean(controls?.showValues?.value !== false),
              description: t('Se disattivato, le celle con valore 0 rimangono pulite senza numero.'),
            },
          },
          {
            name: 'autoContrastText',
            config: {
              type: 'CheckboxControl',
              label: t('Contrasto Automatico Testo WCAG'),
              renderTrigger: true,
              default: true,
              description: t('Inverte automaticamente il colore del testo (bianco su celle scure, scuro su celle chiare).'),
            },
          },
        ],
        [
          {
            name: 'smartSort',
            config: {
              type: 'CheckboxControl',
              label: t('Ordinamento Cronologico Intelligente'),
              renderTrigger: true,
              default: true,
              description: t('Ordina automaticamente giorni (Lunedì-Domenica) e fasce orarie (00:00-23:00).'),
            },
          },
          {
            name: 'xAxisLabelRotation',
            config: {
              type: 'SelectControl',
              label: t('Rotazione Etichette Asse X'),
              default: 0,
              renderTrigger: true,
              choices: [
                [0, t('0° (Orizzontale)')],
                [30, t('30° (Inclinato)')],
                [45, t('45° (Diagonale)')],
                [90, t('90° (Verticale)')],
              ],
              description: t('Ruota le etichette delle colonne per evitare sovrapposizioni.'),
            },
          },
        ],
        [
          {
            name: 'xAxisSortAsc',
            config: {
              type: 'CheckboxControl',
              label: t('Ordina Asse X Crescente'),
              renderTrigger: true,
              default: true,
              description: t('Direzione di ordinamento delle colonne orizzontali.'),
            },
          },
          {
            name: 'yAxisSortAsc',
            config: {
              type: 'CheckboxControl',
              label: t('Ordina Asse Y Crescente'),
              renderTrigger: true,
              default: true,
              description: t('Direzione di ordinamento delle righe verticali.'),
            },
          },
        ],
      ],
    },
    {
      label: t('Customize: Legenda & Tooltip Interattivo'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'showLegend',
            config: {
              type: 'CheckboxControl',
              label: t('Mostra Barra Legenda Scala Colori'),
              renderTrigger: true,
              default: true,
              description: t('Visualizza la barra gradiente di riferimento valori-colori.'),
            },
          },
          {
            name: 'legendPosition',
            config: {
              type: 'SelectControl',
              label: t('Posizione Legenda'),
              default: 'bottom',
              choices: [
                ['bottom', t('In Basso (Orizzontale)')],
                ['top', t('In Alto (Orizzontale)')],
                ['right', t('A Destra (Verticale)')],
              ],
              renderTrigger: true,
              visibility: ({ controls }: { controls: Record<string, any> }) =>
                Boolean(controls?.showLegend?.value !== false),
              description: t('Posizione e allineamento della barra legenda.'),
            },
          },
        ],
        [
          {
            name: 'showPercentages',
            config: {
              type: 'CheckboxControl',
              label: t('Mostra % Avanzate nel Tooltip'),
              renderTrigger: true,
              default: true,
              description: t('Mostra nel tooltip la % su riga, % su colonna e % sul volume totale.'),
            },
          },
          {
            name: 'emitFilter',
            config: {
              type: 'CheckboxControl',
              label: t('Abilita Cross-Filtering Interattivo'),
              renderTrigger: false,
              default: true,
              description: t('Cliccando su una cella filtra istantaneamente gli altri grafici della dashboard su X e Y.'),
            },
          },
        ],
      ],
    },
  ],
};

export default config;
