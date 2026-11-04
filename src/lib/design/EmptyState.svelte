<script lang="ts">
	import type { Snippet } from 'svelte';
	import { entrar } from '#lib/motion/index.ts';

	type Props = { titulo: string; texto?: string; icone?: Snippet; children?: Snippet; nivel?: 'h1' | 'h2' | 'h3' };
	let { titulo, texto, icone, children, nivel = 'h2' }: Props = $props();
</script>

<div class="vazio" in:entrar>
	{#if icone}<div class="icone" aria-hidden="true">{@render icone()}</div>{/if}
	<svelte:element this={nivel} class="titulo">{titulo}</svelte:element>
	{#if texto}<p>{texto}</p>{/if}
	{#if children}<div class="acoes">{@render children()}</div>{/if}
</div>

<style>
	.vazio {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: var(--e-3);
		padding: var(--e-8) var(--e-4);
		border: 2px dashed var(--linha);
		border-radius: var(--raio-cartao);
	}
	.icone {
		display: grid;
		place-items: center;
		width: 72px;
		height: 72px;
		border-radius: 50%;
		background: var(--superficie-2);
		color: var(--primaria);
	}
	.icone :global(svg) {
		width: 36px;
		height: 36px;
	}
	.titulo {
		font-size: var(--t-lg);
	}
	p {
		color: var(--texto-suave);
		max-width: 40ch;
	}
	.acoes {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--e-3);
		margin-top: var(--e-2);
	}
</style>
