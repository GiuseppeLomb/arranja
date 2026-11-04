<script lang="ts">
	import type { Snippet } from 'svelte';
	import { pressao } from '#lib/motion/index.ts';

	type Props = {
		variante?: 'primaria' | 'destaque' | 'secundaria' | 'fantasma';
		tamanho?: 'normal' | 'grande' | 'gigante';
		href?: string;
		externo?: boolean;
		largo?: boolean;
		type?: 'button' | 'submit';
		disabled?: boolean;
		onclick?: (e: MouseEvent) => void;
		rotulo?: string;
		icone?: Snippet;
		iconeFim?: Snippet;
		children?: Snippet;
		classe?: string;
	};

	let {
		variante = 'primaria',
		tamanho = 'normal',
		href,
		externo = false,
		largo = false,
		type = 'button',
		disabled = false,
		onclick,
		rotulo,
		icone,
		iconeFim,
		children,
		classe = ''
	}: Props = $props();

	const cls = $derived(`botao ${variante} ${tamanho} ${largo ? 'largo' : ''} ${children ? '' : 'so-icone'} ${classe}`);
</script>

{#if href}
	<a
		{href}
		class={cls}
		aria-label={rotulo}
		target={externo ? '_blank' : undefined}
		rel={externo ? 'noopener noreferrer external' : undefined}
		{onclick}
		use:pressao
	>
		{@render icone?.()}
		{#if children}<span class="txt">{@render children()}</span>{/if}
		{@render iconeFim?.()}
	</a>
{:else}
	<button {type} class={cls} aria-label={rotulo} {disabled} {onclick} use:pressao>
		{@render icone?.()}
		{#if children}<span class="txt">{@render children()}</span>{/if}
		{@render iconeFim?.()}
	</button>
{/if}

<style>
	.botao {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--e-2);
		min-height: var(--alvo);
		min-width: var(--alvo);
		padding: 0 var(--e-5);
		border-radius: 14px;
		border: 2px solid transparent;
		font-family: var(--fonte-texto);
		font-weight: 700;
		font-size: var(--t-md);
		line-height: 1.2;
		text-decoration: none;
		cursor: pointer;
		user-select: none;
		transition:
			background-color var(--dur-micro) var(--ease),
			border-color var(--dur-micro) var(--ease),
			box-shadow var(--dur-micro) var(--ease);
		will-change: transform;
	}
	.botao :global(svg) {
		flex: none;
		width: 1.25em;
		height: 1.25em;
	}
	.txt {
		text-align: center;
	}
	.largo {
		width: 100%;
	}
	.so-icone {
		padding: 0;
	}

	.grande {
		min-height: var(--alvo-grande);
		font-size: var(--t-lg);
		padding: 0 var(--e-6);
	}
	.gigante {
		min-height: var(--alvo-gigante);
		font-size: var(--t-xl);
		padding: 0 var(--e-8);
		border-radius: 20px;
	}

	.primaria {
		background: var(--primaria);
		color: var(--sobre-primaria);
		box-shadow: var(--sombra-1);
	}
	.destaque {
		background: var(--destaque);
		color: var(--sobre-destaque);
		box-shadow: var(--sombra-1);
	}
	.secundaria {
		background: var(--superficie-1);
		color: var(--texto);
		border-color: var(--linha-forte);
	}
	.fantasma {
		background: transparent;
		color: var(--primaria);
	}

	@media (hover: hover) {
		.primaria:hover,
		.destaque:hover {
			box-shadow: var(--sombra-2);
		}
		.secundaria:hover,
		.fantasma:hover {
			background: var(--superficie-2);
		}
	}

	.botao:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		box-shadow: none;
	}
</style>
