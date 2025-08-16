// build.ts
import { SveltePlugin } from 'bun-plugin-svelte';
import { watch } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

build();

watch(path.join(__dirname, 'src'), (event, filename) => {
  if (
    event === 'change' &&
    filename &&
    (filename.endsWith('.ts') || filename.endsWith('.svelte'))
  ) {
    console.log(`${filename} changed`);
    build();
  }
});

function build() {
  Bun.build({
    entrypoints: ['src/index.ts'],
    outdir: 'dist',
    target: 'browser',
    sourcemap: true,
    format: 'esm',
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
}

Bun.serve({
  port: 3000,
  development: true,
  routes: {
    '/dist/*': (req: Request) => {
      const url = new URL(req.url);
      return new Response(Bun.file('./' + url.pathname), {
        headers: {
          'Content-Type': url.pathname.endsWith('.css')
            ? 'text/css'
            : 'application/javascript',
        },
      });
    },
    '/': () => {
      return new Response(Bun.file('./index.html'), {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    },
  },
});

console.log(`Server is running on http://localhost:3000`);
