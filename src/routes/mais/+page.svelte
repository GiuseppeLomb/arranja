<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import Hammer from '@lucide/svelte/icons/hammer';
	import Shield from '@lucide/svelte/icons/shield';
	import Info from '@lucide/svelte/icons/info';
	import Scale from '@lucide/svelte/icons/scale';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import HandHeart from '@lucide/svelte/icons/hand-heart';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import Smartphone from '@lucide/svelte/icons/smartphone';
	import BarraTopo from '#lib/componentes/BarraTopo.svelte';
	import { conteudo } from '#lib/data/conteudo.ts';
	import { preferencias, carregarPreferencias, definirTema, type Tema } from '#lib/estado/preferencias.svelte.ts';
	import { entrar, cascata, pressao } from '#lib/motion/index.ts';

	onMount(carregarPreferencias);

	const links = [
		{ rota: '/glossario', titulo: 'Glossário de ferramentas', sub: 'O que é cada ferramenta', Icone: Hammer },
		{ rota: '/seguranca', titulo: 'Segurança', sub: 'Regras gerais antes de reparar', Icone: Shield },
		{ rota: '/contribuir', titulo: 'Contribuir', sub: 'Guias, códigos de erro e famílias de modelos', Icone: HandHeart },
		{ rota: '/fontes', titulo: 'Fontes e atribuições', sub: 'EPREL, iFixit e licenças', Icone: Scale },
		{ rota: '/privacidade', titulo: 'Privacidade', sub: 'Sem contas, sem cookies, sem rastreio', Icone: EyeOff },
		{ rota: '/sobre', titulo: 'Sobre o Arranja', sub: 'Projeto aberto e sem fins lucrativos', Icone: Info }
	] as const;

	const temas: { valor: Tema; rotulo: string; Icone: typeof Sun }[] = [
		{ valor: 'auto', rotulo: 'Automático', Icone: Smartphone },
		{ valor: 'claro', rotulo: 'Claro', Icone: Sun },
		{ valor: 'escuro', rotulo: 'Escuro', Icone: Moon }
	];

	const atualizado = new Date(conteudo.gerado_em).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
</script>

<svelte:head>
	<title>Mais · Arranja</title>
</svelte:head>

<BarraTopo titulo="Mais" semVoltar />

<div class="pilha-lg">
	<nav aria-label="Páginas">
		<ul class="lista">
			{#each links as l, i (l.rota)}
				<li in:entrar={{ delay: cascata(i) }}>
					<a class="linha" href={resolve(l.rota)} use:pressao={{ escala: 0.98 }}>
						<l.Icone aria-hidden="true" class="ic" />
						<span class="txt"><strong>{l.titulo}</strong><span>{l.sub}</span></span>
						<ChevronRight aria-hidden="true" class="seta" />
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	<fieldset class="tema">
		<legend class="secao-titulo">Tema</legend>
		<div class="segmentos">
			{#each temas as t (t.valor)}
				<label class:ativo={preferencias.tema === t.valor}>
					<input type="radio" name="tema" value={t.valor} checked={preferencias.tema === t.valor} onchange={() => definirTema(t.valor)} />
					<t.Icone aria-hidden="true" />
					<span>{t.rotulo}</span>
				</label>
			{/each}
		</div>
	</fieldset>

	<p class="versao">
		Conteúdo atualizado a {atualizado}.<br />
		Código aberto em <a href="https://github.com/GiuseppeLomb/arranja" target="_blank" rel="noopener noreferrer external">github.com/GiuseppeLomb/arranja</a>.
	</p>
</div>

<style>
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
		min-height: 64px;
		padding: var(--e-3) var(--e-4);
		border: 1px solid var(--linha);
		border-radius: var(--raio-cartao);
		background: var(--superficie-1);
		color: var(--primaria);
		text-decoration: none;
	}
	.linha :global(.ic) {
		flex: none;
		width: 24px;
		height: 24px;
	}
	.linha :global(.seta) {
		flex: none;
		width: 20px;
		height: 20px;
		color: var(--texto-suave);
	}
	.txt {
		flex: 1;
		display: flex;
		flex-direction: column;
		color: var(--texto);
	}
	.txt span {
		font-size: var(--t-sm);
		color: var(--texto-suave);
	}
	.tema {
		border: 0;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--e-3);
	}
	.tema legend {
		margin-bottom: var(--e-3);
	}
	.segmentos {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--e-1);
		padding: var(--e-1);
		border-radius: var(--raio-cartao);
		background: var(--superficie-2);
	}
	.segmentos label {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		min-height: 56px;
		border-radius: 12px;
		font-weight: 700;
		font-size: var(--t-sm);
		cursor: pointer;
		transition: background-color var(--dur-micro) var(--ease);
	}
	.segmentos label :global(svg) {
		width: 20px;
		height: 20px;
	}
	.segmentos input {
		position: absolute;
		opacity: 0;
		width: 1px;
		height: 1px;
	}
	.segmentos label.ativo {
		background: var(--superficie-1);
		color: var(--primaria);
		box-shadow: var(--sombra-1);
	}
	.segmentos label:has(input:focus-visible) {
		outline: 3px solid var(--foco);
		outline-offset: 2px;
	}
	.versao {
		font-size: var(--t-sm);
		color: var(--texto-suave);
	}
</style>
