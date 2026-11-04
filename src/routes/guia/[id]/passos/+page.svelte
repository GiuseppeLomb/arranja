<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { browser } from '$app/env';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Check from '@lucide/svelte/icons/check';
	import Wrench from '@lucide/svelte/icons/wrench';
	import X from '@lucide/svelte/icons/x';
	import SunMedium from '@lucide/svelte/icons/sun-medium';
	import IlustracaoFerramenta from '#lib/ilustracoes/IlustracaoFerramenta.svelte';
	import { Button, ProgressBar, StepCard, Sheet } from '#lib/design/index.ts';
	import { ferramentas, tipos } from '#lib/data/conteudo.ts';
	import { PASSO_SEGURANCA } from '#lib/data/perigos.ts';
	import type { Passo } from '#lib/data/tipos.ts';
	import { preferencias, carregarPreferencias, definirOficina } from '#lib/estado/preferencias.svelte.ts';
	import { deslizar, vibrar, movimento, easePadrao, DUR } from '#lib/motion/index.ts';
	import { fly, fade } from 'svelte/transition';

	let { data } = $props();
	const guia = $derived(data.guia);

	const usaAgua = $derived(tipos.get(guia.appliance_type)?.usa_agua ?? false);
	const passos = $derived<Passo[]>([{ texto: PASSO_SEGURANCA }, ...guia.passos]);
	const total = $derived(passos.length);

	let indice = $state(0);
	let direcao = $state(1);
	let feitos = $state<boolean[]>([]);
	let mostrarMaterial = $state(false);

	// Guias proibidos não têm passos: volta à página do guia.
	onMount(() => {
		carregarPreferencias();
		if (guia.risk_level === 'proibido' || guia.passos.length === 0) goto(resolve('/guia/[id]', { id: guia.id }), { replaceState: true });
	});

	// ---------- Modo Oficina: Wake Lock + letra maior + botões gigantes ----------
	let trinco: WakeLockSentinel | null = null;
	let wakeLockAtivo = $state(false);

	async function pedirTrinco() {
		try {
			if (!('wakeLock' in navigator)) return;
			trinco = await navigator.wakeLock.request('screen');
			wakeLockAtivo = true;
			trinco.addEventListener('release', () => (wakeLockAtivo = false));
		} catch {
			wakeLockAtivo = false;
		}
	}

	function largarTrinco() {
		trinco?.release().catch(() => {});
		trinco = null;
		wakeLockAtivo = false;
	}

	$effect(() => {
		if (!browser) return;
		document.documentElement.dataset.oficina = String(preferencias.oficina);
		if (preferencias.oficina) pedirTrinco();
		else largarTrinco();
	});

	function aoMudarVisibilidade() {
		if (document.visibilityState === 'visible' && preferencias.oficina) pedirTrinco();
	}

	onDestroy(() => {
		if (!browser) return;
		largarTrinco();
		delete document.documentElement.dataset.oficina;
	});

	// ---------- Navegação entre passos ----------
	function seguinte() {
		if (indice < total - 1) {
			direcao = 1;
			indice++;
		}
	}
	function anterior() {
		if (indice > 0) {
			direcao = -1;
			indice--;
		}
	}
	function concluir() {
		feitos[indice] = true;
		vibrar(30);
		if (indice === total - 1) goto(resolve('/guia/[id]/arranjado', { id: guia.id }));
		else seguinte();
	}

	function teclas(e: KeyboardEvent) {
		if ((e.target as HTMLElement).closest('input, textarea, dialog')) return;
		if (e.key === 'ArrowRight') seguinte();
		if (e.key === 'ArrowLeft') anterior();
	}

	const entrada = (node: Element) =>
		movimento.reduzido
			? fade(node, { duration: 120 })
			: fly(node, { x: 48 * direcao, duration: DUR.padrao, easing: easePadrao, opacity: 0 });
	const saida = (node: Element) =>
		movimento.reduzido ? fade(node, { duration: 80 }) : fly(node, { x: -48 * direcao, duration: DUR.micro, easing: easePadrao, opacity: 0 });
</script>

<svelte:window onkeydown={teclas} />
<svelte:document onvisibilitychange={aoMudarVisibilidade} />

<svelte:head>
	<title>Passo {indice + 1} · {guia.titulo} · Arranja</title>
</svelte:head>

