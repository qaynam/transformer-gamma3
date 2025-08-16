import { $ } from 'bun';
import { SveltePlugin } from 'bun-plugin-svelte';
import { existsSync } from 'fs';
import { readFileSync, writeFileSync } from 'fs';

async function buildWorker() {
  console.log('Building frontend assets...');

  // フロントエンド用のビルド
  await Bun.build({
    entrypoints: ['src/index.ts'],
    outdir: 'dist',
    target: 'browser',
    sourcemap: 'external',
    format: 'esm',
    minify: process.env.NODE_ENV === 'production',
    define: {
      'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV),
    },
    plugins: [
      SveltePlugin({
        development: process.env.NODE_ENV !== 'production',
        runes: true,
        forceSide: 'client',
      }),
    ],
  });

  // HTMLファイルのコピーと調整
  await $`cp ./index.html ./dist/index.html`.then(() => {
    console.log('index.html copied to dist/index.html');
  });

  if (existsSync('dist/index.html')) {
    try {
      let html = readFileSync('dist/index.html', 'utf-8');
      let replaced = html
        .replace(/\.\/dist\/index\.css/g, './index.css')
        .replace(/\.\/dist\/index\.js/g, './index.js');
      if (html !== replaced) {
        writeFileSync('dist/index.html', replaced, 'utf-8');
        console.log('index.html のパスを調整しました');
      }
    } catch (err) {
      console.error('index.html の調整中にエラーが発生しました:', err);
    }
  }

  console.log('Building Worker...');

  // Worker用のビルド
  await Bun.build({
    entrypoints: ['src/worker.ts'],
    outdir: '.',
    target: 'bun',
    format: 'esm',
    minify: process.env.NODE_ENV === 'production',
  });

  console.log('Build completed!');
}

buildWorker();
