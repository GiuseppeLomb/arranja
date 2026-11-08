/**
 * Carrega e valida todo o conteúdo de /data.
 * 1) Validação estrutural com JSON Schema (ajv, draft 2020-12) contra /schemas.
 * 2) Validação semântica: referências, segurança, licenças, árvores sem ciclos, etc.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { Ajv2020, type ValidateFunction } from 'ajv/dist/2020.js';
import addFormatsModule from 'ajv-formats';
import YAML from 'yaml';
import type {
	Arvore,
	CodigoErro,
	Familia,
	Ferramenta,
	Guia,
	TipoEletrodomestico,
	AplicavelA,
	Fonte
} from '../../src/lib/data/tipos.ts';

// ajv-formats é CJS; o default pode vir embrulhado.
const addFormats = ((addFormatsModule as unknown as { default?: unknown }).default ??
	addFormatsModule) as (ajv: Ajv2020) => void;

export const RAIZ = join(import.meta.dirname, '..', '..');
export const DATA = join(RAIZ, 'data');
const SCHEMAS = join(RAIZ, 'schemas');

/** Perigos que obrigam a risk_level: proibido. */
export const PERIGOS_PROIBIDOS = ['gas-combustivel', 'gas-refrigerante', 'micro-ondas-interior', 'ligacao-400v'];

/** Domínios cujo conteúdo exige atribuição explícita. */
const DOMINIOS_COM_ATRIBUICAO = ['ifixit.com'];

/** Parâmetros típicos de links de afiliados (proibidos). */
const PARAMS_AFILIADOS = /[?&](tag|aff|affid|affiliate|ref|refid|partner|utm_[a-z]+|clickid|irclickid)=/i;

export interface Marca {
	id: string;
	nome: string;
	site?: string;
	grupo?: string;
	distribuidor?: string;
	pagina_pecas?: string;
	sources?: { url: string; consultado_em: string }[];
	example?: boolean;
}

export interface FontePermitida {
	dominio: string;
	tipo: string;
	descricao: string;
	marcas?: string[];
}

export interface DadosBrutos {
	tipos: TipoEletrodomestico[];
	marcas: Marca[];
	ferramentas: Ferramenta[];
	familias: Familia[];
	guias: Guia[];
	arvores: Arvore[];
	codigos: CodigoErro[];
	fontesPermitidas: FontePermitida[];
}

export interface Problema {
	ficheiro: string;
	mensagem: string;
}

function criarAjv() {
	// strictRequired desligado: os esquemas usam `required` dentro de anyOf/if-then (propriedades definidas no nível acima).
	const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false, allowUnionTypes: true });
	addFormats(ajv);
	for (const f of readdirSync(SCHEMAS).filter((x) => x.endsWith('.json'))) {
		ajv.addSchema(JSON.parse(readFileSync(join(SCHEMAS, f), 'utf8')));
	}
	const base = 'https://github.com/GiuseppeLomb/arranja/schemas/';
	const obter = (n: string) => ajv.getSchema(base + n) as ValidateFunction;
	return {
		ajv,
		tipo: obter('appliance_type.schema.json'),
		marca: obter('brand.schema.json'),
		ferramenta: obter('tool.schema.json'),
		familia: obter('model_family.schema.json'),
		guia: obter('guide.schema.json'),
		arvore: obter('diagnostic_tree.schema.json'),
		codigo: obter('error_code.schema.json'),
		snapshot: obter('eprel_snapshot.schema.json'),
		fontePermitida: obter('allowed_source.schema.json')
	};
}

let _ajv: ReturnType<typeof criarAjv> | null = null;
export function validadores() {
	return (_ajv ??= criarAjv());
}

function lerYaml(caminho: string): unknown {
	return YAML.parse(readFileSync(caminho, 'utf8'), { prettyErrors: true });
}

function ficheirosYaml(dir: string): string[] {
	if (!existsSync(dir)) return [];
	return readdirSync(dir)
		.filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
		.sort()
		.map((f) => join(dir, f));
}

