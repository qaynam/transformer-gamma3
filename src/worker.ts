import type { ExportedHandler } from '@cloudflare/workers-types';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // ルートパスまたはSPAのルーティング用
    if (
      pathname === '/' ||
      pathname.startsWith('/app') ||
      !pathname.includes('.')
    ) {
      const indexHtml = await env.ASSETS.fetch(
        new URL('/index.html', request.url)
      );
      return new Response(indexHtml.body, {
        headers: {
          'Content-Type': 'text/html',
          'Cross-Origin-Embedder-Policy': 'require-corp',
          'Cross-Origin-Opener-Policy': 'same-origin',
        },
      });
    }

    // 静的アセットの配信
    try {
      const asset = await env.ASSETS.fetch(request);

      if (asset.status === 200) {
        const response = new Response(asset.body, asset);

        // MIMEタイプの設定
        if (pathname.endsWith('.js')) {
          response.headers.set('Content-Type', 'application/javascript');
        } else if (pathname.endsWith('.css')) {
          response.headers.set('Content-Type', 'text/css');
        } else if (pathname.endsWith('.wasm')) {
          response.headers.set('Content-Type', 'application/wasm');
        }

        // CORSヘッダーの追加
        response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
        response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

        // キャッシュヘッダーの設定
        if (pathname.includes('/dist/') || pathname.match(/\.(js|css|wasm)$/)) {
          response.headers.set(
            'Cache-Control',
            'public, max-age=31536000, immutable'
          );
        }

        return response;
      }
    } catch (error) {
      console.error('Asset fetch error:', error);
    }

    // 404エラー
    return new Response('Not Found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;

interface Env {
  ASSETS: Fetcher;
}
