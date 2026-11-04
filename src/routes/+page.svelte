<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import History from '@lucide/svelte/icons/history';
	import Star from '@lucide/svelte/icons/star';
	import HandHeart from '@lucide/svelte/icons/hand-heart';
	import Monograma from '#lib/ilustracoes/Monograma.svelte';
	import IconeEletrodomestico from '#lib/ilustracoes/IconeEletrodomestico.svelte';
	import PesquisaGlobal from '#lib/componentes/PesquisaGlobal.svelte';
	import GrelhaTipos from '#lib/componentes/GrelhaTipos.svelte';
	import Button from '#lib/design/Button.svelte';
	import { conteudo, tipos } from '#lib/data/conteudo.ts';
	import { recentes, favoritos, carregarColecoes, type Recente } from '#lib/estado/colecoes.svelte.ts';
	import { restaurar } from '#lib/estado/selecao.svelte.ts';
	import { entrar, cascata, pressao } from '#lib/motion/index.ts';

	let consulta = $state('');
	onMount(carregarColecoes);

	function abrirRecente(r: Recente) {
		restaurar({ tipo: r.tipo, marca: r.marca, modelo: r.modelo });
		goto(resolve('/reparar/[tipo]', { tipo: r.tipo }));
	}

	const rotaFavorito = (f: (typeof favoritos.lista)[number]) =>
		f.tipo === 'guia' ? resolve('/guia/[id]', { id: f.id }) : f.tipo === 'arvore' ? resolve('/diagnostico/[id]', { id: f.id }) : resolve('/erro/[id]', { id: f.id });
</script>

<svelte:head>
	<title>Arranja — Antes de deitar fora, arranja.</title>
</svelte:head>

<div class="pilha-lg">
	<header class="marca" in:entrar>
		<Monograma tamanho={56} />
		<div>
			<p class="nome">Arranja</p>
			<h1 class="slogan">Antes de deitar fora, arranja.</h1>
		</div>
	</header>

	<PesquisaGlobal bind:valor={consulta} />

	{#if consulta.trim().length < 2}
		<GrelhaTipos />

		{#if recentes.lista.length}
			<section class="pilha" aria-labelledby="recentes-titulo" in:entrar>
				<h2 id="recentes-titulo" class="secao-titulo"><History aria-hidden="true" class="ic" /> Recentes</h2>
				<ul class="lista">
					{#each recentes.lista.slice(0, 4) as r, i (r.em)}
						<li in:entrar={{ delay: cascata(i) }}>
							<button type="button" class="linha" onclick={() => abrirRecente(r)} use:pressao={{ escala: 0.98 }}>
								<IconeEletrodomestico icone={tipos.get(r.tipo)?.icone ?? ''} tamanho={28} />
								<span class="txt">
									<strong>{r.marca.nome} {r.modelo?.texto ?? ''}</strong>
									<span>{tipos.get(r.tipo)?.nome}</span>
								</span>
							</button>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if favoritos.lista.length}
			<section class="pilha" aria-labelledby="fav-titulo" in:entrar>
				<h2 id="fav-titulo" class="secao-titulo"><Star aria-hidden="true" class="ic" /> Favoritos</h2>
				<ul class="lista">
					{#each favoritos.lista.slice(0, 3) as f, i (f.tipo + f.id)}
						<li in:entrar={{ delay: cascata(i) }}>
							<a class="linha" href={rotaFavorito(f)} use:pressao={{ escala: 0.98 }}>
								<span class="txt"><strong>{f.titulo}</strong></span>
							</a>
						</li>
					{/each}
				</ul>
				{#if favoritos.lista.length > 3}
					<Button variante="fantasma" href={resolve('/favoritos')}>Ver todos os favoritos</Button>
				{/if}
			</section>
		{/if}

		{#if conteudo.guias.length === 0}
			<section class="comeco" aria-labelledby="comeco-titulo" in:entrar={{ delay: 120 }}>
				<HandHeart aria-hidden="true" class="ic-grande" />
				<h2 id="comeco-titulo">O Arranja está a começar</h2>
				<p>
					Ainda não publicámos guias: cada passo tem de ter fonte verificada antes de entrar. Se sabes reparar um
					eletrodoméstico, ajuda a escrever o primeiro.
				</p>
				<Button variante="destaque" href={resolve('/contribuir')}>Contribuir</Button>
			</section>
		{/if}
	{/if}
</div>

<style>
	.marca {
		display: flex;
		align-items: center;
		gap: var(--e-4);
		padding-top: var(--e-4);
	}
	.nome {
		font-family: var(--fonte-titulo);
		font-weight: 800;
		font-size: var(--t-3xl);
		line-height: 1;
		letter-spacing: -0.03em;
		color: var(--primaria);
	}
	.slogan {
		font-family: var(--fonte-texto);
		font-size: var(--t-md);
		font-weight: 700;
		color: var(--destaque-texto);
		letter-spacing: 0;
		margin-top: var(--e-1);
	}
	.secao-titulo {
		display: flex;
		align-items: center;
		gap: var(--e-2);
	}
	.secao-titulo :global(.ic) {
		width: 16px;
		height: 16px;
	}
	.lista {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--e-2);
	}
	.linha {
		display: flex;
		align-items: center;
		gap: var(--e-3);
		width: 100%;
		min-height: 56px;
		padding: var(--e-2) var(--e-4);
		border: 1px solid var(--linha);
		border-radius: var(--raio-cartao);
		background: var(--superficie-1);
		color: var(--primaria);
		text-align: left;
		text-decoration: none;
	}
	.txt {
		display: flex;
		flex-direction: column;
		color: var(--texto);
		min-width: 0;
	}
	.txt span {
		font-size: var(--t-sm);
		color: var(--texto-suave);
	}
	.comeco {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--e-3);
		padding: var(--e-6);
		border-radius: var(--raio-cartao);
		background: var(--superficie-2);
	}
	.comeco :global(.ic-grande) {
		width: 32px;
		height: 32px;
		color: var(--destaque-texto);
	}
	.comeco p {
		color: var(--texto-suave);
	}
</style>
