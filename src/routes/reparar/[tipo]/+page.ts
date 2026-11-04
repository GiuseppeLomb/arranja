import { error } from '@sveltejs/kit';
import { conteudo } from '#lib/data/conteudo.ts';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => conteudo.tipos.map((t) => ({ tipo: t.id }));

export const load: PageLoad = ({ params }) => {
	const tipo = conteudo.tipos.find((t) => t.id === params.tipo);
	if (!tipo) error(404, 'Eletrodoméstico desconhecido');
	return { tipo };
};
