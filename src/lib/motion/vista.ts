import { tick } from 'svelte';
import { onNavigate } from '$app/navigation';

/** View Transitions API disponível? (fallback silencioso quando não). */
export function suportaVT(): boolean {
	return typeof document !== 'undefined' && 'startViewTransition' in document;
}

/**
 * Corre uma atualização de estado dentro de uma view transition, se suportada.
 * Usado no routing superficial (pushState), onde onNavigate não dispara.
 */
export async function comTransicao(atualizar: () => unknown): Promise<void> {
	if (!suportaVT()) {
		await atualizar();
		return;
	}
	try {
		const vt = document.startViewTransition(async () => {
			await atualizar();
			await tick();
		});
		await vt.updateCallbackDone;
	} catch {
		await atualizar();
	}
}

/** Liga view transitions às navegações do SvelteKit. Chamar no layout raiz. */
export function transicoesDeNavegacao() {
	onNavigate((navegacao) => {
		if (!suportaVT()) return;
		// Mudança de ecrã: usa a animação vertical por omissão (não a de passos).
		delete document.documentElement.dataset.direcao;
		// Navegações para a mesma rota (ex.: só query) não precisam de transição de ecrã.
		if (navegacao.from?.url.pathname === navegacao.to?.url.pathname) return;
		return new Promise((resolver) => {
			try {
				document.startViewTransition(async () => {
					resolver();
					await navegacao.complete;
				});
			} catch {
				resolver();
			}
		});
	});
}
