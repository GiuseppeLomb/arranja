import { fade, fly, scale, type TransitionConfig } from 'svelte/transition';
import { DUR, STAGGER, easePadrao } from './tokens';
import { movimento } from './reduzido.svelte';

type Params = { delay?: number; duration?: number; x?: number; y?: number };

/** Fade curto usado como alternativa quando o movimento está reduzido. */
function fadeCurto(node: Element, delay = 0): TransitionConfig {
	return fade(node, { duration: 120, delay: Math.min(delay, 60) });
}

/** Entrada padrão: desliza um pouco e aparece. Só transform + opacity. */
export function entrar(node: Element, { delay = 0, duration = DUR.padrao, x = 0, y = 12 }: Params = {}): TransitionConfig {
	if (movimento.reduzido) return fadeCurto(node, delay);
	return fly(node, { delay, duration, x, y, easing: easePadrao, opacity: 0 });
}

/** Entrada de ecrã/secção (350ms). */
export function entrarEcra(node: Element, { delay = 0, x = 0, y = 16 }: Params = {}): TransitionConfig {
	if (movimento.reduzido) return fadeCurto(node, delay);
	return fly(node, { delay, duration: DUR.ecra, x, y, easing: easePadrao, opacity: 0 });
}

/** Saída rápida. */
export function sair(node: Element, { delay = 0, duration = DUR.micro, x = 0, y = 0 }: Params = {}): TransitionConfig {
	if (movimento.reduzido || (x === 0 && y === 0)) return fade(node, { duration: movimento.reduzido ? 100 : duration, delay });
	return fly(node, { delay, duration, x, y, easing: easePadrao, opacity: 0 });
}

/** Pop discreto para chips/selos. */
export function surgir(node: Element, { delay = 0, duration = DUR.padrao }: Params = {}): TransitionConfig {
	if (movimento.reduzido) return fadeCurto(node, delay);
	return scale(node, { delay, duration, start: 0.92, easing: easePadrao, opacity: 0 });
}

/** Atraso em cascata para listas (30ms por item, com teto para listas longas). */
export function cascata(i: number, max = 12): number {
	return Math.min(i, max) * STAGGER;
}
