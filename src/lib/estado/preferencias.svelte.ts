import { lerTexto, gravarTexto, ler, gravar, CHAVES } from './armazenamento';

export type Tema = 'auto' | 'claro' | 'escuro';

export const preferencias = $state<{ tema: Tema; oficina: boolean }>({ tema: 'auto', oficina: false });

export function carregarPreferencias() {
	const t = lerTexto(CHAVES.tema);
	preferencias.tema = t === 'claro' || t === 'escuro' ? t : 'auto';
	preferencias.oficina = ler<boolean>(CHAVES.oficina, false);
	aplicarTema();
}

function aplicarTema() {
	if (typeof document === 'undefined') return;
	const el = document.documentElement;
	if (preferencias.tema === 'auto') el.removeAttribute('data-theme');
	else el.setAttribute('data-theme', preferencias.tema === 'claro' ? 'light' : 'dark');
}

export function definirTema(t: Tema) {
	preferencias.tema = t;
	// Guardado como texto simples: é lido pelo script inline de src/app.html antes da pintura.
	gravarTexto(CHAVES.tema, t === 'auto' ? null : t);
	aplicarTema();
}

export function definirOficina(ativo: boolean) {
	preferencias.oficina = ativo;
	gravar(CHAVES.oficina, ativo);
}
