/// <reference types="@unplugin-pwa/core/client" />
/// <reference types="@unplugin-pwa/core/info" />

declare global {
	namespace App {
		interface PageState {
			/** Passo do fluxo guiado (routing superficial). */
			passo?: 'marca' | 'modelo' | 'problema';
			/** Nó atual da árvore de diagnóstico. */
			no?: string;
			/** Nós já respondidos (para mostrar o número da pergunta). */
			caminho?: string[];
			/** Índice do passo do guia. */
			indice?: number;
		}
	}
}

export {};
