/**
 * npm run validate — corre em CI.
 *  1. Valida todo o /data (incluindo exemplos) com JSON Schema + regras semânticas.
 *  2. Valida os snapshots EPREL.
 *  3. Verifica contraste WCAG AA dos tokens de cor.
 */
import { readFileSync } from 'node:fs';
import { carregar, validarSemantica, ficheirosEprel, imprimirProblemas, validadores } from './lib/dados.ts';
import { verificarContraste } from './contraste.ts';

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

process.exit(falhou ? 1 : 0);
