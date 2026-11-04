import { asset } from '$app/paths';
import Fuse from 'fuse.js';
import type { ShardModelos } from './tipos';
import { normalizarModelo } from './normalizar';

export interface ModeloEprel {
	identificador: string;
	normalizado: string;
	registo: string;
	grupo: string;
	url: string;
}

const cache = new Map<string, Promise<ModeloEprel[]>>();

export function urlEprel(grupo: string, registo: string) {
	return `https://eprel.ec.europa.eu/screen/product/${grupo}/${registo}`;
}

/** Carrega (com cache) os modelos EPREL de uma marca para um tipo. */
export function carregarModelos(tipo: string, marca: string): Promise<ModeloEprel[]> {
	const chave = `${tipo}/${marca}`;
	let p = cache.get(chave);
	if (!p) {
		p = fetch(asset(`data/modelos/${tipo}/${marca}.json` as Parameters<typeof asset>[0]))
			.then((r) => (r.ok ? (r.json() as Promise<ShardModelos>) : { g: [], m: [] }))
			.then((s) =>
				s.m.map(([identificador, registo, gi]) => ({
					identificador,
					normalizado: normalizarModelo(identificador),
					registo,
					grupo: s.g[gi],
					url: urlEprel(s.g[gi], registo)
				}))
			)
			.catch(() => {
				cache.delete(chave);
				return [];
			});
		cache.set(chave, p);
	}
	return p;
}

const indices = new WeakMap<ModeloEprel[], Fuse<ModeloEprel>>();

/**
 * Pesquisa tolerante a espaços, hífens e pequenos erros:
 * 1) correspondência exata/prefixo/substring no identificador normalizado;
 * 2) se houver poucos resultados, completa com pesquisa difusa (Fuse).
 */
export function pesquisarModelos(modelos: ModeloEprel[], consulta: string, limite = 30): ModeloEprel[] {
	const q = normalizarModelo(consulta);
	if (q.length < 2) return [];
	const exatos: ModeloEprel[] = [];
	const prefixo: ModeloEprel[] = [];
	const contem: ModeloEprel[] = [];
	for (const m of modelos) {
		if (m.normalizado === q) exatos.push(m);
		else if (m.normalizado.startsWith(q)) prefixo.push(m);
		else if (m.normalizado.includes(q)) contem.push(m);
		if (exatos.length + prefixo.length + contem.length > limite * 3) break;
	}
	const res = [...exatos, ...prefixo, ...contem].slice(0, limite);
	if (res.length >= 5 || q.length < 4) return res;

	let fuse = indices.get(modelos);
	if (!fuse) {
		fuse = new Fuse(modelos, { keys: ['normalizado'], threshold: 0.3, ignoreLocation: true, minMatchCharLength: 3 });
		indices.set(modelos, fuse);
	}
	const vistos = new Set(res.map((m) => m.registo + m.normalizado));
	for (const r of fuse.search(q, { limit: limite })) {
		const k = r.item.registo + r.item.normalizado;
		if (!vistos.has(k)) {
			res.push(r.item);
			vistos.add(k);
		}
		if (res.length >= limite) break;
	}
	return res;
}
