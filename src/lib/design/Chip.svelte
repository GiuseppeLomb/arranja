<script lang="ts">
	import type { Snippet } from 'svelte';
	import { pressao } from '#lib/motion/index.ts';

	type Props = {
		href?: string;
		onclick?: (e: MouseEvent) => void;
		selecionado?: boolean;
		/** Âmbar neutro: «fonte por confirmar». Não é uma cor de risco. */
		aviso?: boolean;
		vt?: string;
		icone?: Snippet;
		children: Snippet;
	};

	let { href, onclick, selecionado, aviso, vt, icone, children }: Props = $props();
</script>

{#if href}
	<a {href} class="chip" class:sel={selecionado} class:aviso style:view-transition-name={vt} aria-current={selecionado ? 'true' : undefined} use:pressao>
		{@render icone?.()}<span>{@render children()}</span>
	</a>
{:else if onclick}
	<button type="button" class="chip" class:sel={selecionado} class:aviso style:view-transition-name={vt} aria-pressed={selecionado} {onclick} use:pressao>
		{@render icone?.()}<span>{@render children()}</span>
	</button>
{:else}
	<span class="chip estatico" class:sel={selecionado} class:aviso style:view-transition-name={vt}>
		{@render icone?.()}<span>{@render children()}</span>
	</span>
{/if}

<style>
	.chip.aviso:not(.sel) {
		background: var(--aviso-fundo);
		border-color: var(--aviso-linha);
	}
	@media (hover: hover) {
		button.chip.aviso:not(.sel):hover,
		a.chip.aviso:not(.sel):hover {
			background: var(--aviso-fundo);
			border-color: var(--aviso-icone);
		}
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: var(--e-2);
		min-height: var(--alvo);
		padding: 0 var(--e-4);
		border-radius: var(--raio-chip);
		border: 1px solid var(--linha);
		background: var(--superficie-2);
		color: var(--texto);
		font-weight: 700;
		font-size: var(--t-md);
		text-decoration: none;
		white-space: nowrap;
		transition:
			background-color var(--dur-micro) var(--ease),
			border-color var(--dur-micro) var(--ease);
		will-change: transform;
	}
	.estatico {
		min-height: 36px;
		padding: 0 var(--e-3);
		font-size: var(--t-sm);
	}
	.chip :global(svg) {
		width: 1.1em;
		height: 1.1em;
		flex: none;
	}
	.sel {
		background: var(--primaria);
		color: var(--sobre-primaria);
		border-color: var(--primaria);
	}
	@media (hover: hover) {
		button.chip:not(.sel):hover,
		a.chip:not(.sel):hover {
			background: var(--superficie-3);
			border-color: var(--linha-forte);
		}
	}
</style>
