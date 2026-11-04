/** Durações (ms) — iguais às variáveis CSS --dur-*. */
export const DUR = {
	micro: 150,
	padrao: 250,
	ecra: 350
} as const;

/** Atraso entre itens de uma lista em cascata. */
export const STAGGER = 30;

/** cubic-bezier(0.2, 0.8, 0.2, 1) — easing padrão. */
export const EASE_PADRAO = [0.2, 0.8, 0.2, 1] as const;

/** Springs do Motion para cartões e sheets. */
export const SPRING = {
	pressao: { type: 'spring', stiffness: 700, damping: 32, mass: 0.6 },
	cartao: { type: 'spring', stiffness: 420, damping: 32 },
	sheet: { type: 'spring', stiffness: 380, damping: 38 },
	regresso: { type: 'spring', stiffness: 500, damping: 40 }
} as const;

/**
 * Implementação de cubic-bezier para as transições do Svelte (recebem t∈[0,1]).
 * Método de Newton-Raphson com fallback para bisseção.
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
	const cx = 3 * x1;
	const bx = 3 * (x2 - x1) - cx;
	const ax = 1 - cx - bx;
	const cy = 3 * y1;
	const by = 3 * (y2 - y1) - cy;
	const ay = 1 - cy - by;
	const amostraX = (t: number) => ((ax * t + bx) * t + cx) * t;
	const amostraY = (t: number) => ((ay * t + by) * t + cy) * t;
	const derivadaX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

	function resolverX(x: number): number {
		let t = x;
		for (let i = 0; i < 8; i++) {
			const erro = amostraX(t) - x;
			if (Math.abs(erro) < 1e-5) return t;
			const d = derivadaX(t);
			if (Math.abs(d) < 1e-6) break;
			t -= erro / d;
		}
		let lo = 0;
		let hi = 1;
		t = x;
		while (lo < hi) {
			const v = amostraX(t);
			if (Math.abs(v - x) < 1e-5) return t;
			if (x > v) lo = t;
			else hi = t;
			t = (lo + hi) / 2;
			if (hi - lo < 1e-6) break;
		}
		return t;
	}

	return (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : amostraY(resolverX(t)));
}

export const easePadrao = cubicBezier(...EASE_PADRAO);
