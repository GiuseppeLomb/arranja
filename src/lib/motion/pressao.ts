import { SPRING } from './tokens';
import { movimento } from './reduzido.svelte';
import { carregarMotion, motionPronto } from './carregar';

/**
 * Feedback de pressão (scale 0.97) com spring do Motion.
 * Enquanto o Motion não está carregado (primeiro toque), usa uma transição CSS equivalente.
 * Uso: <button use:pressao>…</button>
 */
export function pressao(node: HTMLElement, opcoes: { escala?: number } = {}) {
	let escala = opcoes.escala ?? 0.97;
	let premido = false;

	function aplicar(valor: number, spring: (typeof SPRING)[keyof typeof SPRING]) {
		const m = motionPronto();
		if (m) {
			node.style.transition = '';
			m.animate(node, { scale: valor }, spring);
		} else {
			node.style.transition = 'transform 150ms cubic-bezier(0.2, 0.8, 0.2, 1)';
			node.style.transform = valor === 1 ? '' : `scale(${valor})`;
		}
	}

	function preparar() {
		if (!movimento.reduzido) carregarMotion();
	}

	function baixo(e: PointerEvent) {
		if (movimento.reduzido || e.button !== 0) return;
		if (node.hasAttribute('disabled') || node.getAttribute('aria-disabled') === 'true') return;
		preparar();
		premido = true;
		aplicar(escala, SPRING.pressao);
	}

	function cima() {
		if (!premido) return;
		premido = false;
		aplicar(1, SPRING.regresso);
	}

	node.addEventListener('pointerenter', preparar, { passive: true });
	node.addEventListener('pointerdown', baixo);
	node.addEventListener('pointerup', cima);
	node.addEventListener('pointerleave', cima);
	node.addEventListener('pointercancel', cima);

	return {
		update(novas: { escala?: number } = {}) {
			escala = novas.escala ?? 0.97;
		},
		destroy() {
			node.removeEventListener('pointerenter', preparar);
			node.removeEventListener('pointerdown', baixo);
			node.removeEventListener('pointerup', cima);
			node.removeEventListener('pointerleave', cima);
			node.removeEventListener('pointercancel', cima);
		}
	};
}
