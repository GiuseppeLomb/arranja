import { carregarGuia, entradasGuias } from '#lib/data/carregar-guia.ts';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = entradasGuias;
export const load: PageLoad = ({ params }) => carregarGuia(params.id);
