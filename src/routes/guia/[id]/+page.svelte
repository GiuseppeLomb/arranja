<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import Clock from '@lucide/svelte/icons/clock';
	import Ban from '@lucide/svelte/icons/ban';
	import Phone from '@lucide/svelte/icons/phone';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import CircleQuestionMark from '@lucide/svelte/icons/circle-question-mark';
	import BarraTopo from '#lib/componentes/BarraTopo.svelte';
	import BotaoFavorito from '#lib/componentes/BotaoFavorito.svelte';
	import ListaFontes from '#lib/componentes/ListaFontes.svelte';
	import AvisoExemplo from '#lib/componentes/AvisoExemplo.svelte';
	import IlustracaoFerramenta from '#lib/ilustracoes/IlustracaoFerramenta.svelte';
	import { Button, RiskBadge } from '#lib/design/index.ts';
	import { ferramentas, familias, marcas, nomeMarca, nomeTipo, tipos } from '#lib/data/conteudo.ts';
	import { corresponde, descreverAplicacao } from '#lib/data/correspondencia.ts';
	import { TEXTO_PERIGO } from '#lib/data/perigos.ts';
	import { selecao, carregarSelecao } from '#lib/estado/selecao.svelte.ts';
	import { entrar, cascata } from '#lib/motion/index.ts';

	let { data } = $props();
	const guia = $derived(data.guia);
	const proibido = $derived(guia.risk_level === 'proibido');

	onMount(carregarSelecao);

	const aplicacao = $derived(descreverAplicacao(guia.aplicavel_a, familias, nomeMarca));
	const compat = $derived.by(() => {
		if (!selecao.marca || selecao.tipo !== guia.appliance_type) return null;
		const c = corresponde(guia.aplicavel_a, familias, selecao.marca.id, selecao.modelo?.normalizado ?? null);
		return { c, rotulo: `${selecao.marca.nome} ${selecao.modelo?.texto ?? ''}`.trim() };
	});

	const avisos = $derived([...(guia.perigos ?? []).map((p) => TEXTO_PERIGO[p]).filter(Boolean), ...(guia.avisos ?? [])]);
	let marcados = $state<Record<string, boolean>>({});
	let li = $state(false);
	const paginaPecasMarca = $derived(guia.aplicavel_a.map((r) => marcas.get(r.brand)?.pagina_pecas).find(Boolean));
</script>

<svelte:head>
	<title>{guia.titulo} · Arranja</title>
</svelte:head>

