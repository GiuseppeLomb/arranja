export interface Toast {
	id: number;
	texto: string;
	tom: 'info' | 'sucesso';
}

let seq = 0;
export const toasts = $state<{ lista: Toast[] }>({ lista: [] });

export function mostrarToast(texto: string, tom: Toast['tom'] = 'info', duracao = 2800) {
	const id = ++seq;
	toasts.lista = [...toasts.lista.slice(-2), { id, texto, tom }];
	setTimeout(() => fecharToast(id), duracao);
}

export function fecharToast(id: number) {
	toasts.lista = toasts.lista.filter((t) => t.id !== id);
}
