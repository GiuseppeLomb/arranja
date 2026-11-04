/**
 * Importa modelos do EPREL (European Product Registry for Energy Labelling).
 *
 *   EPREL_API_KEY=… npm run import:eprel                 # todos os grupos de data/tipos.yaml
 *   EPREL_API_KEY=… npm run import:eprel -- --grupo washingmachines2019 --max-paginas 2
 *
 * - A listagem por grupo (/api/products/{grupo}) exige chave (header x-api-key).
 *   Testado em 2026-11-04: sem chave → 403 {"message":"Forbidden"} (AWS API Gateway).
 *   /api/product-groups e /api/products/{grupo}/{nº registo} respondem sem chave.
 * - Guarda só: marca, identificador, grupo, n.º de registo, eprel_url e datas de mercado.
 * - Páginas de 100, 500 ms entre pedidos, User-Agent identificado com o repositório.
 * - Cada execução SUBSTITUI o snapshot inteiro do grupo (termos da API, art. 4.º §2 f):
 *   correções e remoções feitas no EPREL refletem-se na cópia local.
 *
 * Os dados obtidos regem-se pelos termos da API EPREL, não pela CC BY-NC-SA (ver data/eprel/README.md).
 */
import { mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { RAIZ } from './lib/dados.ts';

const API = 'https://eprel.ec.europa.eu/api';
const TERMOS =
	'https://ec.europa.eu/assets/move-ener/eprel/EPREL%20Public/Public%20API%20Term%20and%20Conditions/API_TERMS_AND_CONDITIONS_EN.pdf';
const PACOTE = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf8')) as { version: string };
const USER_AGENT = `Arranja/${PACOTE.version} (+https://github.com/GiuseppeLomb/arranja; projeto sem fins lucrativos)`;
const TAMANHO_PAGINA = 100;
const PAUSA_MS = 500;
const MAX_TENTATIVAS = 4;

// ---------- Argumentos ----------
const args = process.argv.slice(2);
const arg = (nome: string) => {
	const i = args.indexOf(`--${nome}`);
	return i >= 0 ? args[i + 1] : undefined;
};
const apenasGrupo = arg('grupo');
const maxPaginas = Number(arg('max-paginas') ?? Infinity);
const chave = process.env.EPREL_API_KEY?.trim();

if (!chave) {
	console.error(
		[
			'✗ Falta a variável de ambiente EPREL_API_KEY.',
			'',
			'  A listagem de modelos do EPREL exige uma chave da API pública.',
			'  Pede-a em https://eprel.ec.europa.eu/screen/requestpublicapikey',
			'  e guarda-a como GitHub Secret EPREL_API_KEY (ou numa variável de ambiente local).'
		].join('\n')
	);
	process.exit(2);
}

// ---------- Tipos ----------
interface ProdutoEprel {
	supplierOrTrademark?: string;
	modelIdentifier?: string;
	eprelRegistrationNumber?: string | number;
	registrationNumber?: string | number;
	productGroup?: string;
	status?: string;
	onMarketStartDate?: number[] | string | null;
	onMarketEndDate?: number[] | string | null;
	onMarketFirstStartDate?: number[] | string | null;
}

interface Modelo {
	brand: string;
	model_identifier: string;
	appliance_type: string;
	grupo: string;
	eprel_registration_number: string;
	eprel_url: string;
	mercado_inicio: string | null;
	mercado_fim: string | null;
	source: 'eprel';
}

// ---------- HTTP ----------
const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function pedir(url: string): Promise<unknown> {
	for (let tentativa = 1; ; tentativa++) {
		const r = await fetch(url, {
			headers: { 'x-api-key': chave!, 'User-Agent': USER_AGENT, Accept: 'application/json' }
		});
		if (r.ok) return r.json();
		const corpo = (await r.text()).slice(0, 200);
		const repetir = r.status === 429 || r.status >= 500;
		if (!repetir || tentativa >= MAX_TENTATIVAS) {
			throw new Error(`HTTP ${r.status} em ${url}: ${corpo}`);
		}
		const espera = Number(r.headers.get('retry-after')) * 1000 || 2000 * 2 ** tentativa;
		console.warn(`  ! HTTP ${r.status}, nova tentativa em ${Math.round(espera / 1000)} s`);
		await dormir(espera);
	}
}

/** Extrai a lista de produtos e o total, tolerando variações no formato da resposta. */
function lerPagina(json: unknown): { itens: ProdutoEprel[]; total: number | null } {
	if (Array.isArray(json)) return { itens: json as ProdutoEprel[], total: null };
	const o = json as Record<string, unknown>;
	const itens = (o.hits ?? o.data ?? o.items ?? o.content ?? o.results ?? []) as ProdutoEprel[];
	const total = (o.size ?? o.total ?? o.totalElements ?? o.count ?? null) as number | null;
	return { itens: Array.isArray(itens) ? itens : [], total: typeof total === 'number' ? total : null };
}

/**
 * Nomes dos parâmetros de paginação: a documentação pública não é clara,
 * por isso testamos as variantes conhecidas pedindo 3 resultados e vendo qual é respeitada.
 */
type Params = { pagina: string; tamanho: string; base: 0 | 1 };
const VARIANTES: Params[] = [
	{ pagina: '_page', tamanho: '_limit', base: 1 },
	{ pagina: 'page', tamanho: 'size', base: 1 },
	{ pagina: 'page', tamanho: 'size', base: 0 }
];

async function descobrirParametros(grupo: string): Promise<Params> {
	for (const v of VARIANTES) {
		const url = `${API}/products/${grupo}?${v.pagina}=${v.base}&${v.tamanho}=3`;
		try {
			const { itens } = lerPagina(await pedir(url));
			await dormir(PAUSA_MS);
			if (itens.length === 3) return v;
		} catch (e) {
			console.warn(`  ! variante ${v.pagina}/${v.tamanho} falhou: ${(e as Error).message}`);
			await dormir(PAUSA_MS);
		}
	}
	throw new Error(`não foi possível determinar os parâmetros de paginação para ${grupo}`);
}

// ---------- Normalização ----------
function data(v: number[] | string | null | undefined): string | null {
	if (!v) return null;
	if (Array.isArray(v) && v.length >= 3) {
		const [a, m, d] = v;
		return `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
	}
	if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
	return null;
}

function mapear(p: ProdutoEprel, grupo: string, tipo: string): Modelo | null {
	const brand = p.supplierOrTrademark?.trim();
	const model = p.modelIdentifier?.trim();
	const reg = String(p.eprelRegistrationNumber ?? p.registrationNumber ?? '').trim();
	if (!brand || !model || !/^\d+$/.test(reg)) return null;
	if (p.status && p.status !== 'PUBLISHED') return null;
	return {
		brand,
		model_identifier: model,
		appliance_type: tipo,
		grupo,
		eprel_registration_number: reg,
		eprel_url: `https://eprel.ec.europa.eu/screen/product/${grupo}/${reg}`,
		mercado_inicio: data(p.onMarketStartDate ?? p.onMarketFirstStartDate),
		mercado_fim: data(p.onMarketEndDate),
		source: 'eprel'
	};
}

// ---------- Importação ----------
async function importarGrupo(grupo: string, tipo: string) {
	console.log(`→ ${grupo} (${tipo})`);
	const params = await descobrirParametros(grupo);
	console.log(`  paginação: ${params.pagina}/${params.tamanho} (base ${params.base})`);

	const modelos = new Map<string, Modelo>();
	let total: number | null = null;
	for (let n = 0; n < maxPaginas; n++) {
		const url = `${API}/products/${grupo}?${params.pagina}=${n + params.base}&${params.tamanho}=${TAMANHO_PAGINA}`;
		const pagina = lerPagina(await pedir(url));
		total ??= pagina.total;
		for (const p of pagina.itens) {
			const m = mapear(p, grupo, tipo);
			if (m) modelos.set(m.eprel_registration_number, m);
		}
		if ((n + 1) % 20 === 0) console.log(`  … ${modelos.size} modelos (página ${n + 1}${total ? ` de ~${Math.ceil(total / TAMANHO_PAGINA)}` : ''})`);
		if (pagina.itens.length < TAMANHO_PAGINA) break;
		await dormir(PAUSA_MS);
	}

	const lista = [...modelos.values()].sort(
		(a, b) => a.brand.localeCompare(b.brand, 'en') || a.model_identifier.localeCompare(b.model_identifier, 'en')
	);
	const snapshot = {
		fonte: {
			nome: 'EPREL — European Product Registry for Energy Labelling',
			entidade: 'Comissão Europeia',
			url: 'https://eprel.ec.europa.eu',
			termos: TERMOS,
			obtido_em: new Date().toISOString(),
			aviso:
				'Dados da Comissão Europeia (EPREL), fornecidos pelos fabricantes. Reutilizados ao abrigo dos termos da API EPREL. O Arranja não é afiliado, patrocinado nem aprovado pela Comissão Europeia.'
		},
		grupo,
		appliance_type: tipo,
		total: lista.length,
		modelos: lista
	};

	// Um modelo por linha: diffs legíveis nos PRs mensais.
	const corpo = [
		'{',
		`"fonte":${JSON.stringify(snapshot.fonte)},`,
		`"grupo":${JSON.stringify(grupo)},`,
		`"appliance_type":${JSON.stringify(tipo)},`,
		`"total":${lista.length},`,
		'"modelos":[',
		lista.map((m) => JSON.stringify(m)).join(',\n'),
		']}',
		''
	].join('\n');

	const dir = join(RAIZ, 'data', 'eprel');
	mkdirSync(dir, { recursive: true });
	const destino = join(dir, `${grupo}.json`);
	writeFileSync(`${destino}.tmp`, corpo);
	renameSync(`${destino}.tmp`, destino); // substitui o snapshot por inteiro
	console.log(`  ✓ ${lista.length} modelos → data/eprel/${grupo}.json`);
	return lista.length;
}

const tipos = YAML.parse(readFileSync(join(RAIZ, 'data', 'tipos.yaml'), 'utf8')) as {
	id: string;
	eprel_grupos: { grupo: string }[];
}[];
const alvos = tipos.flatMap((t) => t.eprel_grupos.map((g) => ({ grupo: g.grupo, tipo: t.id }))).filter((a) => !apenasGrupo || a.grupo === apenasGrupo);

if (alvos.length === 0) {
	console.error(`✗ grupo desconhecido: ${apenasGrupo}`);
	process.exit(1);
}

console.log(`EPREL: ${alvos.length} grupo(s), páginas de ${TAMANHO_PAGINA}, ${PAUSA_MS} ms entre pedidos\nUser-Agent: ${USER_AGENT}\n`);
const resumo: string[] = [];
let falhas = 0;
for (const a of alvos) {
	try {
		const n = await importarGrupo(a.grupo, a.tipo);
		resumo.push(`| ${a.tipo} | ${a.grupo} | ${n} |`);
	} catch (e) {
		falhas++;
		console.error(`  ✗ ${a.grupo}: ${(e as Error).message}`);
		resumo.push(`| ${a.tipo} | ${a.grupo} | erro: ${(e as Error).message.slice(0, 80)} |`);
	}
	await dormir(PAUSA_MS);
}

const tabela = ['| Tipo | Grupo EPREL | Modelos |', '|---|---|---|', ...resumo].join('\n');
console.log(`\n${tabela}`);
if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, `## Importação EPREL\n\n${tabela}\n`, { flag: 'a' });
process.exit(falhas ? 1 : 0);
