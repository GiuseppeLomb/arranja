<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { pushState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Phone from '@lucide/svelte/icons/phone';
	import FileSearch from '@lucide/svelte/icons/file-search';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import BarraTopo from '#lib/componentes/BarraTopo.svelte';
	import BotaoFavorito from '#lib/componentes/BotaoFavorito.svelte';
	import ListaFontes from '#lib/componentes/ListaFontes.svelte';
	import AvisoExemplo from '#lib/componentes/AvisoExemplo.svelte';
	import { Button, Card, EmptyState, RiskBadge } from '#lib/design/index.ts';
	import { guias, nomeTipo } from '#lib/data/conteudo.ts';
	import { carregarSelecao, definirUltimaArvore } from '#lib/estado/selecao.svelte.ts';
	import { comTransicao, entrar, cascata, suportaVT, entrarEcra } from '#lib/motion/index.ts';

	let { data } = $props();
	const arvore = $derived(data.arvore);

	const idNo = $derived(page.state.no ?? arvore.inicio);
	const no = $derived(arvore.nos[idNo] ?? arvore.nos[arvore.inicio]);
	const caminho = $derived(page.state.caminho ?? []);
	let montado = $state(false);

	onMount(() => {
		carregarSelecao();
		definirUltimaArvore(arvore.id);
		montado = true;
	});

	async function responder(destino: string) {
		document.documentElement.dataset.direcao = 'avancar';
		await comTransicao(() => pushState('', { no: destino, caminho: [...caminho, idNo] }));
	}

	async function recomecar() {
		document.documentElement.dataset.direcao = 'recuar';
		await comTransicao(() => pushState('', { no: arvore.inicio, caminho: [] }));
	}

	function anterior() {
		document.documentElement.dataset.direcao = 'recuar';
		history.back();
	}

	const animar = (node: Element) => (suportaVT() || !montado ? { duration: 0 } : entrarEcra(node, { x: 24, y: 0 }));
</script>

<svelte:head>
	<title>{arvore.sintoma} · Diagnóstico · Arranja</title>
</svelte:head>

<BarraTopo titulo="Diagnóstico">
	{#snippet acoes()}<BotaoFavorito tipo="arvore" id={arvore.id} titulo={arvore.sintoma} />{/snippet}
</BarraTopo>

<div class="pilha-lg">
	<div class="pilha">
		<p class="contexto">{nomeTipo(arvore.appliance_type)} · {arvore.sintoma}</p>
		{#if arvore.example}<AvisoExemplo />{/if}
	</div>

	{#key idNo}
		<section class="no" in:animar aria-live="polite">
			{#if no.tipo === 'pergunta'}
				<p class="contador">Pergunta {caminho.length + 1}</p>
				<h2 class="pergunta">{no.texto}</h2>
				{#if no.ajuda}<p class="ajuda">{no.ajuda}</p>{/if}
				<ul class="respostas">
					{#each no.respostas as r, i (r.ir_para + r.texto)}
						<li in:entrar={{ delay: cascata(i) }}>
							<Button variante="secundaria" tamanho="grande" largo onclick={() => responder(r.ir_para)}>{r.texto}</Button>
						</li>
					{/each}
				</ul>
			{:else if no.tipo === 'guia'}
				<div class="final">
					<CircleCheck aria-hidden="true" class="ic-final ok" />
					<h2>{no.guias.length > 1 ? 'Há guias para isto' : 'Há um guia para isto'}</h2>
					{#if no.nota}<p>{no.nota}</p>{/if}
				</div>
				<ul class="guias">
					{#each no.guias as gid, i (gid)}
						{@const g = guias.get(gid)}
						{#if g}
							<li in:entrar={{ delay: cascata(i) }}>
								<Card href={resolve('/guia/[id]', { id: g.id })} classe="item-guia" elevado>
									<BookOpen aria-hidden="true" class="ic" />
									<span class="txt">
										<strong>{g.titulo}</strong>
										<span class="meta"><RiskBadge nivel={g.risk_level} /> ≈ {g.tempo_estimado} min</span>
									</span>
									<ChevronRight aria-hidden="true" class="seta" />
								</Card>
							</li>
						{/if}
					{/each}
				</ul>
			{:else if no.tipo === 'tecnico'}
				<div class="final tecnico">
					<Phone aria-hidden="true" class="ic-final" />
					<h2>Chama um técnico</h2>
					<p>{no.motivo}</p>
					<Button variante="secundaria" href={resolve('/seguranca')}>Porquê? Regras de segurança</Button>
				</div>
			{:else}
				<EmptyState
					titulo="Dados insuficientes"
					texto={no.nota ?? 'Ainda não temos informação verificada para continuar este diagnóstico.'}
				>
					{#snippet icone()}<FileSearch />{/snippet}
					<Button variante="destaque" href={resolve('/contribuir')}>Contribuir</Button>
				</EmptyState>
			{/if}
		</section>
	{/key}

	<div class="navegacao">
		{#if caminho.length > 0}
			<Button variante="fantasma" onclick={anterior}>
				{#snippet icone()}<ArrowLeft aria-hidden="true" />{/snippet}
				Pergunta anterior
			</Button>
			<Button variante="fantasma" onclick={recomecar}>
				{#snippet icone()}<RotateCcw aria-hidden="true" />{/snippet}
				Recomeçar
			</Button>
		{/if}
	</div>

	<ListaFontes fontes={arvore.sources} />
</div>

<style>
	.contexto {
		font-weight: 700;
		color: var(--texto-suave);
	}
	.no {
		display: flex;
		flex-direction: column;
		gap: var(--e-4);
	}
	.contador {
		font-size: var(--t-sm);
		font-weight: 700;
		color: var(--destaque-texto);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.pergunta {
		font-size: var(--t-2xl);
	}
	.ajuda {
		color: var(--texto-suave);
	}
	.respostas,
	.guias {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--e-3);
		margin-top: var(--e-2);
	}
	.final {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--e-3);
	}
	.tecnico {
		padding: var(--e-6);
		border-radius: var(--raio-cartao);
		background: var(--superficie-1);
		border: 1px solid var(--linha);
		box-shadow: var(--sombra-1);
	}
	.final :global(.ic-final) {
		width: 40px;
		height: 40px;
		color: var(--primaria);
	}
	:global(.item-guia) {
		display: flex !important;
		align-items: center;
		gap: var(--e-3);
	}
	:global(.item-guia .ic) {
		flex: none;
		width: 24px;
		height: 24px;
		color: var(--primaria);
	}
	:global(.item-guia .seta) {
		flex: none;
		width: 20px;
		height: 20px;
		color: var(--texto-suave);
	}
	.txt {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--e-1);
	}
	.meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--e-2);
		font-size: var(--t-sm);
		color: var(--texto-suave);
	}
	.navegacao {
		display: flex;
		flex-wrap: wrap;
		gap: var(--e-2);
	}
</style>
