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
		vt?: string;
	};
	let { titulo, voltar, onvoltar, semVoltar = false, acoes, vt }: Props = $props();

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
	<h1 style:view-transition-name={vt}>{titulo}</h1>
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
	h1 {
		flex: 1;
		font-size: var(--t-xl);
		min-width: 0;
	}
	.acoes {
		display: flex;
		gap: var(--e-1);
	}
</style>
