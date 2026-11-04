/**
 * npm run svg — otimiza as ilustrações inline com svgo (fonte legível → .min.svg).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { relative } from 'node:path';
import { ILUSTRACOES, LIMITE_BYTES, OBRIGATORIOS, otimizarSvg } from './lib/svg.ts';
import { RAIZ } from './lib/dados.ts';

let falhou = false;
for (const { fonte, destino } of ILUSTRACOES) {
	const antes = Buffer.byteLength(readFileSync(fonte, 'utf8'));
	const svg = otimizarSvg(fonte);
	const depois = Buffer.byteLength(svg);
	writeFileSync(destino, svg);
	const emFalta = OBRIGATORIOS.filter((x) => !svg.includes(x));
	console.log(`✓ ${relative(RAIZ, destino)}: ${(antes / 1024).toFixed(1)} KB → ${(depois / 1024).toFixed(1)} KB`);
	if (depois > LIMITE_BYTES) {
		falhou = true;
		console.error(`✗ excede ${LIMITE_BYTES / 1024} KB`);
	}
	if (emFalta.length) {
		falhou = true;
		console.error(`✗ o svgo removeu atributos necessários: ${emFalta.join(', ')}`);
	}
}
process.exit(falhou ? 1 : 0);
