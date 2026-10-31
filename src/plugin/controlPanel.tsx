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
              description: t('Dimension for the horizontal axis (e.g., day of the week)'),
              multi: false,
              clearable: true,
              validators: [],
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
              clearable: true,
              validators: [],
            },
          },
        ],
        [
          {
            name: 'metric',
            config: {
              ...sharedControls.metric,
              label: t('Metric / Cell Value'),
              description: t('Metric to measure intensity and density (e.g., booking volume)'),
              clearable: true,
              validators: [],
            },
          },
        ],
        ['adhoc_filters'],
        ['row_limit'],
      ],
    },
    {
      label: t('Time comparison (Time 1 vs Time 2)'),
      expanded: false,
      controlSetRows: [
        [
          {
            name: 'heatmap_comparison_mode',
            config: {
              type: 'SelectControl',
              label: t('Time comparison mode'),
              default: 'none',
              choices: [
                ['none', t('No comparison (single period)')],
                ['dual_metric', t('Explicit comparison metric (Time 1 vs Time 2)')],
                ['time_offsets', t('Time Offsets Nativo Superset (__prev)')],
                ['period_column', t('Period column or anti-Cartesian flag')],
              ],
              renderTrigger: true,
              description: t('Select the comparison mode to show the cell and margin differences.'),
            },
          },
        ],
        [
          {
            name: 'comparison_metric',
            config: {
              ...sharedControls.metric,
              label: t('Comparison metric (Time 2)'),
              description: t('Metric for the dual-metric time comparison (e.g. accessi_conf, ore_erogate_conf).'),
              clearable: true,
              validators: [],
              visibility: ({ controls }: { controls: Record<string, any> }) =>
                Boolean(controls?.heatmap_comparison_mode?.value === 'dual_metric'),
            },
          },
        ],
        [
          {
            name: 'time_1_label',
            config: {
              type: 'TextControl',
              label: t('Time 1 label (reference)'),
              default: 'Time 1 (reference)',
              renderTrigger: true,
              description: t('Name shown for the reference period.'),
              visibility: ({ controls }: { controls: Record<string, any> }) =>
                Boolean(controls?.heatmap_comparison_mode?.value && controls?.heatmap_comparison_mode?.value !== 'none'),
            },
          },
          {
            name: 'time_2_label',
            config: {
              type: 'TextControl',
              label: t('Time 2 label (comparison)'),
              default: 'Time 2 (comparison)',
              renderTrigger: true,
              description: t('Name shown for the comparison period.'),
              visibility: ({ controls }: { controls: Record<string, any> }) =>
                Boolean(controls?.heatmap_comparison_mode?.value && controls?.heatmap_comparison_mode?.value !== 'none'),
            },
          },
        ],
        [
          {
            name: 'delta_display_type',
            config: {
              type: 'SelectControl',
              label: t('Cell difference format'),
              default: 'both',
              choices: [
                ['both', t('Both: value + delta % (e.g. 120 (+20%))')],
                ['absolute', t('Solo Delta Assoluto (es. +20)')],
                ['percentage', t('Solo Delta % (es. +20%)')],
              ],
              renderTrigger: true,
              description: t('How to format values and differences inside the cells.'),
              visibility: ({ controls }: { controls: Record<string, any> }) =>
                Boolean(controls?.heatmap_comparison_mode?.value && controls?.heatmap_comparison_mode?.value !== 'none'),
            },
          },
          {
            name: 'delta_color_scale',
            config: {
              type: 'SelectControl',
              label: t('Difference color scale'),
              default: 'bipolar_diverging',
              choices: [
                ['bipolar_diverging', t('Bipolare Divergente (Rosso / Neutro / Verde)')],
                ['polarity_inverted', t('Inverted polarity (green decrease / red increase)')],
                ['sequential_standard', t('Sequenziale Standard')],
              ],
              renderTrigger: true,
              description: t('Color mapping for the diverging scale centered on 0.'),
              visibility: ({ controls }: { controls: Record<string, any> }) =>
                Boolean(controls?.heatmap_comparison_mode?.value && controls?.heatmap_comparison_mode?.value !== 'none'),
            },
          },
        ],
        [
          {
            name: 'comparisonHighlight',
            config: {
              type: 'CheckboxControl',
              label: t('Highlight the reference / comparison'),
              renderTrigger: true,
              default: false,
              description: t(
                'Each cell shows the value and, below it, a pill with an arrow and the change; the legend becomes the change scale and a header with the two periods appears at the top. Off: the usual view.',
              ),
              visibility: ({ controls }: { controls: Record<string, any> }) =>
                Boolean(controls?.heatmap_comparison_mode?.value && controls?.heatmap_comparison_mode?.value !== 'none'),
            },
          },
        ],
        [
          {
            name: 'zero_baseline_badge_label',
            config: {
              type: 'TextControl',
              label: t('Zero baseline label'),
              default: 'Nuovo',
              renderTrigger: true,
              description: t('Label shown when the comparison period was 0 (e.g. New).'),
              visibility: ({ controls }: { controls: Record<string, any> }) =>
                Boolean(controls?.heatmap_comparison_mode?.value && controls?.heatmap_comparison_mode?.value !== 'none'),
            },
          },
        ],
      ],
    },
    {
      label: t('Customize: palette & colors'),
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
              label: t('Invert color scale'),
              renderTrigger: true,
              default: false,
              description: t('Reverses the direction of the color scale (from darkest to lightest).'),
            },
          },
        ],
        [
          {
            name: 'visualMapMode',
            config: {
              type: 'SelectControl',
              label: t('Color scale mode'),
              default: 'continuous',
              choices: [
                ['continuous', t('Gradiente Continuo (Smooth Slider)')],
                ['piecewise', t('Classi Discrete a Blocchi (Clickable Legend)')],
              ],
              renderTrigger: true,
              description: t(
                'Choose between a continuous gradient scale or discrete range classes.',
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
              description: t('Number of discrete color ranges when using block mode.'),
            },
          },
        ],
        [
          {
            name: 'customMinValue',
            config: {
              type: 'TextControl',
              label: t('Custom scale minimum (optional)'),
              renderTrigger: true,
              default: null,
              description: t('Forces the minimum of the color scale (empty uses the actual data minimum).'),
            },
          },
          {
            name: 'customMaxValue',
            config: {
              type: 'TextControl',
              label: t('Custom scale maximum (optional)'),
              renderTrigger: true,
              default: null,
              description: t('Forces the maximum of the color scale to normalize outliers or peaks.'),
            },
          },
        ],
      ],
    },
    {
      label: t('Customize: cell style & spacing'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'cellRadius',
            config: {
              type: 'SliderControl',
              label: t('Cell corner radius (px)'),
              renderTrigger: true,
              min: 0,
              max: 16,
              step: 1,
              default: 4,
              description: t('Rounding of the corners of each matrix block.'),
            },
          },
          {
            name: 'showSmartAnnotations',
            config: {
              type: 'CheckboxControl',
              label: t('Show smart annotations (max/min)'),
              renderTrigger: true,
              default: true,
              description: t('Automatically highlights the cells with the highest 🏆 and lowest 📉 absolute value.'),
            },
          },
          {
            name: 'smartAnnotationStyle',
            config: {
              type: 'SelectControl',
              label: t('Position of 🏆 and 📉'),
              renderTrigger: true,
              default: 'pin',
              clearable: false,
              choices: [
                ['pin', t('Pin above the cell (classic)')],
                ['cell_badge', t('Badge in the top-right corner of the cell')],
                ['none', t('No mark on the cells')],
              ],
              description: t(
                'Pin: mark above the cell, as before. Badge: circle in the top-right corner of the cell, inside its borders and away from the value. No mark: the cells stay clean, useful together with the legend.',
              ),
              visibility: ({ controls }: { controls: Record<string, any> }) =>
                controls?.showSmartAnnotations?.value !== false,
            },
          },
          {
            name: 'showAnnotationLegend',
            config: {
              type: 'CheckboxControl',
              label: t('🏆 / 📉 legend next to the color scale'),
              renderTrigger: true,
              default: false,
              description: t(
                'Writes next to the color scale which cell has the highest 🏆 and which the lowest 📉 value. It can be used together with the marks on the cells.',
              ),
              visibility: ({ controls }: { controls: Record<string, any> }) =>
                controls?.showSmartAnnotations?.value !== false,
            },
          },
          {
            name: 'smartAnnotationThreshold',
            config: {
              type: 'TextControl',
              label: t('Minimum value for 🏆 and 📉 (optional)'),
              renderTrigger: true,
              default: null,
              description: t(
                'Cells below this value get no marks or legend. Leave empty to consider all of them; set 1 to ignore empty or zero cells.',
              ),
              visibility: ({ controls }: { controls: Record<string, any> }) =>
                controls?.showSmartAnnotations?.value !== false,
            },
          },
        ],
        [
          {
            name: 'zeroCellNeutral',
            config: {
              type: 'CheckboxControl',
              label: t('Neutral color for zero or empty cells'),
              renderTrigger: true,
              default: true,
              description: t('Colors the cells with value 0 in a faint neutral grey (#f1f5f9) to tell them apart.'),
            },
          },
        ],
      ],
    },
    {
      label: t('Customize: values & typography'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'showValues',
            config: {
              type: 'CheckboxControl',
              label: t('Show numbers in the cells'),
              renderTrigger: true,
              default: true,
              description: t('Shows the exact numeric value in the center of each cell.'),
            },
          },
          {
            name: 'valueFontSize',
            config: {
              type: 'SliderControl',
              label: t('Value font size (px)'),
              renderTrigger: true,
              min: 8,
              max: 18,
              step: 1,
              default: 11,
              visibility: ({ controls }: { controls: Record<string, any> }) =>
                Boolean(controls?.showValues?.value !== false),
              description: t('Size of the numeric text inside the cells.'),
            },
          },
        ],
        [
          {
            name: 'showZeroValues',
            config: {
              type: 'CheckboxControl',
              label: t('Show "0" on empty cells'),
              renderTrigger: true,
              default: false,
              visibility: ({ controls }: { controls: Record<string, any> }) =>
                Boolean(controls?.showValues?.value !== false),
              description: t('When off, cells with value 0 stay clean, with no number.'),
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
              description: t('Sorts days (Monday to Sunday) and time slots (00:00-23:00) automatically.'),
            },
          },
          {
            name: 'xAxisPosition',
            config: {
              type: 'SelectControl',
              label: t('X axis position (days/columns)'),
              default: 'top',
              renderTrigger: true,
              choices: [
                ['top', t('In alto (Stile Calendario / Outlook)')],
                ['bottom', t('In basso (Standard)')],
              ],
              description: t('Choose whether to place the days and columns at the top or at the bottom.'),
            },
          },
        ],
        [
          {
            name: 'xAxisSortAsc',
            config: {
              type: 'CheckboxControl',
              label: t('Sort X axis ascending'),
              renderTrigger: true,
              default: true,
              description: t('Sort direction of the horizontal columns.'),
            },
          },
          {
            name: 'yAxisSortAsc',
            config: {
              type: 'CheckboxControl',
              label: t('Sort Y axis ascending'),
              renderTrigger: true,
              default: true,
              description: t('Sort direction of the vertical rows.'),
            },
          },
        ],
      ],
    },
    {
      label: t('Customize: legend & interactive tooltip'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'showLegend',
            config: {
              type: 'CheckboxControl',
              label: t('Show color scale legend bar'),
              renderTrigger: true,
              default: true,
              description: t('Shows the value-to-color gradient reference bar.'),
            },
          },
          {
            name: 'legendPosition',
            config: {
              type: 'SelectControl',
              label: t('Legend position'),
              default: 'bottom',
              choices: [
                ['bottom', t('In Basso (Orizzontale)')],
                ['top', t('In Alto (Orizzontale)')],
                ['right', t('A Destra (Verticale)')],
              ],
              renderTrigger: true,
              visibility: ({ controls }: { controls: Record<string, any> }) =>
                Boolean(controls?.showLegend?.value !== false),
              description: t('Position and alignment of the legend bar.'),
            },
          },
        ],
        [
          {
            name: 'showPercentages',
            config: {
              type: 'CheckboxControl',
              label: t('Show advanced % in the tooltip'),
              renderTrigger: true,
              default: true,
              description: t('Shows in the tooltip the % of the row, the % of the column and the % of the total volume.'),
            },
          },
          {
            name: 'emitFilter',
            config: {
              type: 'CheckboxControl',
              label: t('Abilita Cross-Filtering Interattivo'),
              renderTrigger: false,
              default: true,
              description: t('Clicking a cell instantly filters the other dashboard charts by X and Y.'),
            },
          },
        ],
      ],
    },
    {
      label: t('Customize: row & column totals (marginal totals)'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'showRowTotals',
            config: {
              type: 'CheckboxControl',
              label: t('Show row totals column'),
              renderTrigger: true,
              default: true,
              description: t('Adds a summary column on the right with each row's total.'),
            },
          },
          {
            name: 'showColumnTotals',
            config: {
              type: 'CheckboxControl',
              label: t('Show column totals row'),
              renderTrigger: true,
              default: true,
              description: t('Adds a summary row at the bottom with each column's total.'),
            },
          },
        ],
        [
          {
            name: 'totalLabel',
            config: {
              type: 'TextControl',
              label: t('Total label'),
              renderTrigger: true,
              default: 'Total',
              description: t('Text shown for the row and column total headers (e.g. Total, Sum).'),
            },
          },
          {
            name: 'totalAggregation',
            config: {
              type: 'SelectControl',
              label: t('Tipo Aggregazione Totali'),
              default: 'sum',
              choices: [
                ['sum', t('Sum (cumulative total)')],
                ['avg', t('Average (mean value)')],
              ],
              renderTrigger: true,
              description: t('Aggregation method used to compute the row and column marginal totals.'),
            },
          },
        ],
      ],
    },
  ],
};

export default config;
