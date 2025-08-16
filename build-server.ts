import { $ } from 'bun';
import { SveltePlugin } from 'bun-plugin-svelte';
import { existsSync } from 'fs';
import { readFileSync, writeFileSync } from 'fs';

async function build() {
  await Bun.build({
    entrypoints: ['src/index.ts'],
    outdir: 'dist',
    target: 'browser',
    sourcemap: true,
    format: 'esm',
    minify: process.env.NODE_ENV === 'production',
    define: {
      'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV),
    },
    plugins: [
      SveltePlugin({
        development: true,
        runes: true,
        forceSide: 'client',
      }),
    ],
  });

  // copy index.html to dist
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
        console.log(
          'index.html の index.css と index.js のパスから ./dist を削除しました'
        );
      } else {
        console.log('index.html のパスに変更はありませんでした');
      }
    } catch (err) {
      console.error('index.html のパス書き換え中にエラーが発生しました:', err);
    }
  } else {
    console.warn(
      'dist/index.html が存在しないため、パスの書き換えをスキップしました'
    );
  }
}

build();
