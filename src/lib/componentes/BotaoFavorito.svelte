<script lang="ts">
	import { onMount } from 'svelte';
	import Star from '@lucide/svelte/icons/star';
	import { favoritos, alternarFavorito, carregarColecoes, type TipoFavorito } from '#lib/estado/colecoes.svelte.ts';
	import { mostrarToast } from '#lib/estado/toasts.svelte.ts';
	import { movimento, SPRING } from '#lib/motion/index.ts';
	import { carregarMotion } from '#lib/motion/carregar.ts';

	let { tipo, id, titulo }: { tipo: TipoFavorito; id: string; titulo: string } = $props();
	let botao = $state<HTMLButtonElement>();

	onMount(carregarColecoes);
	const marcado = $derived(favoritos.lista.some((f) => f.tipo === tipo && f.id === id));

	function alternar() {
		const ficou = alternarFavorito(tipo, id, titulo);
		mostrarToast(ficou ? 'Guardado nos favoritos' : 'Removido dos favoritos', ficou ? 'sucesso' : 'info');
		if (ficou && botao && !movimento.reduzido) {
			const b = botao;
			carregarMotion().then(({ animate }) => animate(b, { scale: [1, 1.18, 1] }, SPRING.cartao));
		}
	}
</script>

<button
	bind:this={botao}
	type="button"
	class="fav"
	class:marcado
	aria-pressed={marcado}
	aria-label={marcado ? 'Remover dos favoritos' : 'Guardar nos favoritos'}
	onclick={alternar}
>
	<Star aria-hidden="true" fill={marcado ? 'currentColor' : 'none'} />
</button>

<style>
	.fav {
		display: grid;
		place-items: center;
		width: var(--alvo);
		height: var(--alvo);
		border: 0;
		border-radius: 50%;
		background: transparent;
		color: var(--texto-suave);
	}
	.fav :global(svg) {
		width: 24px;
		height: 24px;
	}
	.marcado {
		color: var(--destaque-texto);
	}
	@media (hover: hover) {
		.fav:hover {
			background: var(--superficie-2);
		}
	}
</style>
