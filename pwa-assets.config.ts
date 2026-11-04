import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config';

// Gera os PNG do manifest e o favicon.ico a partir de static/icone.svg:
//   npm run icons
export default defineConfig({
	headLinkOptions: { preset: '2023' },
	preset: {
		...preset,
		maskable: { ...preset.maskable, padding: 0.3, resizeOptions: { background: '#14302B' } },
		apple: { ...preset.apple, padding: 0.3, resizeOptions: { background: '#14302B' } }
	},
	images: ['static/icone.svg']
});
