<script lang="ts">
	import type { Snippet } from 'svelte';
	import { pressao } from '#lib/motion/index.ts';

	type Props = {
		href?: string;
		onclick?: (e: MouseEvent) => void;
		/** view-transition-name para transições partilhadas entre ecrãs. */
		vt?: string;
		elevado?: boolean;
		rotulo?: string;
		classe?: string;
		children: Snippet;
	};

	let { href, onclick, vt, elevado = false, rotulo, classe = '', children }: Props = $props();
	const interativo = $derived(Boolean(href || onclick));
</script>

{#if href}
	<a {href} class="cartao interativo {elevado ? 'elevado' : ''} {classe}" style:view-transition-name={vt} aria-label={rotulo} {onclick} use:pressao={{ escala: 0.98 }}>
		{@render children()}
	</a>
{:else if interativo}
	<button type="button" class="cartao interativo {elevado ? 'elevado' : ''} {classe}" style:view-transition-name={vt} aria-label={rotulo} {onclick} use:pressao={{ escala: 0.98 }}>
		{@render children()}
	</button>
{:else}
	<div class="cartao {elevado ? 'elevado' : ''} {classe}" style:view-transition-name={vt}>
		{@render children()}
	</div>
{/if}

<style>
	.cartao {
		display: block;
		width: 100%;
		text-align: left;
		background: var(--superficie-1);
		color: var(--texto);
		border: 1px solid var(--linha);
		border-radius: var(--raio-cartao);
		padding: var(--e-4);
		box-shadow: var(--sombra-1);
		text-decoration: none;
		font: inherit;
	}
	.elevado {
		box-shadow: var(--sombra-2);
	}
	.interativo {
		cursor: pointer;
		min-height: var(--alvo);
		transition:
			box-shadow var(--dur-padrao) var(--ease),
			border-color var(--dur-padrao) var(--ease);
		will-change: transform;
	}
	@media (hover: hover) {
		.interativo:hover {
			box-shadow: var(--sombra-2);
			border-color: var(--linha-forte);
		}
	}
</style>
