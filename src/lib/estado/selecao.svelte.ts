import { ler, gravar } from './armazenamento';

export interface ModeloSelecionado {
	/** Texto como o utilizador o escreveu ou como está no EPREL. */
	texto: string;
	normalizado: string;
	/** Presente quando o modelo foi encontrado no EPREL. */
	eprel?: { registo: string; grupo: string; url: string };
}

export interface Selecao {
	tipo: string | null;
	marca: { id: string; nome: string } | null;
	/** undefined = ainda não escolhido; null = "não sei o modelo". */
	modelo: ModeloSelecionado | null | undefined;
	/** Última árvore percorrida (para "Não resultou?"). */
	ultimaArvore: string | null;
}

const VAZIA: Selecao = { tipo: null, marca: null, modelo: undefined, ultimaArvore: null };

/** Escolhas do fluxo guiado — guardadas na sessão para voltar atrás sem as perder. */
export const selecao = $state<Selecao>({ ...VAZIA });

let carregada = false;
/** Lê a sessão (só no browser, depois de montar, para não divergir do HTML pré-renderizado). Idempotente. */
export function carregarSelecao() {
	if (carregada || typeof window === 'undefined') return;
	carregada = true;
	Object.assign(selecao, { ...VAZIA, ...ler<Partial<Selecao>>('selecao', {}, 'sessao') });
}

function guardar() {
	gravar('selecao', $state.snapshot(selecao), 'sessao');
}

export function escolherTipo(tipo: string) {
	if (selecao.tipo !== tipo) {
		selecao.marca = null;
		selecao.modelo = undefined;
	}
	selecao.tipo = tipo;
	guardar();
}

export function escolherMarca(marca: { id: string; nome: string }) {
	if (selecao.marca?.id !== marca.id) selecao.modelo = undefined;
	selecao.marca = marca;
	guardar();
}

export function escolherModelo(modelo: ModeloSelecionado | null) {
	selecao.modelo = modelo;
	guardar();
}

export function definirUltimaArvore(id: string | null) {
	selecao.ultimaArvore = id;
	guardar();
}

export function restaurar(s: Pick<Selecao, 'tipo' | 'marca' | 'modelo'>) {
	selecao.tipo = s.tipo;
	selecao.marca = s.marca;
	selecao.modelo = s.modelo;
	guardar();
}
