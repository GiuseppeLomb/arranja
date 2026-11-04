/**
 * Otimização das ilustrações SVG com svgo.
 * A ilustração da cozinha é inline (para animar), por isso o svgo tem de preservar
 * ids referenciados por aria-labelledby/clip-path, role, aria-* e data-*.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { optimize, type Config } from 'svgo';
import { RAIZ } from './dados.ts';

export const LIMITE_BYTES = 60 * 1024;

export const ILUSTRACOES = [
	{
		fonte: join(RAIZ, 'src', 'lib', 'ilustracoes', 'cozinha', 'cozinha.svg'),
		destino: join(RAIZ, 'src', 'lib', 'ilustracoes', 'cozinha', 'cozinha.min.svg')
	}
];

const CONFIG: Config = {
	multipass: true,
	floatPrecision: 2,
	plugins: [
		{
			name: 'preset-default',
			params: {
				overrides: {
					// ids usados por aria-labelledby, clip-path e pattern
					cleanupIds: false,
					removeUnknownsAndDefaults: { unknownAttrs: false, keepRoleAttr: true, keepAriaAttrs: true, keepDataAttrs: true }
				}
			}
		},
		// Inline em HTML não precisa de xmlns
		'removeXMLNS'
	]
};

export function otimizarSvg(caminho: string): string {
	const r = optimize(readFileSync(caminho, 'utf8'), { ...CONFIG, path: caminho });
	return `${r.data}\n`;
}

/** Atributos/classes que a app usa e que o svgo não pode remover. */
export const OBRIGATORIOS = [
	'class="k-svg"',
	'role="group"',
	'aria-labelledby="k-titulo"',
	'id="k-titulo"',
	'data-tipo="frigorifico"',
	'data-tipo="maquina-lavar-loica"',
	'data-tipo="maquina-lavar-roupa"',
	'data-tipo="maquina-lavar-secar"',
	'data-tipo="maquina-secar"',
	'data-brevemente="Forno"',
	'data-brevemente="Exaustor"',
	'class="k-corpo"',
	'class="k-halo"',
	'class="k-anel"',
	'class="k-sombra"',
	'k-tambor',
	'class="k-luz"',
	'href="/reparar/'
];
