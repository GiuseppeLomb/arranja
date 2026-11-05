import Fuse from 'fuse.js';
import { conteudo, marcas, nomeMarca, nomeTipo, tipos } from './conteudo';
import { normalizarModelo, normalizarTexto, slugMarca } from './normalizar';
import { testarFamilia } from './correspondencia';
import { carregarModelos, pesquisarModelos } from './modelos';
import type { ModeloSelecionado } from '#lib/estado/selecao.svelte.ts';

export type TipoResultado = 'codigo' | 'arvore' | 'guia' | 'familia' | 'modelo' | 'marca';

export interface Resultado {
	chave: string;
	tipo: TipoResultado;
	titulo: string;
	subtitulo: string;
	/** Rota de destino (sem base path). */
	rota?: string;
	/** Seleção a aplicar antes de ir para o fluxo guiado. */
	selecao?: { tipo: string; marca: { id: string; nome: string }; modelo: ModeloSelecionado | null | undefined };
	exemplo?: boolean;
}

interface Doc {
	tipo: 'codigo' | 'arvore' | 'guia';
	id: string;
	marcas: string[];
	codigo?: string;
	textos: string;
	titulo: string;
	subtitulo: string;
	rota: string;
	exemplo?: boolean;
}

let indice: { fuse: Fuse<Doc>; docs: Doc[] } | null = null;

function construir() {
	const docs: Doc[] = [];
	for (const c of conteudo.codigos) {
		docs.push({
			tipo: 'codigo',
			id: c.id,
			marcas: [c.brand],
			codigo: [c.code, ...(c.aliases ?? [])].map(normalizarModelo).join(' '),
			textos: normalizarTexto(`${c.code} ${(c.aliases ?? []).join(' ')} ${nomeMarca(c.brand)} ${c.descricao}`),
			titulo: `${c.code} · ${nomeMarca(c.brand)}`,
			subtitulo: `${nomeTipo(c.appliance_type)} — ${c.descricao}`,
			rota: `/erro/${c.id}`,
			exemplo: c.example
		});
	}
	for (const a of conteudo.arvores) {
		docs.push({
			tipo: 'arvore',
			id: a.id,
			marcas: a.aplicavel_a.map((r) => r.brand),
			textos: normalizarTexto(`${a.sintoma} ${a.titulo}`),
			titulo: a.sintoma,
			subtitulo: `Diagnóstico · ${nomeTipo(a.appliance_type)}`,
			rota: `/diagnostico/${a.id}`,
			exemplo: a.example
		});
	}
	for (const g of conteudo.guias) {
		docs.push({
			tipo: 'guia',
			id: g.id,
			marcas: g.aplicavel_a.map((r) => r.brand),
			textos: normalizarTexto(`${g.titulo} ${g.resumo ?? ''}`),
			titulo: g.titulo,
			subtitulo: `Guia · ${nomeTipo(g.appliance_type)}`,
			rota: `/guia/${g.id}`,
			exemplo: g.example
		});
	}
	const fuse = new Fuse(docs, {
		keys: [
			{ name: 'codigo', weight: 3 },
			{ name: 'textos', weight: 1 }
		],
		threshold: 0.38,
		ignoreLocation: true,
		minMatchCharLength: 2
	});
	return { fuse, docs };
}

/** Deteta uma marca na consulta (até 3 palavras seguidas). Devolve a marca e as palavras restantes. */
function detetarMarca(tokens: string[]): { marca: string | null; resto: string[] } {
	for (let n = Math.min(3, tokens.length); n >= 1; n--) {
		for (let i = 0; i + n <= tokens.length; i++) {
			const id = slugMarca(tokens.slice(i, i + n).join(' '));
			if (id && marcas.has(id)) return { marca: id, resto: [...tokens.slice(0, i), ...tokens.slice(i + n)] };
		}
	}
	// Tolerante a erros (ex.: "bekcen" → Becken): só palavras sem dígitos, para não confundir com códigos.
	indiceMarcas ??= new Fuse(conteudo.marcas, { keys: ['nome'], threshold: 0.4, ignoreLocation: true, minMatchCharLength: 2, includeScore: true });
	for (let i = 0; i < tokens.length; i++) {
		const t = tokens[i];
		if (t.length < 3 || /d/.test(t)) continue;
		const [melhor] = indiceMarcas.search(t, { limit: 1 });
		if (melhor && (melhor.score ?? 1) <= 0.4) return { marca: melhor.item.id, resto: [...tokens.slice(0, i), ...tokens.slice(i + 1)] };
	}
	return { marca: null, resto: tokens };
}

let indiceMarcas: Fuse<(typeof conteudo.marcas)[number]> | null = null;

const pareceModelo = (t: string) => t.length >= 3 && /\d/.test(t) && /[a-z]/i.test(t);