<BarraTopo titulo={proibido ? 'Não fazer em casa' : 'Antes de começar'}>
	{#snippet acoes()}<BotaoFavorito tipo="guia" id={guia.id} titulo={guia.titulo} />{/snippet}
</BarraTopo>

<div class="pilha-lg">
	<header class="cabecalho" in:entrar>
		<p class="tipo">{nomeTipo(guia.appliance_type)}</p>
		<h2 class="titulo">{guia.titulo}</h2>
		{#if guia.resumo}<p class="resumo">{guia.resumo}</p>{/if}
		<div class="meta">
			<RiskBadge nivel={guia.risk_level} grande />
			{#if !proibido}<span class="tempo"><Clock aria-hidden="true" /> ≈ {guia.tempo_estimado} min</span>{/if}
		</div>
		{#if guia.example}<AvisoExemplo />{/if}
	</header>

	{#if compat}
		<p class="compat" class:ok={compat.c} in:entrar={{ delay: 60 }}>
			{#if compat.c}
				<CircleCheck aria-hidden="true" />
				<span>
					Aplica-se a <strong>{compat.rotulo}</strong>
					{#if compat.c.nivel === 'familia' && compat.c.familia}(família {compat.c.familia.nome}){:else if compat.c.padrao}(padrão {compat.c.padrao}){/if}
				</span>
			{:else}
				<CircleQuestionMark aria-hidden="true" />
				<span>Não confirmámos que este guia se aplica a <strong>{compat.rotulo}</strong>. Verifica a lista abaixo antes de começar.</span>
			{/if}
		</p>
	{/if}

	{#if proibido}
		<section class="perigo" aria-labelledby="perigo-t" in:entrar={{ delay: 60 }}>
			<Ban aria-hidden="true" class="ic-perigo" />
			<h2 id="perigo-t">Este trabalho não é para fazer em casa</h2>
			<p>{guia.explicacao_perigo}</p>
			{#if avisos.length}
				<ul>
					{#each avisos as a (a)}<li>{a}</li>{/each}
				</ul>
			{/if}
			<p class="recomendacao"><Phone aria-hidden="true" /> <strong>Recomendação: chama um técnico qualificado.</strong></p>
			<Button variante="secundaria" href={resolve('/seguranca')}>Regras de segurança</Button>
		</section>
	{:else}
		<section class="pilha" aria-labelledby="avisos-t">
			<h3 id="avisos-t" class="secao-titulo">Avisos de risco</h3>
			<ul class="avisos">
				{#each avisos as a, i (a)}
					<li in:entrar={{ delay: cascata(i) }}><TriangleAlert aria-hidden="true" /> <span>{a}</span></li>
				{/each}
				<li><TriangleAlert aria-hidden="true" /> <span>O primeiro passo é sempre: desligar da corrente{tipos.get(guia.appliance_type)?.usa_agua ? ' e fechar a água' : ''}.</span></li>
			</ul>
		</section>

		{#if guia.ferramentas.length}
			<section class="pilha" aria-labelledby="ferr-t">
				<h3 id="ferr-t" class="secao-titulo">Ferramentas</h3>
				<ul class="checklist">
					{#each guia.ferramentas as fid, i (fid)}
						{@const f = ferramentas.get(fid)}
						<li in:entrar={{ delay: cascata(i) }}>
							<label class="item" class:feito={marcados[fid]}>
								<input type="checkbox" bind:checked={marcados[fid]} />
								<span class="ilustr"><IlustracaoFerramenta id={fid} tamanho={40} /></span>
								<span class="nome">{f?.nome ?? fid}</span>
							</label>
							<a class="info" href="{resolve('/glossario')}#{fid}" aria-label="O que é: {f?.nome ?? fid}">?</a>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if guia.pecas.length}
			<section class="pilha" aria-labelledby="pecas-t">
				<h3 id="pecas-t" class="secao-titulo">Peças</h3>
				<ul class="pecas">
					{#each guia.pecas as p, i (p.nome)}
						<li in:entrar={{ delay: cascata(i) }}>
							<strong>{p.nome}</strong>
							{#if p.codigo_oficial}<span class="codigo">Código oficial: <code>{p.codigo_oficial}</code></span>{/if}
							{#if p.link_oficial || paginaPecasMarca}
								<a href={p.link_oficial ?? paginaPecasMarca} target="_blank" rel="noopener noreferrer external">
									Página oficial de peças do fabricante <ExternalLink aria-hidden="true" />
								</a>
							{/if}
						</li>
					{/each}
				</ul>
				<p class="nota">Sem links de afiliados. Confirma sempre o código com o número do teu modelo.</p>
			</section>
		{/if}

		<section class="pilha" aria-labelledby="aplica-t">
			<h3 id="aplica-t" class="secao-titulo">Aplica-se a</h3>
			<ul class="aplica">
				{#each aplicacao as a (a)}<li>{a}</li>{/each}
			</ul>
		</section>

		<div class="iniciar">
			<label class="confirmar">
				<input type="checkbox" bind:checked={li} />
				<span>Li os avisos e vou desligar o aparelho da corrente antes de começar.</span>
			</label>
			<Button variante="destaque" tamanho="grande" largo disabled={!li} href={li ? resolve('/guia/[id]/passos', { id: guia.id }) : undefined}>
				Começar reparação
			</Button>
		</div>
	{/if}

	<ListaFontes fontes={guia.sources} licenca={guia.license} atribuicao={guia.attribution} />
</div>

<style>
	.cabecalho {
		display: flex;
		flex-direction: column;
		gap: var(--e-3);
	}
	.tipo {
		font-weight: 700;
		color: var(--texto-suave);
		font-size: var(--t-sm);
	}
	.titulo {
		font-size: var(--t-2xl);
	}
	.resumo {
		color: var(--texto-suave);
	}
	.meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--e-3);
	}
	.tempo {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-weight: 700;
	}
	.tempo :global(svg) {
		width: 18px;
		height: 18px;
	}
	.compat {
		display: flex;
		gap: var(--e-3);
		align-items: flex-start;
		padding: var(--e-3) var(--e-4);
		border-radius: var(--raio-controlo);
		background: var(--superficie-2);
		border: 1px solid var(--linha-forte);
	}
	.compat :global(svg) {
		flex: none;
		width: 22px;
		height: 22px;
		margin-top: 2px;
		color: var(--primaria);
	}
	.perigo {
		display: flex;
		flex-direction: column;
		gap: var(--e-4);
		padding: var(--e-6);
		border-radius: var(--raio-cartao);
		border: 3px solid var(--risco-proibido);
		background: var(--superficie-1);
	}
	.perigo :global(.ic-perigo) {
		width: 56px;
		height: 56px;
		padding: 12px;
		border-radius: 50%;
		background: var(--risco-proibido);
		color: var(--sobre-risco-proibido);
	}
	.perigo ul {
		padding-left: 1.2em;
		display: flex;
		flex-direction: column;
		gap: var(--e-2);
	}
	.recomendacao {
		display: flex;
		align-items: center;
		gap: var(--e-2);
	}
	.recomendacao :global(svg) {
		width: 20px;
		height: 20px;
	}
	.avisos {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--e-2);
	}
	.avisos li {
		display: flex;
		gap: var(--e-3);
		padding: var(--e-3) var(--e-4);
		border-radius: var(--raio-controlo);
		background: var(--superficie-1);
		border: 1px solid var(--linha);
		border-left: 6px solid var(--risco-medio);
	}
	.avisos :global(svg) {
		flex: none;
		width: 20px;
		height: 20px;
		margin-top: 3px;
	}
	.checklist {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--e-2);
	}
	.checklist li {
		display: flex;
		align-items: stretch;
		gap: var(--e-2);
	}
	.item {
		flex: 1;
		display: flex;
		align-items: center;
		gap: var(--e-3);
		min-height: 64px;
		padding: var(--e-2) var(--e-4);
		border-radius: var(--raio-cartao);
		background: var(--superficie-1);
		border: 1px solid var(--linha);
		cursor: pointer;
		transition: background-color var(--dur-micro) var(--ease);
	}
	.item.feito {
		background: var(--superficie-2);
	}
	.item.feito .nome {
		text-decoration: line-through;
		color: var(--texto-suave);
	}
	input[type='checkbox'] {
		width: 24px;
		height: 24px;
		flex: none;
		accent-color: var(--primaria);
	}
	.ilustr {
		color: var(--primaria);
	}
	.nome {
		font-weight: 700;
	}
	.info {
		display: grid;
		place-items: center;
		width: var(--alvo);
		border-radius: var(--raio-cartao);
		background: var(--superficie-2);
		font-weight: 800;
		text-decoration: none;
	}
	.pecas {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--e-3);
	}
	.pecas li {
		display: flex;
		flex-direction: column;
		gap: var(--e-1);
		padding: var(--e-4);
		border-radius: var(--raio-cartao);
		background: var(--superficie-1);
		border: 1px solid var(--linha);
	}
	.pecas a {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		min-height: var(--alvo);
		font-weight: 700;
	}
	.pecas a :global(svg) {
		width: 16px;
		height: 16px;
	}
	.codigo {
		font-size: var(--t-sm);
	}
	code {
		font-family: ui-monospace, Consolas, monospace;
		background: var(--superficie-2);
		padding: 0.1em 0.4em;
		border-radius: 6px;
	}
	.nota {
		font-size: var(--t-sm);
		color: var(--texto-suave);
	}
	.aplica {
		padding-left: 1.2em;
		display: flex;
		flex-direction: column;
		gap: var(--e-1);
	}
	.iniciar {
		display: flex;
		flex-direction: column;
		gap: var(--e-4);
		padding: var(--e-5);
		border-radius: var(--raio-cartao);
		background: var(--superficie-2);
	}
	.confirmar {
		display: flex;
		gap: var(--e-3);
		align-items: flex-start;
		font-weight: 700;
		cursor: pointer;
		min-height: var(--alvo);
	}
	.confirmar input {
		margin-top: 2px;
	}
</style>
