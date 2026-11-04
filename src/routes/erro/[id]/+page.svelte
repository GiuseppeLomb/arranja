<script lang="ts">
	import { resolve } from '$app/paths';
	import Stethoscope from '@lucide/svelte/icons/stethoscope';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import BarraTopo from '#lib/componentes/BarraTopo.svelte';
	import BotaoFavorito from '#lib/componentes/BotaoFavorito.svelte';
	import ListaFontes from '#lib/componentes/ListaFontes.svelte';
	import AvisoExemplo from '#lib/componentes/AvisoExemplo.svelte';
	import { Button, Card, RiskBadge } from '#lib/design/index.ts';
	import { arvores, guias, familias, nomeMarca, nomeTipo } from '#lib/data/conteudo.ts';
	import { descreverAplicacao } from '#lib/data/correspondencia.ts';
	import { entrar, cascata } from '#lib/motion/index.ts';

	let { data } = $props();
	const c = $derived(data.codigo);
	const arvore = $derived(c.arvore ? arvores.get(c.arvore) : undefined);
	const listaGuias = $derived((c.guias ?? []).map((g) => guias.get(g)).filter((g) => g !== undefined));
	const aplica = $derived(c.aplicavel_a ? descreverAplicacao(c.aplicavel_a, familias, nomeMarca) : [`${nomeMarca(c.brand)}: todos os modelos`]);
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
		<h2 id="aplica-t" class="secao-titulo">Aplica-se a</h2>
		<ul class="aplica">
			{#each aplica as a (a)}<li>{a}</li>{/each}
		</ul>
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
	.aplica {
		padding-left: 1.2em;
	}
</style>
