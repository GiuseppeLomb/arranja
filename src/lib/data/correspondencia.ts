import type { AplicavelA, Familia } from './tipos';

/** Quão específica é a correspondência (maior = mais específica). */
export type Nivel = 'modelo' | 'familia' | 'marca' | 'todas';

export interface Correspondencia {
	nivel: Nivel;
	/** Família que correspondeu, se for o caso. */
	familia?: Familia;
	/** Padrão legível que correspondeu (ex.: "WAN…"). */
	padrao?: string;
}

const RANK: Record<Nivel, number> = { modelo: 4, familia: 3, marca: 2, todas: 1 };

const cacheRegex = new Map<string, RegExp | null>();
function regex(fonte: string): RegExp | null {
	if (!cacheRegex.has(fonte)) {
		try {
			cacheRegex.set(fonte, new RegExp(fonte));
		} catch {
			cacheRegex.set(fonte, null);
		}
	}
	return cacheRegex.get(fonte) ?? null;
}

/** Testa um modelo normalizado contra os padrões de uma família. Devolve o padrão que correspondeu. */
export function testarFamilia(f: Pick<Familia, 'prefixos' | 'regex' | 'modelos'>, modelo: string): string | null {
	if (f.modelos?.includes(modelo)) return modelo;
	for (const p of f.prefixos ?? []) if (modelo.startsWith(p)) return `${p}…`;
	for (const r of f.regex ?? []) if (regex(r)?.test(modelo)) return r;
	return null;
}

/**
 * Verifica se um conteúdo (guia, árvore ou código) se aplica a marca + modelo.
 * - Regras sem familias/prefixos/regex/modelos aplicam-se a todos os modelos da marca.
 * - Sem modelo indicado (null), só as regras sem restrições se aplicam.
 * Devolve a correspondência mais específica, ou null.
 */
export function corresponde(
	regras: AplicavelA[] | undefined,
	familias: ReadonlyMap<string, Familia>,
	marca: string | null,
	modelo: string | null
): Correspondencia | null {
	if (!regras || regras.length === 0) return { nivel: 'marca' };
	let melhor: Correspondencia | null = null;
	const considerar = (c: Correspondencia) => {
		if (!melhor || RANK[c.nivel] > RANK[melhor.nivel]) melhor = c;
	};

	for (const r of regras) {
		if (r.brand !== '*' && r.brand !== marca) continue;
		const restrito = r.familias || r.prefixos || r.regex || r.modelos;
		if (!restrito) {
			considerar({ nivel: r.brand === '*' ? 'todas' : 'marca' });
			continue;
		}
		if (!modelo) continue;
		if (r.modelos?.includes(modelo)) return { nivel: 'modelo', padrao: modelo };
		const direto = testarFamilia({ prefixos: r.prefixos, regex: r.regex }, modelo);
		if (direto) considerar({ nivel: 'familia', padrao: direto });
		for (const id of r.familias ?? []) {
			const f = familias.get(id);
			if (!f) continue;
			const p = testarFamilia(f, modelo);
			if (p) considerar({ nivel: f.modelos?.includes(modelo) ? 'modelo' : 'familia', familia: f, padrao: p });
		}
	}
	return melhor;
}

/** Descrição legível de "aplica-se a", para a checklist e páginas de detalhe. */
export function descreverAplicacao(
	regras: AplicavelA[] | undefined,
	familias: ReadonlyMap<string, Familia>,
	nomeMarca: (id: string) => string
): string[] {
	if (!regras) return [];
	return regras.map((r) => {
		const marca = r.brand === '*' ? 'Todas as marcas' : nomeMarca(r.brand);
		const partes: string[] = [];
		for (const id of r.familias ?? []) partes.push(familias.get(id)?.nome ?? id);
		for (const p of r.prefixos ?? []) partes.push(`${p}…`);
		for (const x of r.regex ?? []) partes.push(`padrão ${x}`);
		for (const m of r.modelos ?? []) partes.push(m);
		return partes.length ? `${marca}: ${partes.join(', ')}` : `${marca}: todos os modelos`;
	});
}