/** Pesquisa síncrona sobre o conteúdo (códigos, sintomas, guias, famílias, marcas). */
export function pesquisar(consulta: string, limite = 20): Resultado[] {
	const q = normalizarTexto(consulta);
	if (q.length < 2) return [];
	indice ??= construir();
	const tokens = q.split(' ').filter(Boolean);
	const { marca, resto } = detetarMarca(tokens);
	const textoResto = resto.join(' ');
	const res: Resultado[] = [];
	const vistos = new Set<string>();
	const push = (r: Resultado) => {
		if (!vistos.has(r.chave)) {
			vistos.add(r.chave);
			res.push(r);
		}
	};
	const daMarca = (d: Doc) => !marca || d.marcas.includes(marca) || d.marcas.includes('*');
	const doc = (d: Doc): Resultado => ({ chave: `${d.tipo}:${d.id}`, tipo: d.tipo, titulo: d.titulo, subtitulo: d.subtitulo, rota: d.rota, exemplo: d.exemplo });

	// 1) Código de erro exato (ex.: "E18 Bosch")
	for (const t of resto) {
		const n = normalizarModelo(t);
		if (!n) continue;
		for (const d of indice.docs) if (d.tipo === 'codigo' && daMarca(d) && d.codigo!.split(' ').includes(n)) push(doc(d));
	}

	// 2) Pesquisa difusa
	const termo = textoResto || (marca ? '' : q);
	if (termo) {
		// Com um código exato encontrado, não misturar códigos parecidos.
		const haCodigoExato = res.some((x) => x.tipo === 'codigo');
		for (const r of indice.fuse.search(termo, { limit: limite * 2 })) {
			if (haCodigoExato && r.item.tipo === 'codigo') continue;
			if (daMarca(r.item)) push(doc(r.item));
		}
	} else if (marca) {
		for (const d of indice.docs) if (d.marcas.includes(marca)) push(doc(d));
	}

	// 3) Famílias de modelos (padrões)
	for (const t of resto.filter(pareceModelo)) {
		const n = normalizarModelo(t);
		for (const f of conteudo.familias) {
			if (marca && f.brand !== marca) continue;
			if (!testarFamilia(f, n)) continue;
			push({
				chave: `familia:${f.id}:${n}`,
				tipo: 'familia',
				titulo: `${nomeMarca(f.brand)} ${t.toUpperCase()}`,
				subtitulo: `${f.nome} · ${nomeTipo(f.appliance_type)} — modelo indicado por ti`,
				selecao: { tipo: f.appliance_type, marca: { id: f.brand, nome: nomeMarca(f.brand) }, modelo: { texto: t.toUpperCase(), normalizado: n } },
				exemplo: f.example
			});
		}
	}

	// 4) Marca sozinha → entrar no fluxo com a marca escolhida
	if (marca && !textoResto) {
		const m = marcas.get(marca)!;
		// Todos os tipos: marca sem dados também segue para os sintomas universais.
		const ordem = [...conteudo.tipos].sort((a, b) => Number(conteudo.arvores.some((x) => x.appliance_type === b.id)) - Number(conteudo.arvores.some((x) => x.appliance_type === a.id)));
		for (const t of ordem) {
			push({
				chave: `marca:${marca}:${t.id}`,
				tipo: 'marca',
				titulo: `${m.nome} · ${t.nome}`,
				subtitulo: m.eprel[t.id] ? `${m.eprel[t.id]} modelos no EPREL` : 'Diagnosticar por sintoma',
				selecao: { tipo: t.id, marca: { id: m.id, nome: m.nome }, modelo: undefined },
				exemplo: m.example
			});
		}
	}

	return res.slice(0, limite);
}

/** Pesquisa assíncrona de modelos EPREL quando a consulta tem marca + modelo (ex.: "Bosch WAN28201"). */
export async function pesquisarModelosEprel(consulta: string, limite = 8): Promise<Resultado[]> {
	const tokens = normalizarTexto(consulta).split(' ').filter(Boolean);
	const { marca, resto } = detetarMarca(tokens);
	if (!marca) return [];
	const m = marcas.get(marca)!;
	const termo = resto.filter(pareceModelo).join('');
	if (normalizarModelo(termo).length < 3) return [];
	const res: Resultado[] = [];
	for (const [tipo, n] of Object.entries(m.eprel)) {
		if (!n) continue;
		const lista = await carregarModelos(tipo, marca);
		for (const mod of pesquisarModelos(lista, termo, limite)) {
			res.push({
				chave: `modelo:${tipo}:${mod.registo}:${mod.normalizado}`,
				tipo: 'modelo',
				titulo: `${m.nome} ${mod.identificador}`,
				subtitulo: `${tipos.get(tipo)?.nome ?? tipo} · Modelo verificado (EPREL)`,
				selecao: {
					tipo,
					marca: { id: m.id, nome: m.nome },
					modelo: { texto: mod.identificador, normalizado: mod.normalizado, eprel: { registo: mod.registo, grupo: mod.grupo, url: mod.url } }
				}
			});
		}
	}
	return res.slice(0, limite);
}
