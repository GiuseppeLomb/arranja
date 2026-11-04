<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { pressao } from '#lib/motion/index.ts';

	type Props = {
		titulo: string;
		/** Destino do botão voltar; se omitido usa o histórico. */
		voltar?: string;
		onvoltar?: () => void;
		semVoltar?: boolean;
		acoes?: Snippet;
		/** Ícone junto ao título (faz parte da transição partilhada). */
		icone?: Snippet;
		vt?: string;
	};
	let { titulo, voltar, onvoltar, semVoltar = false, acoes, icone, vt }: Props = $props();

	function recuar(e: MouseEvent) {
		if (onvoltar) {
			e.preventDefault();
			onvoltar();
			return;
		}
		if (!voltar && history.length > 1) {
			e.preventDefault();
			history.back();
		}
	}
</script>

<header class="topo">
	{#if !semVoltar}
		<a class="voltar" href={voltar ?? resolve('/')} aria-label="Voltar" onclick={recuar} use:pressao>
			<ArrowLeft aria-hidden="true" />
		</a>
	{/if}
	<div class="titulo" style:view-transition-name={vt}>
		{#if icone}<span class="icone" aria-hidden="true">{@render icone()}</span>{/if}
		<h1>{titulo}</h1>
	</div>
	{#if acoes}<div class="acoes">{@render acoes()}</div>{/if}
</header>

<style>
	.topo {
		display: flex;
		align-items: center;
		gap: var(--e-2);
		min-height: var(--alvo-grande);
		margin-bottom: var(--e-4);
	}
	.voltar {
		flex: none;
		display: grid;
		place-items: center;
		width: var(--alvo);
		height: var(--alvo);
		margin-left: calc(var(--e-2) * -1);
		border-radius: 50%;
		color: var(--texto);
	}
	.voltar :global(svg) {
		width: 24px;
		height: 24px;
	}
	@media (hover: hover) {
		.voltar:hover {
			background: var(--superficie-2);
		}
	}
	.titulo {
		flex: 1;
		display: flex;
		align-items: center;
		gap: var(--e-3);
		min-width: 0;
	}
	.icone {
		flex: none;
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: 14px;
		background: var(--superficie-2);
		color: var(--primaria);
	}
	h1 {
		font-size: var(--t-xl);
		min-width: 0;
	}
	.acoes {
		display: flex;
		gap: var(--e-1);
	}
</style>
