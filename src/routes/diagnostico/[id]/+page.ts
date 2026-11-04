import { error } from '@sveltejs/kit';
import { conteudo } from '#lib/data/conteudo.ts';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => conteudo.arvores.map((a) => ({ id: a.id }));

export const load: PageLoad = ({ params }) => {
	const arvore = conteudo.arvores.find((a) => a.id === params.id);
	if (!arvore) error(404, 'Diagnóstico não encontrado');
	return { arvore };
};
