import adapter from '@sveltejs/adapter-static';
import { withPwa } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const dev = process.argv.includes('dev');

/** Base path para GitHub Pages (ex.: "/arranja"). Vazio em desenvolvimento e builds locais. */
const base = dev ? '' : (process.env.BASE_PATH ?? '').replace(/\/$/, '');
const scope = `${base}/`;

/**
 * O script inline de tema em src/app.html corre antes da pintura para evitar flash.
 * Calculamos o seu hash para o permitir na Content-Security-Policy.
 */
const appHtml = readFileSync(new URL('./src/app.html', import.meta.url), 'utf8');
const inline = appHtml.match(/<script>([\s\S]*?)<\/script>/);
const temaHash = inline ? (`sha256-${createHash('sha256').update(inline[1]).digest('base64')}` as const) : null;

export default defineConfig({
	plugins: [
		// withPwa inclui o plugin sveltekit() e gera o service worker (Workbox) depois da pré-renderização.
		withPwa(
			{
				adapter: adapter({
					pages: 'build',
					assets: 'build',
					fallback: '404.html',
					precompress: false,
					strict: true
				}),
				paths: { base: base as '' | `/${string}` },
				prerender: {
					handleHttpError: 'fail',
					handleMissingId: 'fail',
					// Em produção, as rotas de guias/árvores/códigos ficam vazias até haver conteúdo verificado.
					handleUnseenRoutes: 'warn'
				},
				// Privacidade: nenhum pedido a terceiros é permitido a partir do browser.
				csp: dev
					? undefined
					: {
							mode: 'hash',
							directives: {
								'default-src': ['self'],
								'script-src': temaHash ? ['self', temaHash] : ['self'],
								'style-src': ['self', 'unsafe-inline'],
								'img-src': ['self', 'data:', 'blob:'],
								'font-src': ['self'],
								'connect-src': ['self'],
								'worker-src': ['self'],
								'manifest-src': ['self'],
								'object-src': ['none'],
								'base-uri': ['self'],
								'form-action': ['self']
							}
						}
			},
			{
				registerType: 'autoUpdate',
				injectRegister: false,
				scope,
				base: scope,
				// Offline completo inclui /data (modelos EPREL por marca).
				maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
				manifest: {
					id: scope,
					name: 'Arranja — Antes de deitar fora, arranja.',
					short_name: 'Arranja',
					description:
						'Guias de reparação DIY de eletrodomésticos vendidos em Portugal. Sem contas, sem anúncios, sem rastreio.',
					lang: 'pt-PT',
					dir: 'ltr',
					start_url: scope,
					scope,
					display: 'standalone',
					orientation: 'portrait',
					theme_color: '#14302B',
					background_color: '#F6F1E9',
					categories: ['utilities', 'lifestyle', 'education'],
					icons: [
						{ src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
						{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
						{ src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
						{ src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
					]
				},
				generateSW: {
					globPatterns: [
						'client/**/*.{js,css,ico,png,svg,webp,woff2,webmanifest,json}',
						'prerendered/**/*.{html,json}'
					],
					globIgnores: ['**/*-cyrillic*', '**/*-greek*', '**/*-vietnamese*'],
					cleanupOutdatedCaches: true,
					// Todas as rotas reais são pré-renderizadas e entram no precache (URLs limpos).
					// Sem navigateFallback: o 404.html é servido com estado 404 e não pode ser pré-guardado.
					// A query (ex.: /pesquisa?q=…) é ignorada ao procurar no precache.
					ignoreURLParametersMatching: [/.*/]
				},
				devOptions: { enabled: false }
			}
		)
	]
});
