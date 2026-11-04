import { carregarMotion, motionPronto } from './carregar';
import { SPRING } from './tokens';
import { movimento } from './reduzido.svelte';

export type OpcoesDeslizar = {
	podeAvancar: boolean;
	podeRecuar: boolean;
	aoAvancar: () => void;
	aoRecuar: () => void;
};

/**
 * Gesto de deslizar horizontal (pointer events + Motion).
 * O elemento segue o dedo (só transform) e, ao largar, avança/recua
 * se passar o limiar de distância ou velocidade; caso contrário regressa com spring.
 * O scroll vertical continua a funcionar (touch-action: pan-y).
 */
export function deslizar(node: HTMLElement, opcoes: OpcoesDeslizar) {
	let o = opcoes;
	let inicioX = 0;
	let inicioY = 0;
	let dx = 0;
	let t0 = 0;
	let id: number | null = null;
	let horizontal: boolean | null = null;

	node.style.touchAction = 'pan-y';

	function baixo(e: PointerEvent) {
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		const alvo = e.target as HTMLElement;
		if (alvo.closest('button, a, input, textarea, select, [data-sem-gesto]')) return;
		id = e.pointerId;
		if (!movimento.reduzido) carregarMotion();
		inicioX = e.clientX;
		inicioY = e.clientY;
		dx = 0;
		t0 = performance.now();
		horizontal = null;
	}

	function mover(e: PointerEvent) {
		if (id !== e.pointerId) return;
		const mx = e.clientX - inicioX;
		const my = e.clientY - inicioY;
		if (horizontal === null) {
			if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
			horizontal = Math.abs(mx) > Math.abs(my);
			if (horizontal) node.setPointerCapture(e.pointerId);
		}
		if (!horizontal) return;
		// Resistência nas pontas
		const bloqueado = (mx < 0 && !o.podeAvancar) || (mx > 0 && !o.podeRecuar);
		dx = bloqueado ? mx * 0.25 : mx;
		if (!movimento.reduzido) node.style.transform = `translate3d(${dx}px,0,0)`;
	}

	function cima(e: PointerEvent) {
		if (id !== e.pointerId) return;
		id = null;
		if (!horizontal) return;
		const largura = node.offsetWidth || 1;
		const velocidade = dx / Math.max(1, performance.now() - t0); // px/ms
		const passou = Math.abs(dx) > largura * 0.25 || Math.abs(velocidade) > 0.5;

		if (passou && dx < 0 && o.podeAvancar) {
			node.style.transform = '';
			o.aoAvancar();
		} else if (passou && dx > 0 && o.podeRecuar) {
			node.style.transform = '';
			o.aoRecuar();
		} else if (!movimento.reduzido && dx !== 0 && motionPronto()) {
			motionPronto()!
				.animate(node, { x: 0 }, SPRING.regresso)
				.then(() => {
					node.style.transform = '';
				});
		} else {
			node.style.transform = '';
		}
		dx = 0;
	}

	node.addEventListener('pointerdown', baixo);
	node.addEventListener('pointermove', mover);
	node.addEventListener('pointerup', cima);
	node.addEventListener('pointercancel', cima);

	return {
		update(novas: OpcoesDeslizar) {
			o = novas;
		},
		destroy() {
			node.removeEventListener('pointerdown', baixo);
			node.removeEventListener('pointermove', mover);
			node.removeEventListener('pointerup', cima);
			node.removeEventListener('pointercancel', cima);
		}
	};
}
