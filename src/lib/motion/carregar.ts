/**
 * O Motion só é carregado quando há interação (toque, hover, gesto, sheet),
 * para não pesar no primeiro ecrã. Depois fica em cache (e no service worker).
 */
type ModuloMotion = typeof import('./motion-anim');

let modulo: ModuloMotion | null = null;
let promessa: Promise<ModuloMotion> | null = null;

export function carregarMotion(): Promise<ModuloMotion> {
	promessa ??= import('./motion-anim').then((m) => (modulo = m));
	return promessa;
}

/** Devolve o Motion se já estiver carregado (sem esperar). */
export function motionPronto(): ModuloMotion | null {
	return modulo;
}
