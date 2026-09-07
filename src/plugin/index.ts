import { ChartMetadata, ChartPlugin, Behavior } from '@superset-ui/core';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';
import thumbnail from '../images/thumbnail.png';
import thumbnailDark from '../images/thumbnail-dark.png';
import example from '../images/example.png';

const t = (str: string) => str;

const metadata = new ChartMetadata({
  name: t('StratumHeatmap — Interactive ECharts Matrix Grid'),
  description: t(
    'A high-performance 2D Heatmap matrix grid powered by Apache ECharts with dual-mode visualMap (continuous & piecewise), auto-contrast cell text, smart chronological sorting for weekdays and hours, and native Superset cross-filtering.',
  ),
  behaviors: [Behavior.InteractiveChart, Behavior.DrillToDetail],
  category: t('Distribution'),
  tags: [
    t('StratumHeatmap'),
    t('Heatmap'),
    t('Matrix'),
    t('ECharts'),
    t('Density'),
    t('Cross-filter'),
    t('Healthcare'),
  ],
  credits: ['Francesco Castaldi'],
  exampleGallery: [{ url: example }],
  thumbnail,
});

export default class StratumHeatmapPlugin extends ChartPlugin {
  constructor() {
    super({
      buildQuery: buildQuery as any,
      controlPanel,
      loadChart: () => import('../components/StratumHeatmap'),
      metadata,
      transformProps: transformProps as any,
    });
  }
}
