/**
 * npm run validate — corre em CI.
 *  1. Valida todo o /data (incluindo exemplos) com JSON Schema + regras semânticas.
 *  2. Valida os snapshots EPREL.
 *  3. Verifica contraste WCAG AA dos tokens de cor.
 */
import { readFileSync } from 'node:fs';
import { carregar, validarSemantica, ficheirosEprel, imprimirProblemas, validadores } from './lib/dados.ts';
import { verificarContraste } from './contraste.ts';
import { ILUSTRACOES, LIMITE_BYTES, OBRIGATORIOS, otimizarSvg } from './lib/svg.ts';
import { existsSync } from 'node:fs';
import { basename } from 'node:path';

let falhou = false;

const { dados, problemas } = carregar();
problemas.push(...validarSemantica(dados));
if (problemas.length) {
	falhou = true;
	console.error(`✗ dados: ${problemas.length} problema(s)`);
	imprimirProblemas(problemas);
} else {
	const n = (xs: { example?: boolean }[]) => `${xs.length} (${xs.filter((x) => x.example).length} exemplo)`;
	console.log(
		`✓ dados: ${dados.tipos.length} tipos, ${dados.ferramentas.length} ferramentas, marcas ${n(dados.marcas)}, ` +
			`famílias ${n(dados.familias)}, guias ${n(dados.guias)}, árvores ${n(dados.arvores)}, códigos ${n(dados.codigos)}`
	);
}

const snapshot = validadores().snapshot;
const grupos = new Set(dados.tipos.flatMap((t) => t.eprel_grupos.map((g) => g.grupo)));
const ficheiros = ficheirosEprel();
for (const f of ficheiros) {
	const s = JSON.parse(readFileSync(f, 'utf8')) as { grupo: string };
	if (!snapshot(s)) {
		falhou = true;
		console.error(`✗ ${f}:`, snapshot.errors?.slice(0, 5));
	} else if (!grupos.has(s.grupo)) {
		falhou = true;
		console.error(`✗ ${f}: grupo ${s.grupo} não está em data/tipos.yaml`);
	}
}
console.log(ficheiros.length ? `✓ EPREL: ${ficheiros.length} snapshot(s) válidos` : '• EPREL: sem snapshots (falta EPREL_API_KEY)');

if (!verificarContraste()) falhou = true;

// Ilustrações inline: .min.svg atualizado (svgo), ≤ 60 KB e com os atributos que a app usa.
for (const { fonte, destino } of ILUSTRACOES) {
	const esperado = otimizarSvg(fonte);
	const atual = existsSync(destino) ? readFileSync(destino, 'utf8') : '';
	const nome = basename(destino);
	const emFalta = OBRIGATORIOS.filter((x) => !atual.includes(x));
	if (atual.replaceAll('\r\n', '\n') !== esperado) {
		falhou = true;
		console.error(`✗ ${nome} desatualizado: corre npm run svg`);
	} else if (Buffer.byteLength(atual) > LIMITE_BYTES) {
		falhou = true;
		console.error(`✗ ${nome} tem ${(Buffer.byteLength(atual) / 1024).toFixed(1)} KB (máximo ${LIMITE_BYTES / 1024} KB)`);
	} else if (emFalta.length) {
		falhou = true;
		console.error(`✗ ${nome}: faltam ${emFalta.join(', ')}`);
	} else {
		console.log(`✓ SVG: ${nome} otimizado, ${(Buffer.byteLength(atual) / 1024).toFixed(1)} KB (≤ ${LIMITE_BYTES / 1024} KB)`);
	}
}

process.exit(falhou ? 1 : 0);
