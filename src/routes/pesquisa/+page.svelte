<script lang="ts">
	import { onMount } from 'svelte';
	import { replaceState } from '$app/navigation';
	import BarraTopo from '#lib/componentes/BarraTopo.svelte';
	import PesquisaGlobal from '#lib/componentes/PesquisaGlobal.svelte';

	let consulta = $state('');
	let pronto = $state(false);

	// A query (?q=) só é lida no browser: as páginas são pré-renderizadas.
	onMount(() => {
		consulta = new URL(location.href).searchParams.get('q') ?? '';
		pronto = true;
	});

	function atualizarUrl(q: string) {
		if (!pronto) return;
		const url = new URL(location.href);
		if (q.trim()) url.searchParams.set('q', q.trim());
		else url.searchParams.delete('q');
		try {
			replaceState(url, {});
		} catch {
			/* router ainda não pronto */
		}
	}
</script>

<svelte:head>
	<title>Pesquisa · Arranja</title>
</svelte:head>

<BarraTopo titulo="Pesquisa" semVoltar />
<div class="pilha">
	<p class="ajuda">Pesquisa por modelo, marca, código de erro (ex. «E18 Bosch») ou sintoma.</p>
	{#if pronto}
		<PesquisaGlobal bind:valor={consulta} autofocus onpesquisa={atualizarUrl} />
	{/if}
</div>

<style>
	.ajuda {
		color: var(--texto-suave);
	}
</style>