function rel(caminho: string) {
	return caminho.replace(RAIZ, '').replace(/\\/g, '/').replace(/^\//, '');
}

function erroAjv(v: ValidateFunction): string {
	return (v.errors ?? [])
		.map((e) => `${e.instancePath || '(raiz)'} ${e.message}${e.params && 'allowedValues' in e.params ? ` (${(e.params.allowedValues as string[]).join(', ')})` : ''}`)
		.join('; ');
}

/** Carrega todos os ficheiros YAML e valida-os estruturalmente. */
export function carregar(): { dados: DadosBrutos; problemas: Problema[] } {
	const v = validadores();
	const problemas: Problema[] = [];
	const dados: DadosBrutos = { tipos: [], marcas: [], ferramentas: [], familias: [], guias: [], arvores: [], codigos: [], fontesPermitidas: [] };

	function lista<T>(ficheiro: string, validar: ValidateFunction, destino: T[]) {
		let conteudo: unknown;
		try {
			conteudo = lerYaml(ficheiro);
		} catch (e) {
			problemas.push({ ficheiro: rel(ficheiro), mensagem: `YAML inválido: ${(e as Error).message}` });
			return;
		}
		if (conteudo == null) return;
		if (!Array.isArray(conteudo)) {
			problemas.push({ ficheiro: rel(ficheiro), mensagem: 'esperava uma lista' });
			return;
		}
		conteudo.forEach((item, i) => {
			if (validar(item)) destino.push(item as T);
			else problemas.push({ ficheiro: `${rel(ficheiro)}[${i}]`, mensagem: erroAjv(validar) });
		});
	}

	function individual<T extends { id: string }>(ficheiro: string, validar: ValidateFunction, destino: T[]) {
		let item: unknown;
		try {
			item = lerYaml(ficheiro);
		} catch (e) {
			problemas.push({ ficheiro: rel(ficheiro), mensagem: `YAML inválido: ${(e as Error).message}` });
			return;
		}
		if (!validar(item)) {
			problemas.push({ ficheiro: rel(ficheiro), mensagem: erroAjv(validar) });
			return;
		}
		const t = item as T;
		const esperado = basename(ficheiro).replace(/\.ya?ml$/, '');
		if (t.id !== esperado) problemas.push({ ficheiro: rel(ficheiro), mensagem: `o id "${t.id}" tem de ser igual ao nome do ficheiro ("${esperado}")` });
		destino.push(t);
	}

	lista(join(DATA, 'fontes-permitidas.yaml'), v.fontePermitida, dados.fontesPermitidas);
	lista(join(DATA, 'tipos.yaml'), v.tipo, dados.tipos);
	lista(join(DATA, 'brands.yaml'), v.marca, dados.marcas);
	lista(join(DATA, 'ferramentas.yaml'), v.ferramenta, dados.ferramentas);
	for (const f of ficheirosYaml(join(DATA, 'familias'))) lista(f, v.familia, dados.familias);
	for (const f of ficheirosYaml(join(DATA, 'codigos'))) lista(f, v.codigo, dados.codigos);
	for (const f of ficheirosYaml(join(DATA, 'guias'))) individual(f, v.guia, dados.guias);
	for (const f of ficheirosYaml(join(DATA, 'arvores'))) individual(f, v.arvore, dados.arvores);

	return { dados, problemas };
}

/** Validação semântica (referências, regras de segurança, licenças, grafos). */
export function validarSemantica(d: DadosBrutos, hoje = new Date()): Problema[] {
	const p: Problema[] = [];
	const add = (ficheiro: string, mensagem: string) => p.push({ ficheiro, mensagem });

	const unicos = (nome: string, itens: { id: string }[]) => {
		const vistos = new Set<string>();
		for (const i of itens) {
			if (vistos.has(i.id)) add(nome, `id duplicado: ${i.id}`);
			vistos.add(i.id);
		}
	};
	unicos('tipos', d.tipos);
	unicos('marcas', d.marcas);
	unicos('ferramentas', d.ferramentas);
	unicos('familias', d.familias);
	unicos('guias', d.guias);
	unicos('arvores', d.arvores);
	unicos('codigos', d.codigos);

	const tipos = new Set(d.tipos.map((t) => t.id));
	const marcas = new Map(d.marcas.map((m) => [m.id, m]));
	const ferramentas = new Set(d.ferramentas.map((f) => f.id));
	const familias = new Map(d.familias.map((f) => [f.id, f]));
	const guias = new Map(d.guias.map((g) => [g.id, g]));
	const arvores = new Map(d.arvores.map((a) => [a.id, a]));
	const codigos = new Map(d.codigos.map((c) => [c.id, c]));
	const hojeIso = hoje.toISOString().slice(0, 10);

	// Um item real nunca pode depender de conteúdo de exemplo.
	const exemploRef = (onde: string, item: { example?: boolean }, alvo: { example?: boolean } | undefined, desc: string) => {
		if (alvo && alvo.example && !item.example) add(onde, `conteúdo real não pode referir conteúdo de exemplo (${desc})`);
	};

	const verTipo = (onde: string, t: string) => {
		if (!tipos.has(t)) add(onde, `appliance_type desconhecido: ${t}`);
	};

	// Allowlist de domínios (data/fontes-permitidas.yaml). "exemplo" só serve conteúdo marcado example: true.
	const dominioDe = (url: string, exemplo?: boolean): FontePermitida | undefined => {
		let host: string;
		try {
			host = new URL(url).hostname.toLowerCase();
		} catch {
			return undefined;
		}
		return d.fontesPermitidas.find((p) => (host === p.dominio || host.endsWith(`.${p.dominio}`)) && (p.tipo !== 'exemplo' || exemplo));
	};
	// Domínios de retalhistas que alojam cópias de manuais oficiais só valem como fonte com documento_oficial preenchido.
	const ALOJAMENTO = 'alojamento-documento-oficial';
	const verUrl = (onde: string, url: string | undefined, exemplo?: boolean, oque = 'URL') => {
		if (!url) return;
		const p = dominioDe(url, exemplo);
		if (!p) add(onde, `${oque} fora da allowlist de domínios (data/fontes-permitidas.yaml): ${url}`);
		else if (p.tipo === ALOJAMENTO) add(onde, `${oque} num domínio de alojamento de documento oficial só é aceite como fonte com documento_oficial: ${url}`);
	};
	const verFontes = (onde: string, fontes: Fonte[], exemplo?: boolean) => {
		const urls = fontes.map((f) => f.url);
		for (const u of new Set(urls.filter((u, i) => urls.indexOf(u) !== i))) add(onde, `fonte repetida (junta as páginas numa só entrada): ${u}`);
		for (const f of fontes) {
			if (f.consultado_em > hojeIso) add(onde, `consultado_em no futuro: ${f.consultado_em}`);
			const p = dominioDe(f.url, exemplo);
			if (!p) {
				add(onde, `fonte fora da allowlist de domínios (data/fontes-permitidas.yaml): ${f.url}`);
				continue;
			}
			const doc = f.documento_oficial;
			if (p.tipo === ALOJAMENTO && !doc) add(onde, `fonte alojada por retalhista sem documento_oficial: ${f.url}`);
			if (doc) {
				if (!marcas.has(doc.fabricante)) add(onde, `documento_oficial: fabricante desconhecido ${doc.fabricante}`);
				if (doc.modelos_fonte === 'alojamento' && !doc.referencia_documento)
					add(onde, `documento_oficial: modelos indicados pelo retalhista só são aceites com referência impressa no documento: ${f.url}`);
				if (doc.url_alojamento !== f.url) add(onde, `documento_oficial: url_alojamento tem de ser igual ao url da fonte (${f.url})`);
				const pa = dominioDe(doc.url_alojamento, exemplo);
				if (!pa || pa.tipo !== ALOJAMENTO) add(onde, `documento_oficial: url_alojamento tem de estar num domínio de alojamento de documento oficial: ${doc.url_alojamento}`);
			}
		}
	};

	const verRegex = (onde: string, lista: string[] | undefined) => {
		for (const r of lista ?? []) {
			try {
				new RegExp(r);
			} catch (e) {
				add(onde, `regex inválida "${r}": ${(e as Error).message}`);
			}
		}
	};

	const verAplicavel = (onde: string, item: { appliance_type: string; example?: boolean }, regras: AplicavelA[] | undefined, marcaFixa?: string) => {
		for (const r of regras ?? []) {
			if (marcaFixa && r.brand !== marcaFixa) add(onde, `aplicavel_a: a marca tem de ser "${marcaFixa}" (é "${r.brand}")`);
			if (r.brand !== '*') {
				const m = marcas.get(r.brand);
				if (!m) add(onde, `marca desconhecida em aplicavel_a: ${r.brand} (acrescenta-a a data/brands.yaml)`);
				exemploRef(onde, item, m, `marca ${r.brand}`);
			} else if (r.familias || r.prefixos || r.regex || r.modelos) {
				add(onde, 'aplicavel_a: com brand "*" não se podem usar famílias/padrões (são específicos de uma marca)');
			}
			verRegex(onde, r.regex);
			for (const id of r.familias ?? []) {
				const f = familias.get(id);
				if (!f) {
					add(onde, `família desconhecida: ${id}`);
					continue;
				}
				if (f.brand !== r.brand) add(onde, `a família ${id} é da marca ${f.brand}, não ${r.brand}`);
				if (f.appliance_type !== item.appliance_type) add(onde, `a família ${id} é de ${f.appliance_type}, não ${item.appliance_type}`);
				exemploRef(onde, item, f, `família ${id}`);
			}
		}
	};

	for (const m of d.marcas) {
		if (m.pagina_pecas && PARAMS_AFILIADOS.test(m.pagina_pecas)) add(`marcas/${m.id}`, 'pagina_pecas parece ter parâmetros de afiliado/rastreio');
		verUrl(`marcas/${m.id}`, m.site, m.example, 'site');
		verUrl(`marcas/${m.id}`, m.pagina_pecas, m.example, 'pagina_pecas');
		if (m.sources) verFontes(`marcas/${m.id}`, m.sources, m.example);
	}

	for (const f of d.familias) {
		const onde = `familias/${f.id}`;
		verTipo(onde, f.appliance_type);
		const m = marcas.get(f.brand);
		if (!m) add(onde, `marca desconhecida: ${f.brand}`);
		exemploRef(onde, f, m, `marca ${f.brand}`);
		verRegex(onde, f.regex);
		verFontes(onde, f.sources, f.example);
	}

	for (const g of d.guias) {
		const onde = `guias/${g.id}`;
		verTipo(onde, g.appliance_type);
		verAplicavel(onde, g, g.aplicavel_a);
		verFontes(onde, g.sources, g.example);
		verUrl(onde, g.attribution?.url, g.example, 'atribuição');
		for (const t of g.ferramentas) if (!ferramentas.has(t)) add(onde, `ferramenta desconhecida: ${t} (acrescenta-a a data/ferramentas.yaml)`);

		// Segurança: perigos proibidos por defeito
		const proibidos = (g.perigos ?? []).filter((x) => PERIGOS_PROIBIDOS.includes(x));
		if (proibidos.length && g.risk_level !== 'proibido') {
			add(onde, `perigos ${proibidos.join(', ')} obrigam a risk_level: proibido (sem passos)`);
		}

		// Licenças/atribuição de terceiros
		const hosts = g.sources.map((s) => new URL(s.url).hostname);
		const precisaAtribuicao = hosts.some((h) => DOMINIOS_COM_ATRIBUICAO.some((dom) => h === dom || h.endsWith(`.${dom}`)));
		if (precisaAtribuicao) {
			if (!g.attribution) add(onde, 'conteúdo derivado do iFixit: attribution (texto + url da página original) é obrigatória');
			else if (!DOMINIOS_COM_ATRIBUICAO.some((dom) => new URL(g.attribution!.url).hostname.endsWith(dom))) {
				add(onde, 'attribution.url tem de apontar para a página original do iFixit');
			}
		}

		for (const [i, passo] of g.passos.entries()) {
			verUrl(onde, passo.imagem?.fonte_url, g.example, 'origem da imagem');
			if (passo.imagem && !existsSync(join(RAIZ, 'static', passo.imagem.src))) {
				add(onde, `passos[${i}].imagem: ficheiro não encontrado em static/${passo.imagem.src}`);
			}
		}
		for (const peca of g.pecas) {
			if (peca.link_oficial && PARAMS_AFILIADOS.test(peca.link_oficial)) add(onde, `link de peça com parâmetros de afiliado/rastreio: ${peca.link_oficial}`);
			verUrl(onde, peca.link_oficial, g.example, 'link de peça');
		}
		if (g.risk_level === 'proibido' && g.ferramentas.length) add(onde, 'guias proibidos não listam ferramentas');
	}

	for (const a of d.arvores) {
		const onde = `arvores/${a.id}`;
		verTipo(onde, a.appliance_type);
		verAplicavel(onde, a, a.aplicavel_a);
		verFontes(onde, a.sources, a.example);
		for (const c of a.codigos ?? []) {
			const cod = codigos.get(c);
			if (!cod) add(onde, `código de erro desconhecido: ${c}`);
			exemploRef(onde, a, cod, `código ${c}`);
		}

		if (!a.nos[a.inicio]) add(onde, `nó inicial "${a.inicio}" não existe`);
		for (const [id, no] of Object.entries(a.nos)) {
			if (no.tipo === 'pergunta') {
				for (const r of no.respostas) if (!a.nos[r.ir_para]) add(onde, `nó ${id}: resposta "${r.texto}" vai para nó inexistente "${r.ir_para}"`);
			} else if (no.tipo === 'guia') {
				for (const gid of no.guias) {
					const g = guias.get(gid);
					if (!g) add(onde, `nó ${id}: guia desconhecido ${gid}`);
					else if (g.appliance_type !== a.appliance_type) add(onde, `nó ${id}: o guia ${gid} é de outro tipo de eletrodoméstico`);
					exemploRef(onde, a, g, `guia ${gid}`);
				}
			}
		}

		// Ciclos (DFS com cores) e nós inalcançáveis
		const cor = new Map<string, 0 | 1 | 2>();
		const visitar = (id: string, caminho: string[]) => {
			const no = a.nos[id];
			if (!no) return;
			if (cor.get(id) === 1) {
				add(onde, `ciclo: ${[...caminho, id].join(' → ')}`);
				return;
			}
			if (cor.get(id) === 2) return;
			cor.set(id, 1);
			if (no.tipo === 'pergunta') for (const r of no.respostas) visitar(r.ir_para, [...caminho, id]);
			cor.set(id, 2);
		};
		visitar(a.inicio, []);
		for (const id of Object.keys(a.nos)) if (!cor.has(id)) add(onde, `nó inalcançável: ${id}`);
	}

	for (const c of d.codigos) {
		const onde = `codigos/${c.id}`;
		verTipo(onde, c.appliance_type);
		const m = marcas.get(c.brand);
		if (!m) add(onde, `marca desconhecida: ${c.brand}`);
		exemploRef(onde, c, m, `marca ${c.brand}`);
		verAplicavel(onde, c, c.aplicavel_a, c.brand);
		verFontes(onde, c.sources, c.example);
		// Âmbito: um código só vale para os modelos que a fonte documenta.
		const restrita = (r: AplicavelA) => !!(r.familias?.length || r.prefixos?.length || r.regex?.length || r.modelos?.length);
		if (c.ambito === 'modelos') {
			if (!c.aplicavel_a?.length) add(onde, 'ambito "modelos" sem aplicavel_a: indica os modelos/famílias que a fonte documenta');
			for (const r of c.aplicavel_a ?? [])
				if (!restrita(r)) add(onde, 'aplicavel_a sem modelos/famílias/padrões ("toda a marca"): usa ambito "marca" só se a fonte o disser explicitamente');
		} else if (c.aplicavel_a?.length) add(onde, `ambito "${c.ambito}" não leva aplicavel_a (só "modelos")`);
		if (c.arvore) {
			const a = arvores.get(c.arvore);
			if (!a) add(onde, `árvore desconhecida: ${c.arvore}`);
			exemploRef(onde, c, a, `árvore ${c.arvore}`);
		}
		for (const gid of c.guias ?? []) {
			const g = guias.get(gid);
			if (!g) add(onde, `guia desconhecido: ${gid}`);
			exemploRef(onde, c, g, `guia ${gid}`);
		}
	}

	// O mesmo código não pode aparecer duas vezes para a mesma marca + tipo
	const chaves = new Set<string>();
	for (const c of d.codigos) {
		const k = `${c.brand}|${c.appliance_type}|${c.code.toUpperCase()}`;
		if (chaves.has(k) && !c.aplicavel_a) add(`codigos/${c.id}`, `código ${c.code} repetido para ${c.brand} sem aplicavel_a a distinguir`);
		chaves.add(k);
	}

	// Fontes obtidas sem respeitar o robots.txt (data/pendentes-fonte.yaml): cada item que cite um desses domínios tem de
	// estar na lista; em «so_estas_fontes» não pode ter fontes permitidas e em «parcial» tem de ter pelo menos uma.
	const pendentes = join(DATA, 'pendentes-fonte.yaml');
	if (existsSync(pendentes)) {
		type Grupo = { ids?: string[]; dominios?: string[] };
		const doc = YAML.parse(readFileSync(pendentes, 'utf8')) as Record<string, Grupo[] | undefined>;
		const proibidos = (doc.fontes_proibidas ?? []).flatMap((g) => g.dominios ?? []);
		const eProibida = (url: string) => {
			const h = new URL(url).hostname;
			return proibidos.some((d) => h === d || h.endsWith(`.${d}`));
		};
		const itens = new Map<string, { sources: Fonte[] }>([...guias, ...arvores, ...codigos, ...familias]);
		const listados = new Map<string, string>();
		for (const secao of ['substituidas', 'so_estas_fontes', 'parcial'])
			for (const g of doc[secao] ?? [])
				for (const id of g.ids ?? []) {
					const it = itens.get(id);
					if (!it) {
						add('pendentes-fonte.yaml', `${secao}: id desconhecido ${id}`);
						continue;
					}
					listados.set(id, secao);
					const nProib = it.sources.filter((f) => eProibida(f.url)).length;
					const nOk = it.sources.length - nProib;
					if (secao === 'so_estas_fontes' && (nOk > 0 || nProib === 0)) add('pendentes-fonte.yaml', `so_estas_fontes: ${id} não depende só de fontes proibidas`);
					if (secao === 'parcial' && (nOk === 0 || nProib === 0)) add('pendentes-fonte.yaml', `parcial: ${id} tem de ter fontes proibidas e permitidas`);
					if (secao === 'substituidas' && nProib > 0) add('pendentes-fonte.yaml', `substituidas: ${id} ainda cita uma fonte proibida`);
				}
		for (const [id, it] of itens)
			if (it.sources.some((f) => eProibida(f.url)) && !['so_estas_fontes', 'parcial'].includes(listados.get(id) ?? ''))
				add(id, 'cita uma fonte obtida sem respeitar o robots.txt: acrescenta-o a data/pendentes-fonte.yaml ou usa uma fonte permitida');
	}

	return p;
}

/** Lista os snapshots EPREL existentes. */
export function ficheirosEprel(): string[] {
	const dir = join(DATA, 'eprel');
	if (!existsSync(dir)) return [];
	return readdirSync(dir)
		.filter((f) => f.endsWith('.json'))
		.sort()
		.map((f) => join(dir, f));
}

export function imprimirProblemas(problemas: Problema[]) {
	for (const x of problemas) console.error(`  ✗ ${x.ficheiro}: ${x.mensagem}`);
}
