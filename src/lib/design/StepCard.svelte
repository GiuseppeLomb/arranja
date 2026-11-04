<script lang="ts">
	import { asset } from '$app/paths';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Lock from '@lucide/svelte/icons/lock';
	import type { Passo } from '#lib/data/tipos.ts';

	type Props = {
		numero: number;
		total: number;
		passo: Passo;
		/** Passo de segurança acrescentado pela app (não editável). */
		automatico?: boolean;
		detalhe?: string;
	};

	let { numero, total, passo, automatico = false, detalhe }: Props = $props();
</script>

<article class="passo" class:automatico aria-labelledby="passo-{numero}-titulo">
	<header>
		<span class="numero" aria-hidden="true">{numero}</span>
		<span id="passo-{numero}-titulo" class="contagem">Passo {numero} de {total}</span>
		{#if automatico}
			<span class="fixo"><Lock aria-hidden="true" /> Passo de segurança</span>
		{/if}
	</header>

	<p class="texto">{passo.texto}</p>
	{#if detalhe}<p class="detalhe">{detalhe}</p>{/if}

	{#if passo.aviso}
		<div class="aviso" role="note">
			<TriangleAlert aria-hidden="true" />
			<p>{passo.aviso}</p>
		</div>
	{/if}

	{#if passo.imagem}
		<figure>
			<img src={asset(passo.imagem.src as Parameters<typeof asset>[0])} alt={passo.imagem.alt} loading="lazy" decoding="async" />
			<figcaption>
				{passo.imagem.autor} · {passo.imagem.licenca}
				{#if passo.imagem.fonte_url}· <a href={passo.imagem.fonte_url} rel="noopener noreferrer external" target="_blank">origem</a>{/if}
			</figcaption>
		</figure>
	{/if}
</article>

<style>
	.passo {
		display: flex;
		flex-direction: column;
		gap: var(--e-4);
		background: var(--superficie-1);
		border: 1px solid var(--linha);
		border-radius: var(--raio-cartao);
		padding: var(--e-6) var(--e-5);
		box-shadow: var(--sombra-2);
		min-height: 280px;
	}
	.automatico {
		border: 2px solid var(--primaria);
	}
	header {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--e-3);
	}
	.numero {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: var(--primaria);
		color: var(--sobre-primaria);
		font-family: var(--fonte-titulo);
		font-weight: 800;
		font-size: var(--t-lg);
	}
	.contagem {
		font-weight: 700;
		color: var(--texto-suave);
		font-size: var(--t-sm);
	}
	.fixo {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		margin-left: auto;
		font-size: var(--t-xs);
		font-weight: 700;
		color: var(--primaria);
	}
	.fixo :global(svg) {
		width: 14px;
		height: 14px;
	}
	.texto {
		font-size: 1.3em;
		line-height: 1.45;
		font-weight: 600;
	}
	.detalhe {
		color: var(--texto-suave);
	}
	.aviso {
		display: flex;
		gap: var(--e-3);
		padding: var(--e-3) var(--e-4);
		border-radius: var(--raio-controlo);
		background: var(--superficie-2);
		border-left: 6px solid var(--risco-medio);
	}
	.aviso :global(svg) {
		flex: none;
		width: 22px;
		height: 22px;
		margin-top: 2px;
	}
	figure {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--e-2);
	}
	img {
		width: 100%;
		height: auto;
		border-radius: var(--raio-controlo);
		background: var(--superficie-2);
	}
	figcaption {
		font-size: var(--t-xs);
		color: var(--texto-suave);
	}
</style>
