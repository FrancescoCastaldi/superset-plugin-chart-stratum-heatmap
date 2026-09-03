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
      label: t('Chart Options & Heatmap Aesthetics'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'visualMapMode',
            config: {
              type: 'SelectControl',
              label: t('VisualMap & Color Mode'),
              default: 'continuous',
              choices: [
                ['continuous', t('Continuous Gradient (Smooth Slider)')],
                ['piecewise', t('Piecewise / Discrete Buckets (Clickable Legend)')],
              ],
              renderTrigger: true,
              description: t(
                'Choose between a smooth gradient slider or discrete clickable interval classes.',
              ),
            },
          },
        ],
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
                  label: 'Waves of Blue (IDI Corporate)',
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
              description: t('Select gradient color palette. Defaults to Waves of Blue IDI Corporate.'),
            },
          },
        ],
        [
          {
            name: 'showValues',
            config: {
              type: 'CheckboxControl',
              label: t('Show Cell Numbers'),
              renderTrigger: true,
              default: true,
              description: t('Display the exact numerical metric value inside each heatmap cell.'),
            },
          },
          {
            name: 'showPercentages',
            config: {
              type: 'CheckboxControl',
              label: t('Show % in Tooltip'),
              renderTrigger: true,
              default: true,
              description: t('Display % of row total, % of column total, and % of overall volume.'),
            },
          },
        ],
        [
          {
            name: 'autoContrastText',
            config: {
              type: 'CheckboxControl',
              label: t('Auto WCAG Text Contrast'),
              renderTrigger: true,
              default: true,
              description: t('Automatically flip cell text color (white on dark cells, dark on light cells).'),
            },
          },
          {
            name: 'smartSort',
            config: {
              type: 'CheckboxControl',
              label: t('Smart Chronological Sort'),
              renderTrigger: true,
              default: true,
              description: t('Automatically order Italian/English weekdays (Lunedì-Domenica) and hours (00:00-23:00).'),
            },
          },
        ],
        [
          {
            name: 'cellRadius',
            config: {
              type: 'SliderControl',
              label: t('Cell Corner Radius (px)'),
              renderTrigger: true,
              min: 0,
              max: 12,
              step: 1,
              default: 4,
              description: t('Corner roundness of each cell block.'),
            },
          },
          {
            name: 'cellBorderWidth',
            config: {
              type: 'SliderControl',
              label: t('Cell Gap / Margin (px)'),
              renderTrigger: true,
              min: 0,
              max: 6,
              step: 1,
              default: 2,
              description: t('Separation gap between adjacent cells.'),
            },
          },
        ],
        [
          {
            name: 'emitFilter',
            config: {
              type: 'CheckboxControl',
              label: t('Enable Cross-Filtering (Dashboard Interaction)'),
              renderTrigger: false,
              default: true,
              description: t('Clicking a cell emits filters for both X and Y coordinates to other dashboard charts.'),
            },
          },
        ],
      ],
    },
  ],
};

export default config;
