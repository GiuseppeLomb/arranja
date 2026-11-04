<script lang="ts">
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import BarraTopo from '#lib/componentes/BarraTopo.svelte';
	import IlustracaoFerramenta from '#lib/ilustracoes/IlustracaoFerramenta.svelte';
	import { conteudo, guiasComFerramenta } from '#lib/data/conteudo.ts';
	import { entrar, cascata } from '#lib/motion/index.ts';
</script>

<svelte:head>
	<title>Glossário de ferramentas · Arranja</title>
</svelte:head>

<BarraTopo titulo="Glossário de ferramentas" />

<p class="intro">As ferramentas que os guias pedem, com o que são e para que servem. Ilustrações próprias do Arranja.</p>

<ul class="lista">
	{#each conteudo.ferramentas as f, i (f.id)}
		{@const n = guiasComFerramenta(f.id).length}
		<li id={f.id} in:entrar={{ delay: cascata(i) }}>
			<div class="ilustr"><IlustracaoFerramenta id={f.id} tamanho={72} /></div>
			<div class="txt">
				<h2>{f.nome}</h2>
				<p>{f.descricao}</p>
				{#if f.cuidado}<p class="cuidado"><TriangleAlert aria-hidden="true" /> {f.cuidado}</p>{/if}
				{#if n}<p class="uso">Usada em {n} {n === 1 ? 'guia' : 'guias'}</p>{/if}
			</div>
		</li>
	{/each}
</ul>

<style>
	.intro {
		color: var(--texto-suave);
		margin-bottom: var(--e-6);
	}
	.lista {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--e-3);
	}
	li {
		display: flex;
		gap: var(--e-4);
		padding: var(--e-4);
		border-radius: var(--raio-cartao);
		background: var(--superficie-1);
		border: 1px solid var(--linha);
		scroll-margin-top: var(--e-6);
	}
	li:target {
		border-color: var(--foco);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--foco) 25%, transparent);
	}
	.ilustr {
		flex: none;
		display: grid;
		place-items: center;
		width: 88px;
		height: 88px;
		border-radius: 20px;
		background: var(--superficie-2);
		color: var(--primaria);
	}
	.txt {
		display: flex;
		flex-direction: column;
		gap: var(--e-2);
		min-width: 0;
	}
	h2 {
		font-size: var(--t-lg);
	}
	.cuidado {
		display: flex;
		gap: var(--e-2);
		font-size: var(--t-sm);
		font-weight: 700;
	}
	.cuidado :global(svg) {
		flex: none;
		width: 18px;
		height: 18px;
		margin-top: 2px;
	}
	.uso {
		font-size: var(--t-sm);
		color: var(--texto-suave);
	}
</style>
