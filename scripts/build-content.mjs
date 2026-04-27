import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const isWatch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: [join(rootDir, 'content/content.js')],
  bundle: true,
  outfile: join(rootDir, 'content.bundle.js'),
  format: 'iife',
  platform: 'browser',
  target: 'chrome120',
  minify: !isWatch,
};

if (isWatch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  await esbuild.build(buildOptions);
  console.log('Content script bundled successfully!');
}