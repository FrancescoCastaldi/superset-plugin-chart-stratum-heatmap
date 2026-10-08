import path from 'node:path';
import { build } from 'esbuild';

// Gallery PNGs are hundreds of KB each: inlining them as data URLs would multiply the bundle size.
// They stay external, pointing at src/images/ (shipped with the package) relative to dist/.
const externalImages = {
  name: 'external-images',
  setup(pluginBuild) {
    pluginBuild.onResolve({ filter: /\.(png|svg)$/ }, (args) => {
      const abs = path.isAbsolute(args.path) ? args.path : path.resolve(args.resolveDir, args.path);
      return {
        path: `../${path.relative(process.cwd(), abs).replace(/\\/g, '/')}`,
        external: true,
      };
    });
  },
};

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'esm',
  target: ['es2020', 'chrome110', 'firefox110', 'safari16'],
  minify: true,
  sourcemap: 'linked',
  // src/ ships with the package, so the map resolves sources without embedding them.
  sourcesContent: false,
  outfile: 'dist/index.esm.js',
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    '@superset-ui/core',
    '@superset-ui/chart-controls',
    'echarts/core',
    'echarts/charts',
    'echarts/components',
    'echarts/renderers',
  ],
  plugins: [externalImages],
  logLevel: 'info',
});
