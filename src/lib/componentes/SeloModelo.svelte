<script lang="ts">
	import BadgeCheck from '@lucide/svelte/icons/badge-check';
	import PencilLine from '@lucide/svelte/icons/pencil-line';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import type { ModeloSelecionado } from '#lib/estado/selecao.svelte.ts';

	let { modelo }: { modelo: ModeloSelecionado } = $props();
</script>

{#if modelo.eprel}
	<span class="selo verificado">
		<BadgeCheck aria-hidden="true" />
		Modelo verificado (EPREL)
	</span>
	<a class="eprel" href={modelo.eprel.url} target="_blank" rel="noopener noreferrer external">
		Ver registo no EPREL <ExternalLink aria-hidden="true" /><span class="vh">(abre noutro separador)</span>
	</a>
{:else}
	<span class="selo indicado">
		<PencilLine aria-hidden="true" />
		Modelo indicado por ti
	</span>
{/if}

<style>
	.selo {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 12px 4px 8px;
		border-radius: var(--raio-chip);
		font-weight: 700;
		font-size: var(--t-sm);
	}
	.selo :global(svg) {
		width: 18px;
		height: 18px;
	}
	.verificado {
		background: var(--verificado);
		color: var(--sobre-verificado);
	}
	.indicado {
		background: var(--superficie-2);
		color: var(--texto);
		border: 1px solid var(--linha-forte);
	}
	.eprel {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		min-height: var(--alvo);
		font-weight: 700;
		font-size: var(--t-sm);
	}
	.eprel :global(svg) {
		width: 14px;
		height: 14px;
	}
</style>
