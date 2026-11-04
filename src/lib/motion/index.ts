export { DUR, STAGGER, SPRING, EASE_PADRAO, easePadrao, cubicBezier } from './tokens';
export { movimento } from './reduzido.svelte';
export { entrar, entrarEcra, sair, surgir, cascata } from './transicoes';
export { pressao } from './pressao';
export { deslizar, type OpcoesDeslizar } from './deslizar';
export { comTransicao, transicoesDeNavegacao, suportaVT } from './vista';

/** Vibração curta (Android), se disponível. */
export function vibrar(ms = 30) {
	try {
		if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(ms);
	} catch {
		/* sem suporte */
	}
}
