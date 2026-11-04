<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import PartyPopper from '@lucide/svelte/icons/party-popper';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import House from '@lucide/svelte/icons/house';
	import BotaoFavorito from '#lib/componentes/BotaoFavorito.svelte';
	import { Button } from '#lib/design/index.ts';
	import { selecao, carregarSelecao } from '#lib/estado/selecao.svelte.ts';
	import { surgir, entrar, movimento } from '#lib/motion/index.ts';

	let { data } = $props();
	const guia = $derived(data.guia);

	onMount(() => {
		carregarSelecao();
		if (movimento.reduzido) return;
		// Celebração curta e discreta (canvas-confetti carregado só aqui)
		const t = setTimeout(async () => {
			const { default: confetti } = await import('canvas-confetti');
			confetti({
				particleCount: 70,
				spread: 70,
				startVelocity: 38,
				ticks: 140,
				origin: { y: 0.35 },
				colors: ['#D9772B', '#14302B', '#8CCFBF', '#F6F1E9'],
				disableForReducedMotion: true
			});
		}, 250);
		return () => clearTimeout(t);
	});

	const naoResultou = $derived(
		selecao.ultimaArvore
			? resolve('/diagnostico/[id]', { id: selecao.ultimaArvore })
			: resolve('/reparar/[tipo]', { tipo: selecao.tipo ?? guia.appliance_type })
	);
</script>

<svelte:head>
	<title>Arranjado! · Arranja</title>
</svelte:head>

<div class="arranjado">
	<div class="emblema" in:surgir={{ duration: 350 }}>
		<PartyPopper aria-hidden="true" />
	</div>
	<h1 in:entrar={{ delay: 80 }}>Arranjado!</h1>
	<p class="texto" in:entrar={{ delay: 140 }}>Boa. Menos um eletrodoméstico no lixo.</p>
	<p class="guia" in:entrar={{ delay: 180 }}>{guia.titulo}</p>

	<div class="acoes" in:entrar={{ delay: 220 }}>
		<Button variante="primaria" tamanho="grande" largo href={resolve('/')}>
			{#snippet icone()}<House aria-hidden="true" />{/snippet}
			Voltar ao início
		</Button>
		<Button variante="secundaria" tamanho="grande" largo href={naoResultou}>
			{#snippet icone()}<RotateCcw aria-hidden="true" />{/snippet}
			Não resultou?
		</Button>
		<div class="fav">
			<span>Guardar este guia</span>
			<BotaoFavorito tipo="guia" id={guia.id} titulo={guia.titulo} />
		</div>
	</div>
</div>

<style>
	.arranjado {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: var(--e-4);
		padding-top: var(--e-12);
	}
	.emblema {
		display: grid;
		place-items: center;
		width: 112px;
		height: 112px;
		border-radius: 50%;
		background: var(--destaque);
		color: var(--sobre-destaque);
		box-shadow: var(--sombra-2);
	}
	.emblema :global(svg) {
		width: 56px;
		height: 56px;
	}
	h1 {
		font-size: var(--t-3xl);
		color: var(--primaria);
	}
	.texto {
		font-size: var(--t-lg);
	}
	.guia {
		color: var(--texto-suave);
		font-size: var(--t-sm);
	}
	.acoes {
		display: flex;
		flex-direction: column;
		gap: var(--e-3);
		width: 100%;
		margin-top: var(--e-6);
	}
	.fav {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--e-2);
		color: var(--texto-suave);
		font-weight: 700;
	}
</style>
