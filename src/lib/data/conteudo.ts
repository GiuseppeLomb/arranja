import bruto from '#lib/generated/conteudo.json';
import type { Arvore, CodigoErro, Conteudo, Familia, Ferramenta, Guia, Marca, TipoEletrodomestico } from './tipos';
import { corresponde, type Correspondencia } from './correspondencia';
import { normalizarModelo } from './normalizar';

export const conteudo = bruto as unknown as Conteudo;

const porId = <T extends { id: string }>(xs: T[]) => new Map(xs.map((x) => [x.id, x]));

export const tipos: ReadonlyMap<string, TipoEletrodomestico> = porId(conteudo.tipos);
export const marcas: ReadonlyMap<string, Marca> = porId(conteudo.marcas);
export const familias: ReadonlyMap<string, Familia> = porId(conteudo.familias);
export const guias: ReadonlyMap<string, Guia> = porId(conteudo.guias);
export const arvores: ReadonlyMap<string, Arvore> = porId(conteudo.arvores);
export const codigos: ReadonlyMap<string, CodigoErro> = porId(conteudo.codigos);
export const ferramentas: ReadonlyMap<string, Ferramenta> = porId(conteudo.ferramentas);

export const nomeMarca = (id: string) => marcas.get(id)?.nome ?? id;
export const nomeTipo = (id: string) => tipos.get(id)?.nome ?? id;

/** Marcas a mostrar para um tipo: lista curada, marcas com modelos EPREL e marcas com conteúdo. */
export function marcasDoTipo(tipo: string): Marca[] {
	return conteudo.marcas.filter((m) => m.curada || (m.eprel[tipo] ?? 0) > 0 || m.conteudo.includes(tipo));
}

export const haDadosEprel = conteudo.eprel.grupos.length > 0;

export interface Encontrado<T> {
	item: T;
	c: Correspondencia;
}

/**
 * Conteúdo aplicável a tipo + marca (opcional) + modelo (normalizado, opcional).
 * Sem marca, só entra o conteúdo universal (brand "*"). Ordenado do mais específico para o geral.
 */
export function conteudoPara(tipo: string, marca: string | null, modelo: string | null) {
	const filtrar = <T extends { appliance_type: string; aplicavel_a?: Guia['aplicavel_a'] }>(xs: T[], brandFixa?: (x: T) => string) => {
		const r: Encontrado<T>[] = [];
		for (const x of xs) {
			if (x.appliance_type !== tipo) continue;
			if (brandFixa && brandFixa(x) !== marca) continue;
			const c = corresponde(x.aplicavel_a, familias, marca, modelo);
			if (c) r.push({ item: x, c });
		}
		const peso = { modelo: 0, familia: 1, marca: 2, todas: 3 } as const;
		return r.sort((a, b) => peso[a.c.nivel] - peso[b.c.nivel]);
	};
	return {
		codigos: filtrar(conteudo.codigos, (c) => c.brand),
		arvores: filtrar([...conteudo.arvores].sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999))),
		guias: filtrar(conteudo.guias)
	};
}

/** Códigos de erro de um tipo que começam pelo texto indicado (todas as marcas). */
export function codigosDoTipo(tipo: string, consulta: string): CodigoErro[] {
	const q = normalizarModelo(consulta);
	if (!q) return [];
	return conteudo.codigos.filter(
		(c) => c.appliance_type === tipo && [c.code, ...(c.aliases ?? [])].some((x) => normalizarModelo(x).startsWith(q))
	);
}

/** Famílias de uma marca/tipo que correspondem a um modelo. */
export function familiasDoModelo(tipo: string, marca: string, modelo: string): Familia[] {
	return conteudo.familias.filter(
		(f) => f.appliance_type === tipo && f.brand === marca && corresponde([{ brand: marca, familias: [f.id] }], familias, marca, modelo)
	);
}

/** Guias, árvores e códigos que referem uma ferramenta. */
export function guiasComFerramenta(id: string): Guia[] {
	return conteudo.guias.filter((g) => g.ferramentas.includes(id));
}
