import { ler, gravar, CHAVES } from './armazenamento';
import type { ModeloSelecionado } from './selecao.svelte';

// ---------- Favoritos ----------

export type TipoFavorito = 'guia' | 'arvore' | 'codigo';

export interface Favorito {
	tipo: TipoFavorito;
	id: string;
	titulo: string;
	em: number;
}

export const favoritos = $state<{ lista: Favorito[] }>({ lista: [] });

let carregadas = false;
/** Lê favoritos e recentes do localStorage (só no browser, depois de montar). Idempotente. */
export function carregarColecoes() {
	if (carregadas || typeof window === 'undefined') return;
	carregadas = true;
	favoritos.lista = ler<Favorito[]>(CHAVES.favoritos, []);
	recentes.lista = ler<Recente[]>(CHAVES.recentes, []);
}

export function eFavorito(tipo: TipoFavorito, id: string) {
	return favoritos.lista.some((f) => f.tipo === tipo && f.id === id);
}

/** Alterna o favorito. Devolve true se ficou marcado. */
export function alternarFavorito(tipo: TipoFavorito, id: string, titulo: string): boolean {
	const i = favoritos.lista.findIndex((f) => f.tipo === tipo && f.id === id);
	if (i >= 0) favoritos.lista.splice(i, 1);
	else favoritos.lista.unshift({ tipo, id, titulo, em: Date.now() });
	gravar(CHAVES.favoritos, $state.snapshot(favoritos.lista));
	return i < 0;
}

// ---------- Recentes ----------

export interface Recente {
	tipo: string;
	marca: { id: string; nome: string };
	modelo: ModeloSelecionado | null;
	em: number;
}

export const recentes = $state<{ lista: Recente[] }>({ lista: [] });

export function registarRecente(r: Omit<Recente, 'em'>) {
	const chave = (x: Omit<Recente, 'em'>) => `${x.tipo}|${x.marca.id}|${x.modelo?.normalizado ?? ''}`;
	const k = chave(r);
	recentes.lista = [{ ...r, em: Date.now() }, ...recentes.lista.filter((x) => chave(x) !== k)].slice(0, 8);
	gravar(CHAVES.recentes, $state.snapshot(recentes.lista));
}

export function limparRecentes() {
	recentes.lista = [];
	gravar(CHAVES.recentes, []);
}
