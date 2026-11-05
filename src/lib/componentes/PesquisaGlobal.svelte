<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import Stethoscope from '@lucide/svelte/icons/stethoscope';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Layers from '@lucide/svelte/icons/layers';
	import BadgeCheck from '@lucide/svelte/icons/badge-check';
	import Tag from '@lucide/svelte/icons/tag';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import SearchBar from '#lib/design/SearchBar.svelte';
	import Skeleton from '#lib/design/Skeleton.svelte';
	import EmptyState from '#lib/design/EmptyState.svelte';
	import Button from '#lib/design/Button.svelte';
	import { entrar, cascata, pressao } from '#lib/motion/index.ts';
	import { restaurar } from '#lib/estado/selecao.svelte.ts';
	import type { Resultado } from '#lib/data/pesquisa.ts';

	type Props = { valor?: string; autofocus?: boolean; compacto?: boolean; onpesquisa?: (q: string) => void };
	let { valor = $bindable(''), autofocus = false, compacto = false, onpesquisa }: Props = $props();

	let resultados = $state<Resultado[]>([]);
	let modelos = $state<Resultado[]>([]);
	let aCarregar = $state(false);
	let el = $state<HTMLInputElement>();
	let modulo: typeof import('#lib/data/pesquisa.ts') | null = null;
	let seq = 0;
	let temporizador: ReturnType<typeof setTimeout> | undefined;

	const ICONES = { codigo: CircleAlert, arvore: Stethoscope, guia: BookOpen, familia: Layers, modelo: BadgeCheck, marca: Tag };
	const ROTULOS = { codigo: 'Código de erro', arvore: 'Sintoma', guia: 'Guia', familia: 'Família de modelos', modelo: 'Modelo', marca: 'Marca' };

	$effect(() => {
		if (autofocus) el?.focus();
	});

	// Pesquisa inicial quando o valor vem preenchido (ex.: /pesquisa?q=…)
	$effect(() => {
		if (valor && resultados.length === 0 && modelos.length === 0) agendar(valor, 0);
	});

	async function carregarModulo() {
		modulo ??= await import('#lib/data/pesquisa.ts');
		return modulo;
	}

	function agendar(q: string, atraso = 120) {
		clearTimeout(temporizador);
		temporizador = setTimeout(() => executar(q), atraso);
	}

	async function executar(q: string) {
		const minha = ++seq;
		onpesquisa?.(q);
		if (q.trim().length < 2) {
			resultados = [];
			modelos = [];
			aCarregar = false;
			return;
		}
		aCarregar = true;
		const m = await carregarModulo();
		if (minha !== seq) return;
		resultados = m.pesquisar(q);
		const eprel = await m.pesquisarModelosEprel(q);
		if (minha !== seq) return;
		modelos = eprel;
		aCarregar = false;
	}

	function abrir(r: Resultado) {
		if (r.selecao) {
			restaurar(r.selecao);
			goto(resolve('/reparar/[tipo]', { tipo: r.selecao.tipo }));
		} else if (r.rota) {
			goto(resolve(r.rota as '/'));
		}
	}

	const todos = $derived([...modelos, ...resultados]);
</script>

<div class="pesquisa" class:compacto>
	<SearchBar
		bind:value={valor}
		bind:el
		rotulo="Pesquisar modelo ou código de erro"
		placeholder="Modelo ou código de erro (ex. E18 Bosch)"
		oninput={(v) => agendar(v)}
		onsubmit={(v) => executar(v)}
		onfocus={() => carregarModulo()}
	/>

	{#if valor.trim().length >= 2}
		<div class="resultados" aria-live="polite">
			{#if aCarregar && todos.length === 0}
				<div class="carregar"><Skeleton altura="56px" raio="16px" linhas={3} /></div>
			{:else if todos.length === 0}
				<EmptyState titulo="Sem resultados" texto="Não encontrámos esta marca, modelo ou código. Podes sempre diagnosticar pelo sintoma." nivel="h3">
					<Button variante="primaria" href={resolve('/reparar')}>Diagnosticar por sintoma</Button>
					<Button variante="fantasma" href={resolve('/contribuir')}>Contribuir</Button>
				</EmptyState>
			{:else}
				<p class="vh">{todos.length} resultados</p>
				<ul>
					{#each todos as r, i (r.chave)}
						{@const Icone = ICONES[r.tipo]}
						<li in:entrar={{ delay: cascata(i) }}>
							<button type="button" class="item" onclick={() => abrir(r)} use:pressao={{ escala: 0.98 }}>
								<span class="icone {r.tipo}"><Icone aria-hidden="true" /></span>
								<span class="textos">
									<span class="tipo">{ROTULOS[r.tipo]}{r.exemplo ? ' · exemplo' : ''}</span>
									<span class="titulo">{r.titulo}</span>
									<span class="sub">{r.subtitulo}</span>
								</span>
								<ChevronRight class="seta" aria-hidden="true" />
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
</div>

<style>
	.pesquisa {
		display: flex;
		flex-direction: column;
		gap: var(--e-4);
	}
	.resultados ul {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--e-2);
	}
	.item {
		display: flex;
		align-items: center;
		gap: var(--e-3);
		width: 100%;
		min-height: 64px;
		padding: var(--e-3) var(--e-3) var(--e-3) var(--e-3);
		border: 1px solid var(--linha);
		border-radius: var(--raio-cartao);
		background: var(--superficie-1);
		color: var(--texto);
		text-align: left;
		box-shadow: var(--sombra-1);
	}
	@media (hover: hover) {
		.item:hover {
			border-color: var(--linha-forte);
		}
	}
	.icone {
		flex: none;
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border-radius: 12px;
		background: var(--superficie-2);
		color: var(--primaria);
	}
	.icone.modelo {
		background: var(--verificado);
		color: var(--sobre-verificado);
	}
	.icone :global(svg) {
		width: 22px;
		height: 22px;
	}
	.textos {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}
	.tipo {
		font-size: var(--t-xs);
		font-weight: 700;
		color: var(--texto-suave);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.titulo {
		font-weight: 700;
	}
	.sub {
		font-size: var(--t-sm);
		color: var(--texto-suave);
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}
	.item :global(.seta) {
		flex: none;
		width: 20px;
		height: 20px;
		color: var(--texto-suave);
	}
</style>