<div class="ecra" class:oficina={preferencias.oficina}>
	<header class="topo">
		<a class="sair" href={resolve('/guia/[id]', { id: guia.id })} aria-label="Sair do guia"><X aria-hidden="true" /></a>
		<div class="progresso">
			<ProgressBar valor={(indice + 1) / total} rotulo="Progresso do guia" texto="{indice + 1}/{total}" />
		</div>
		<button type="button" class="material" onclick={() => (mostrarMaterial = true)} aria-label="Ferramentas e peças">
			<Wrench aria-hidden="true" />
		</button>
	</header>

	<label class="interruptor">
		<input type="checkbox" role="switch" checked={preferencias.oficina} onchange={(e) => definirOficina(e.currentTarget.checked)} />
		<span class="pista" aria-hidden="true"><span class="botao"></span></span>
		<span class="txt">
			<strong>Modo Oficina</strong>
			<span>
				Letra maior e ecrã sempre ligado{#if preferencias.oficina && wakeLockAtivo}&nbsp;<SunMedium aria-hidden="true" class="sol" /> ativo{:else if preferencias.oficina}{' '}(o ecrã pode apagar-se neste browser){/if}
			</span>
		</span>
	</label>

	<div
		class="palco"
		use:deslizar={{ podeAvancar: indice < total - 1, podeRecuar: indice > 0, aoAvancar: seguinte, aoRecuar: anterior }}
		aria-roledescription="carrossel"
		aria-label="Passos do guia"
	>
		{#key indice}
			<div class="slot" in:entrada out:saida>
				<StepCard
					numero={indice + 1}
					{total}
					passo={passos[indice]}
					automatico={indice === 0}
					detalhe={indice === 0
						? usaAgua
							? 'Tira a ficha da tomada e fecha a torneira de alimentação de água.'
							: 'Tira a ficha da tomada. Desligar só no botão não chega.'
						: undefined}
				/>
			</div>
		{/key}
	</div>

	<p class="dica" aria-hidden="true">Desliza para o lado para mudar de passo</p>

	<nav class="botoes" aria-label="Navegar entre passos">
		<Button variante="secundaria" tamanho={preferencias.oficina ? 'gigante' : 'grande'} disabled={indice === 0} onclick={anterior} rotulo="Passo anterior">
			{#snippet icone()}<ArrowLeft aria-hidden="true" />{/snippet}
		</Button>
		<Button variante="destaque" tamanho={preferencias.oficina ? 'gigante' : 'grande'} largo onclick={concluir}>
			{#snippet icone()}<Check aria-hidden="true" />{/snippet}
			{indice === total - 1 ? 'Concluir' : 'Feito, seguinte'}
		</Button>
		{#if indice < total - 1}
			<Button variante="secundaria" tamanho={preferencias.oficina ? 'gigante' : 'grande'} onclick={seguinte} rotulo="Saltar para o passo seguinte">
				{#snippet icone()}<ArrowRight aria-hidden="true" />{/snippet}
			</Button>
		{/if}
	</nav>
</div>

<Sheet bind:aberto={mostrarMaterial} titulo="Ferramentas e peças">
	<div class="pilha">
		{#if guia.ferramentas.length}
			<h3 class="secao-titulo">Ferramentas</h3>
			<ul class="lista-material">
				{#each guia.ferramentas as fid (fid)}
					<li><IlustracaoFerramenta id={fid} tamanho={36} /> {ferramentas.get(fid)?.nome ?? fid}</li>
				{/each}
			</ul>
		{/if}
		{#if guia.pecas.length}
			<h3 class="secao-titulo">Peças</h3>
			<ul class="lista-material">
				{#each guia.pecas as p (p.nome)}
					<li>{p.nome}{#if p.codigo_oficial}&nbsp;· <code>{p.codigo_oficial}</code>{/if}</li>
				{/each}
			</ul>
		{/if}
	</div>
</Sheet>

<style>
	.ecra {
		display: flex;
		flex-direction: column;
		gap: var(--e-4);
		min-height: calc(100dvh - var(--e-8));
	}
	.topo {
		display: flex;
		align-items: center;
		gap: var(--e-2);
	}
	.progresso {
		flex: 1;
	}
	.sair,
	.material {
		flex: none;
		display: grid;
		place-items: center;
		width: var(--alvo);
		height: var(--alvo);
		border: 0;
		border-radius: 50%;
		background: var(--superficie-2);
		color: var(--texto);
	}
	.sair :global(svg),
	.material :global(svg) {
		width: 22px;
		height: 22px;
	}
	.interruptor {
		display: flex;
		align-items: center;
		gap: var(--e-3);
		min-height: var(--alvo);
		cursor: pointer;
	}
	.interruptor input {
		position: absolute;
		opacity: 0;
		width: 1px;
		height: 1px;
	}
	.pista {
		flex: none;
		position: relative;
		width: 52px;
		height: 32px;
		border-radius: 999px;
		background: var(--superficie-3);
		border: 2px solid var(--linha-forte);
		transition: background-color var(--dur-micro) var(--ease);
	}
	.botao {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: var(--superficie-1);
		box-shadow: var(--sombra-1);
		transition: transform var(--dur-padrao) var(--ease);
	}
	.interruptor input:checked + .pista {
		background: var(--primaria);
		border-color: var(--primaria);
	}
	.interruptor input:checked + .pista .botao {
		transform: translateX(20px);
	}
	.interruptor input:focus-visible + .pista {
		outline: 3px solid var(--foco);
		outline-offset: 2px;
	}
	.txt {
		display: flex;
		flex-direction: column;
		line-height: 1.3;
	}
	.txt span {
		font-size: var(--t-sm);
		color: var(--texto-suave);
	}
	.txt :global(.sol) {
		display: inline;
		width: 14px;
		height: 14px;
		vertical-align: -2px;
	}
	.palco {
		display: grid;
		flex: 1;
		align-items: start;
		will-change: transform;
		user-select: none;
	}
	.slot {
		grid-area: 1 / 1;
	}
	.dica {
		text-align: center;
		font-size: var(--t-xs);
		color: var(--texto-suave);
	}
	.botoes {
		position: sticky;
		bottom: calc(env(safe-area-inset-bottom) + var(--e-3));
		display: flex;
		gap: var(--e-2);
		padding: var(--e-2);
		margin: 0 calc(var(--e-2) * -1);
		border-radius: 24px;
		background: color-mix(in srgb, var(--fundo) 85%, transparent);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
	}
	.oficina .botoes {
		gap: var(--e-3);
	}
	.lista-material {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--e-2);
	}
	.lista-material li {
		display: flex;
		align-items: center;
		gap: var(--e-3);
		color: var(--texto);
	}
	.lista-material :global(svg) {
		color: var(--primaria);
	}
	code {
		font-family: ui-monospace, Consolas, monospace;
		background: var(--superficie-2);
		padding: 0.1em 0.4em;
		border-radius: 6px;
	}
	@media (prefers-reduced-motion: reduce) {
		.botao,
		.pista {
			transition: none;
		}
	}
</style>
