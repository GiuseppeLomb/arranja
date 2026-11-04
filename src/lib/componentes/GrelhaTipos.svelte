<script lang="ts">
	import { resolve } from '$app/paths';
	import { conteudo } from '#lib/data/conteudo.ts';
	import Card from '#lib/design/Card.svelte';
	import IconeEletrodomestico from '#lib/ilustracoes/IconeEletrodomestico.svelte';
	import { escolherTipo } from '#lib/estado/selecao.svelte.ts';
	import { entrar, cascata } from '#lib/motion/index.ts';

	let {
		titulo = 'Que eletrodoméstico avariou?',
		id = 'tipos-titulo',
		mostrarTitulo = true
	}: { titulo?: string; id?: string; mostrarTitulo?: boolean } = $props();
</script>

<section class="pilha" aria-labelledby={id}>
	<h2 {id} class={mostrarTitulo ? 'secao-titulo' : 'vh'}>{titulo}</h2>
	<ul class="grelha">
		{#each conteudo.tipos as t, i (t.id)}
			<li in:entrar={{ delay: cascata(i) }}>
				<Card href={resolve('/reparar/[tipo]', { tipo: t.id })} vt="tipo-{t.id}" onclick={() => escolherTipo(t.id)} classe="cartao-tipo">
					<span class="icone"><IconeEletrodomestico icone={t.icone} tamanho={44} /></span>
					<span class="nome">{t.nome}</span>
				</Card>
			</li>
		{/each}
	</ul>
</section>

<style>
	.grelha {
		list-style: none;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--e-3);
	}
	.grelha li:last-child:nth-child(odd) {
		grid-column: 1 / -1;
	}
	.grelha :global(.cartao-tipo) {
		display: flex;
		flex-direction: column;
		gap: var(--e-3);
		height: 100%;
		padding: var(--e-4);
	}
	.icone {
		display: grid;
		place-items: center;
		width: 64px;
		height: 64px;
		border-radius: 18px;
		background: var(--superficie-2);
		color: var(--primaria);
	}
	.nome {
		font-family: var(--fonte-titulo);
		font-weight: 700;
		font-size: var(--t-md);
		line-height: 1.2;
	}
</style>
