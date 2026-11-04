<script lang="ts">
	import '#lib/design/global.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { pwaInfo } from 'virtual:pwa-info';
	// Pré-carregar as fontes principais (subconjunto latino): encurta a cadeia HTML → CSS → fonte.
	import fonteTitulo from '@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2?url';
	import fonteTexto from '@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2?url';
	import NavInferior from '#lib/componentes/NavInferior.svelte';
	import Toast from '#lib/design/Toast.svelte';
	import { transicoesDeNavegacao } from '#lib/motion/index.ts';
	import { carregarPreferencias } from '#lib/estado/preferencias.svelte.ts';
	import { mostrarToast } from '#lib/estado/toasts.svelte.ts';

	let { children } = $props();

	transicoesDeNavegacao();

	const manifesto = pwaInfo ? pwaInfo.webManifest.linkTag : '';
	// No ecrã dos passos a navegação inferior dá lugar aos botões gigantes.
	const semNav = $derived(page.route.id === '/guia/[id]/passos');

	onMount(async () => {
		carregarPreferencias();
		if (pwaInfo) {
			const { registerSW } = await import('virtual:pwa-register');
			registerSW({
				immediate: true,
				onOfflineReady() {
					mostrarToast('Pronto para usar sem internet', 'sucesso');
				}
			});
		}
	});
</script>

<svelte:head>
	<link rel="preload" href={fonteTexto} as="font" type="font/woff2" crossorigin="anonymous" />
	<link rel="preload" href={fonteTitulo} as="font" type="font/woff2" crossorigin="anonymous" />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html manifesto}
</svelte:head>

<a class="saltar" href="#conteudo">Saltar para o conteúdo</a>

<main id="conteudo" class="pagina" class:sem-nav={semNav} tabindex="-1">
	{@render children()}
</main>

{#if !semNav}<NavInferior />{/if}
<Toast />

<style>
	main:focus {
		outline: none;
	}
	.sem-nav {
		padding-bottom: calc(env(safe-area-inset-bottom) + var(--e-6));
	}
</style>
