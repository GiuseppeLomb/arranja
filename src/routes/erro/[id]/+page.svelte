<script lang="ts">
	import { resolve } from '$app/paths';
	import Stethoscope from '@lucide/svelte/icons/stethoscope';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import { onMount } from 'svelte';
	import BarraTopo from '#lib/componentes/BarraTopo.svelte';
	import BotaoFavorito from '#lib/componentes/BotaoFavorito.svelte';
	import ListaFontes from '#lib/componentes/ListaFontes.svelte';
	import AvisoExemplo from '#lib/componentes/AvisoExemplo.svelte';
	import { Button, Card, RiskBadge } from '#lib/design/index.ts';
	import { arvores, guias, familias, nomeMarca, nomeTipo } from '#lib/data/conteudo.ts';
	import { estadoCodigo } from '#lib/data/correspondencia.ts';
	import { selecao, carregarSelecao } from '#lib/estado/selecao.svelte.ts';
	import { entrar, cascata } from '#lib/motion/index.ts';

	let { data } = $props();
	const c = $derived(data.codigo);
	const arvore = $derived(c.arvore ? arvores.get(c.arvore) : undefined);
	const listaGuias = $derived((c.guias ?? []).map((g) => guias.get(g)).filter((g) => g !== undefined));
	// Estado para a marca/modelo escolhidos no fluxo guiado (lidos da sessão depois de montar).
	let montado = $state(false);
	onMount(() => {
		carregarSelecao();
		montado = true;
	});
	// Só conta a escolha do fluxo guiado se for o mesmo tipo de aparelho e a mesma marca do código.
	const mesmaMaquina = $derived(montado && selecao.tipo === c.appliance_type && selecao.marca?.id === c.brand);
	const modeloUtilizador = $derived(mesmaMaquina ? (selecao.modelo ?? null) : null);
	const confirmado = $derived(mesmaMaquina && estadoCodigo(c, familias, selecao.marca?.id ?? null, modeloUtilizador?.normalizado ?? null).confirmado);
	const manual = $derived(c.sources[0]);
</script>

<svelte:head>
	<title>Erro {c.code} {nomeMarca(c.brand)} · Arranja</title>
</svelte:head>

<BarraTopo titulo="Código de erro">
	{#snippet acoes()}<BotaoFavorito tipo="codigo" id={c.id} titulo="{c.code} · {nomeMarca(c.brand)}" />{/snippet}
</BarraTopo>

<div class="pilha-lg">
	<header class="cab" in:entrar>
		<span class="codigo">{c.code}</span>
		<div>
			<p class="marca">{nomeMarca(c.brand)}</p>
			<p class="tipo">{nomeTipo(c.appliance_type)}</p>
		</div>
	</header>
	{#if c.example}<AvisoExemplo />{/if}

	<section class="pilha" aria-labelledby="sig-t">
		<h2 id="sig-t" class="secao-titulo">O que significa</h2>
		<p class="descricao">{c.descricao}</p>
		{#if c.aliases?.length}<p class="nota">Também aparece como: {c.aliases.join(', ')}</p>{/if}
	</section>

	{#if arvore || listaGuias.length}
		<section class="pilha" aria-labelledby="fazer-t">
			<h2 id="fazer-t" class="secao-titulo">O que fazer</h2>
			{#if arvore}
				<Button variante="destaque" tamanho="grande" largo href={resolve('/diagnostico/[id]', { id: arvore.id })}>
					{#snippet icone()}<Stethoscope aria-hidden="true" />{/snippet}
					Fazer o diagnóstico
				</Button>
			{/if}
			<ul class="guias">
				{#each listaGuias as g, i (g.id)}
					<li in:entrar={{ delay: cascata(i) }}>
						<Card href={resolve('/guia/[id]', { id: g.id })} classe="item-guia">
							<BookOpen aria-hidden="true" class="ic" />
							<span class="txt"><strong>{g.titulo}</strong><RiskBadge nivel={g.risk_level} /></span>
							<ChevronRight aria-hidden="true" class="seta" />
						</Card>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<section class="pilha" aria-labelledby="aplica-t">
		<h2 id="aplica-t" class="secao-titulo">{c.ambito === 'sem-modelos' ? 'Indicado em' : 'Confirmado em'}</h2>
		<p>{c.ambito_nota}</p>
		{#if confirmado}
			<p class="estado ok"><CircleCheck aria-hidden="true" /> Confirmado para o teu modelo{modeloUtilizador ? ` (${modeloUtilizador.texto})` : ''}.</p>
		{:else if c.ambito === 'marca'}
			<p class="estado ok"><CircleCheck aria-hidden="true" /> A fonte indica que este código vale para todos os modelos {nomeMarca(c.brand)}.</p>
		{:else}
			<div class="estado aviso" role="note">
				<TriangleAlert aria-hidden="true" />
				<p>
					{#if c.ambito === 'sem-modelos'}
						A fonte não indica modelos: no teu pode ser diferente — confirma no manual.
					{:else if modeloUtilizador}
						No teu modelo ({modeloUtilizador.texto}) pode ser diferente — confirma no manual.
					{:else if mesmaMaquina}
						Indica o modelo no passo «Modelo» para saberes se está confirmado para o teu; noutros modelos pode ser diferente — confirma no manual.
					{:else}
						Noutros modelos pode ser diferente — confirma no manual.
					{/if}
					<a href={manual.url} target="_blank" rel="noopener noreferrer external">Abrir a fonte <ExternalLink aria-hidden="true" class="ext" /></a>
				</p>
			</div>
		{/if}
	</section>

	<ListaFontes fontes={c.sources} />
</div>

<style>
	.cab {
		display: flex;
		align-items: center;
		gap: var(--e-4);
	}
	.codigo {
		display: grid;
		place-items: center;
		min-width: 96px;
		height: 96px;
		padding: 0 var(--e-4);
		border-radius: 24px;
		background: var(--grafite);
		color: #ffffff;
		font-family: ui-monospace, 'Cascadia Code', Consolas, monospace;
		font-size: var(--t-2xl);
		font-weight: 700;
		letter-spacing: 0.04em;
	}
	:global([data-theme='dark']) .codigo {
		background: var(--superficie-3);
		color: var(--texto);
	}
	.marca {
		font-family: var(--fonte-titulo);
		font-weight: 700;
		font-size: var(--t-xl);
	}
	.tipo,
	.nota {
		color: var(--texto-suave);
		font-size: var(--t-sm);
	}
	.descricao {
		font-size: var(--t-lg);
	}
	.guias {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--e-2);
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
		align-items: flex-start;
		gap: var(--e-2);
	}
	.estado {
		display: flex;
		align-items: flex-start;
		gap: var(--e-2);
		padding: var(--e-3);
		border-radius: 16px;
		font-size: var(--t-sm);
	}
	.estado :global(svg) {
		flex: none;
		width: 20px;
		height: 20px;
	}
	.estado.ok {
		background: var(--superficie-2);
		font-weight: 700;
	}
	.estado.ok :global(svg) {
		color: var(--primaria);
	}
	.estado.aviso {
		background: var(--superficie-2);
		border: 1px solid var(--linha);
	}
	.estado.aviso a {
		font-weight: 700;
		white-space: nowrap;
	}
	.estado.aviso :global(.ext) {
		display: inline;
		width: 14px;
		height: 14px;
		vertical-align: -2px;
	}
</style>
