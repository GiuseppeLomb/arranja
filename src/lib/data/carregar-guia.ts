import { error } from '@sveltejs/kit';
import { conteudo } from './conteudo';

/** Entradas de pré-renderização para as rotas /guia/[id]/… */
export const entradasGuias = () => conteudo.guias.map((g) => ({ id: g.id }));

export function carregarGuia(id: string) {
	const guia = conteudo.guias.find((g) => g.id === id);
	if (!guia) error(404, 'Guia não encontrado');
	return { guia };
}
