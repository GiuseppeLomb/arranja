import { error } from '@sveltejs/kit';
import { conteudo } from '#lib/data/conteudo.ts';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => conteudo.codigos.map((c) => ({ id: c.id }));

export const load: PageLoad = ({ params }) => {
	const codigo = conteudo.codigos.find((c) => c.id === params.id);
	if (!codigo) error(404, 'Código de erro não encontrado');
	return { codigo };
};
