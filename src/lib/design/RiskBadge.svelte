<script lang="ts">
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import OctagonAlert from '@lucide/svelte/icons/octagon-alert';
	import Ban from '@lucide/svelte/icons/ban';
	import type { RiskLevel } from '#lib/data/tipos.ts';

	let { nivel, grande = false }: { nivel: RiskLevel; grande?: boolean } = $props();

	const ROTULO: Record<RiskLevel, string> = {
		baixo: 'Risco baixo',
		medio: 'Risco médio',
		alto: 'Risco alto',
		proibido: 'Proibido fazer em casa'
	};
	const ICONE = { baixo: ShieldCheck, medio: TriangleAlert, alto: OctagonAlert, proibido: Ban };
	const Icone = $derived(ICONE[nivel]);
</script>

<span class="selo {nivel}" class:grande>
	<Icone aria-hidden="true" />
	{ROTULO[nivel]}
</span>

<style>
	/* As cores --risco-* são usadas EXCLUSIVAMENTE aqui e noutros indicadores de risco. */
	.selo {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 12px 4px 8px;
		border-radius: var(--raio-chip);
		font-weight: 700;
		font-size: var(--t-sm);
		line-height: 1.4;
		white-space: nowrap;
	}
	.selo :global(svg) {
		width: 18px;
		height: 18px;
	}
	.grande {
		padding: 8px 16px 8px 12px;
		font-size: var(--t-md);
	}
	.grande :global(svg) {
		width: 22px;
		height: 22px;
	}
	.baixo {
		background: var(--risco-baixo);
		color: var(--sobre-risco-baixo);
	}
	.medio {
		background: var(--risco-medio);
		color: var(--sobre-risco-medio);
	}
	.alto {
		background: var(--risco-alto);
		color: var(--sobre-risco-alto);
	}
	.proibido {
		background: var(--risco-proibido);
		color: var(--sobre-risco-proibido);
	}
</style>
