<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import House from '@lucide/svelte/icons/house';
	import Search from '@lucide/svelte/icons/search';
	import Star from '@lucide/svelte/icons/star';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';

	const itens = [
		{ rota: '/', rotulo: 'Início', Icone: House, prefixos: ['/reparar', '/diagnostico', '/guia', '/erro'] },
		{ rota: '/pesquisa', rotulo: 'Pesquisa', Icone: Search, prefixos: [] },
		{ rota: '/favoritos', rotulo: 'Favoritos', Icone: Star, prefixos: [] },
		{ rota: '/mais', rotulo: 'Mais', Icone: Ellipsis, prefixos: ['/glossario', '/seguranca', '/sobre', '/fontes', '/privacidade', '/contribuir'] }
	] as const;

	const ativo = $derived.by(() => {
		const id = page.route.id ?? '/';
		const i = itens.findIndex((it) => (it.rota === '/' ? id === '/' : id.startsWith(it.rota)) || it.prefixos.some((p) => id.startsWith(p)));
		return i < 0 ? 0 : i;
	});
</script>

<nav class="nav" aria-label="Navegação principal">
	<ul style:--ativo={ativo}>
		<span class="indicador" aria-hidden="true"></span>
		{#each itens as it, i (it.rota)}
			<li>
				<a href={resolve(it.rota)} aria-current={ativo === i ? 'page' : undefined} class:ativo={ativo === i}>
					<it.Icone aria-hidden="true" />
					<span>{it.rotulo}</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>

<style>
	.nav {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 50;
		background: color-mix(in srgb, var(--superficie-1) 92%, transparent);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-top: 1px solid var(--linha);
		padding-bottom: env(safe-area-inset-bottom);
		view-transition-name: nav-inferior;
	}
	ul {
		position: relative;
		list-style: none;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		max-width: var(--largura-max);
		margin: 0 auto;
		height: var(--nav-altura);
	}
	.indicador {
		position: absolute;
		top: 8px;
		left: 0;
		width: 25%;
		height: 32px;
		display: flex;
		justify-content: center;
		transform: translateX(calc(var(--ativo) * 100%));
		transition: transform var(--dur-padrao) var(--ease);
		pointer-events: none;
	}
	.indicador::before {
		content: '';
		width: 60px;
		height: 32px;
		border-radius: var(--raio-chip);
		background: color-mix(in srgb, var(--primaria) 16%, transparent);
	}
	li {
		display: flex;
	}
	a {
		position: relative;
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		min-height: var(--alvo);
		color: var(--texto-suave);
		text-decoration: none;
		font-size: var(--t-xs);
		font-weight: 700;
	}
	a :global(svg) {
		width: 24px;
		height: 24px;
		transition: transform var(--dur-micro) var(--ease);
	}
	a.ativo {
		color: var(--primaria);
	}
	a:active :global(svg) {
		transform: scale(0.9);
	}
	@media (prefers-reduced-motion: reduce) {
		.indicador,
		a :global(svg) {
			transition: none;
		}
	}
</style>
