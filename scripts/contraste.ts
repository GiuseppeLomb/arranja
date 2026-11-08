/**
 * Verifica o contraste WCAG 2.x dos pares de cores usados na app,
 * lendo os valores diretamente de src/lib/design/tokens.css (claro e escuro).
 * Texto normal: ≥ 4.5:1. Limites de controlos/elementos gráficos: ≥ 3:1.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ } from './lib/dados.ts';

type Tokens = Record<string, string>;

function extrairBloco(css: string, inicio: string): string {
	const i = css.indexOf(inicio);
	if (i < 0) throw new Error(`bloco não encontrado: ${inicio}`);
	let prof = 0;
	let abriu = -1;
	for (let j = i; j < css.length; j++) {
		if (css[j] === '{') {
			if (prof === 0) abriu = j;
			prof++;
		} else if (css[j] === '}') {
			prof--;
			if (prof === 0) return css.slice(abriu + 1, j);
		}
	}
	throw new Error(`bloco não fechado: ${inicio}`);
}

function lerTokens(bloco: string): Tokens {
	const t: Tokens = {};
	for (const m of bloco.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})\b/gi)) t[m[1]] = m[2].toLowerCase();
	return t;
}

function luminancia(hex: string): number {
	const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
	const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function razao(a: string, b: string): number {
	const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
	return (l1 + 0.05) / (l2 + 0.05);
}

/** [texto/primeiro plano, fundo, mínimo, descrição] */
const PARES: [string, string, number, string][] = [
	['texto', 'fundo', 4.5, 'texto sobre fundo'],
	['texto', 'superficie-1', 4.5, 'texto sobre cartão'],
	['texto', 'superficie-2', 4.5, 'texto sobre chip/campo'],
	['texto', 'superficie-3', 4.5, 'texto sobre chip premido'],
	['texto-suave', 'fundo', 4.5, 'texto secundário sobre fundo'],
	['texto-suave', 'superficie-1', 4.5, 'texto secundário sobre cartão'],
	['texto-suave', 'superficie-2', 4.5, 'texto secundário sobre chip'],
	['primaria', 'fundo', 4.5, 'links/primária sobre fundo'],
	['primaria', 'superficie-1', 4.5, 'links/primária sobre cartão'],
	['sobre-primaria', 'primaria', 4.5, 'texto em botão primário'],
	['sobre-destaque', 'destaque', 4.5, 'texto em botão de destaque (cobre)'],
	['destaque-texto', 'fundo', 4.5, 'texto cobre sobre fundo'],
	['destaque-texto', 'superficie-1', 4.5, 'texto cobre sobre cartão'],
	['foco', 'fundo', 3, 'anel de foco sobre fundo'],
	['foco', 'superficie-1', 3, 'anel de foco sobre cartão'],
	['linha-forte', 'superficie-1', 3, 'limite de campo sobre cartão'],
	['linha-forte', 'fundo', 3, 'limite de campo sobre fundo'],
	['sobre-verificado', 'verificado', 4.5, 'selo "Modelo verificado"'],
	['sobre-risco-baixo', 'risco-baixo', 4.5, 'selo risco baixo'],
	['sobre-risco-medio', 'risco-medio', 4.5, 'selo risco médio'],
	['sobre-risco-alto', 'risco-alto', 4.5, 'selo risco alto'],
	['sobre-risco-proibido', 'risco-proibido', 4.5, 'selo proibido'],
	['texto', 'aviso-fundo', 4.5, 'texto do aviso «fonte por confirmar»'],
	['aviso-icone', 'aviso-fundo', 3, 'ícone do aviso «fonte por confirmar»']
];

export function verificarContraste(): boolean {
	const css = readFileSync(join(RAIZ, 'src', 'lib', 'design', 'tokens.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
	const claro = lerTokens(extrairBloco(css, ':root {'));
	const escuroMedia = lerTokens(extrairBloco(extrairBloco(css, '@media (prefers-color-scheme: dark)'), ":root:not([data-theme='light'])"));
	const escuroManual = lerTokens(extrairBloco(css, ":root[data-theme='dark'] {"));

	let ok = true;
	if (JSON.stringify(escuroMedia) !== JSON.stringify(escuroManual)) {
		ok = false;
		console.error('✗ contraste: os blocos do tema escuro (automático e manual) não são iguais');
	}

	const temas: [string, Tokens][] = [
		['claro', claro],
		['escuro', { ...claro, ...escuroManual }]
	];
	let n = 0;
	for (const [nome, t] of temas) {
		for (const [fg, bg, min, desc] of PARES) {
			if (!t[fg] || !t[bg]) {
				ok = false;
				console.error(`✗ contraste (${nome}): token em falta --${!t[fg] ? fg : bg}`);
				continue;
			}
			const r = razao(t[fg], t[bg]);
			n++;
			if (r < min) {
				ok = false;
				console.error(`✗ contraste (${nome}) ${desc}: ${t[fg]} / ${t[bg]} = ${r.toFixed(2)}:1 (mínimo ${min}:1)`);
			}
		}
	}
	if (ok) console.log(`✓ contraste: ${n} pares WCAG AA verificados (claro + escuro)`);
	return ok;
}

if (process.argv[1]?.endsWith('contraste.ts')) {
	process.exit(verificarContraste() ? 0 : 1);
}
