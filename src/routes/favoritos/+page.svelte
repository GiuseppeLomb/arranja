<script lang="ts">
	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Star from '@lucide/svelte/icons/star';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Stethoscope from '@lucide/svelte/icons/stethoscope';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import X from '@lucide/svelte/icons/x';
	import BarraTopo from '#lib/componentes/BarraTopo.svelte';
	import IconeEletrodomestico from '#lib/ilustracoes/IconeEletrodomestico.svelte';
	import { Button, EmptyState } from '#lib/design/index.ts';
	import { guias, arvores, codigos, tipos } from '#lib/data/conteudo.ts';
	import {
		favoritos,
		recentes,
		carregarColecoes,
		alternarFavorito,
		limparRecentes,
		type Favorito,
		type Recente
	} from '#lib/estado/colecoes.svelte.ts';
	import { restaurar } from '#lib/estado/selecao.svelte.ts';
	import { entrar, sair, cascata, DUR, movimento } from '#lib/motion/index.ts';

	onMount(carregarColecoes);

	const ICONE = { guia: BookOpen, arvore: Stethoscope, codigo: CircleAlert };
	const ROTULO = { guia: 'Guia', arvore: 'Diagnóstico', codigo: 'Código de erro' };

	// Um favorito pode ter deixado de existir (conteúdo retirado/corrigido).
	const existe = (f: Favorito) => (f.tipo === 'guia' ? guias.has(f.id) : f.tipo === 'arvore' ? arvores.has(f.id) : codigos.has(f.id));
	const rota = (f: Favorito) =>
		f.tipo === 'guia' ? resolve('/guia/[id]', { id: f.id }) : f.tipo === 'arvore' ? resolve('/diagnostico/[id]', { id: f.id }) : resolve('/erro/[id]', { id: f.id });

	function abrirRecente(r: Recente) {
		restaurar({ tipo: r.tipo, marca: r.marca, modelo: r.modelo });
		goto(resolve('/reparar/[tipo]', { tipo: r.tipo }));
	}
</script>

<svelte:head>
	<title>Favoritos · Arranja</title>
</svelte:head>

<BarraTopo titulo="Favoritos" semVoltar />

<div class="pilha-lg">
	{#if favoritos.lista.length === 0 && recentes.lista.length === 0}
		<EmptyState titulo="Ainda não tens favoritos" texto="Toca na estrela de um guia, diagnóstico ou código de erro para o guardar aqui. Fica só neste dispositivo.">
			{#snippet icone()}<Star />{/snippet}
			<Button variante="primaria" href={resolve('/reparar')}>Começar uma reparação</Button>
		</EmptyState>
	{/if}

	{#if favoritos.lista.length}
		<section class="pilha" aria-labelledby="fav-t">
			<h2 id="fav-t" class="secao-titulo">Guardados</h2>
			<ul class="lista">
				{#each favoritos.lista as f, i (f.tipo + f.id)}
					{@const Icone = ICONE[f.tipo]}
					<li in:entrar={{ delay: cascata(i) }} out:sair animate:flip={{ duration: movimento.reduzido ? 0 : DUR.padrao }}>
						{#if existe(f)}
							<a class="linha" href={rota(f)}>
								<Icone aria-hidden="true" class="ic" />
								<span class="txt"><span class="tipo">{ROTULO[f.tipo]}</span><strong>{f.titulo}</strong></span>
							</a>
						{:else}
							<span class="linha indisponivel">
								<Icone aria-hidden="true" class="ic" />
								<span class="txt"><span class="tipo">Já não disponível</span><strong>{f.titulo}</strong></span>
							</span>
						{/if}
						<button type="button" class="remover" aria-label="Remover {f.titulo} dos favoritos" onclick={() => alternarFavorito(f.tipo, f.id, f.titulo)}>
							<X aria-hidden="true" />
						</button>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if recentes.lista.length}
		<section class="pilha" aria-labelledby="rec-t">
			<div class="cab-sec">
				<h2 id="rec-t" class="secao-titulo">Recentes</h2>
				<Button variante="fantasma" onclick={limparRecentes}>Limpar</Button>
			</div>
			<ul class="lista">
				{#each recentes.lista as r, i (r.em)}
					<li in:entrar={{ delay: cascata(i) }}>
						<button type="button" class="linha" onclick={() => abrirRecente(r)}>
							<IconeEletrodomestico icone={tipos.get(r.tipo)?.icone ?? ''} tamanho={26} />
							<span class="txt">
								<span class="tipo">{tipos.get(r.tipo)?.nome}</span>
								<strong>{r.marca.nome} {r.modelo?.texto ?? ''}</strong>
							</span>
						</button>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<p class="nota">Favoritos e recentes ficam guardados só neste dispositivo (armazenamento local do browser).</p>
</div>

<style>
	.lista {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--e-2);
	}
	.lista li {
		display: flex;
		gap: var(--e-2);
	}
	.linha {
		flex: 1;
		display: flex;
		align-items: center;
		gap: var(--e-3);
		min-height: 64px;
		padding: var(--e-2) var(--e-4);
		border: 1px solid var(--linha);
		border-radius: var(--raio-cartao);
		background: var(--superficie-1);
		color: var(--primaria);
		text-decoration: none;
		text-align: left;
	}
	.indisponivel {
		opacity: 0.7;
	}
	.linha :global(.ic) {
		flex: none;
		width: 22px;
		height: 22px;
	}
	.txt {
		display: flex;
		flex-direction: column;
		color: var(--texto);
		min-width: 0;
	}
	.tipo {
		font-size: var(--t-xs);
		font-weight: 700;
		color: var(--texto-suave);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.remover {
		flex: none;
		width: var(--alvo);
		border: 0;
		border-radius: var(--raio-cartao);
		background: var(--superficie-2);
		color: var(--texto);
		display: grid;
		place-items: center;
	}
	.remover :global(svg) {
		width: 20px;
		height: 20px;
	}
	.cab-sec {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.nota {
		font-size: var(--t-sm);
		color: var(--texto-suave);
	}
</style>
