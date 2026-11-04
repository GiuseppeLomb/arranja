<script lang="ts">
	/**
	 * Cozinha interativa do Início: cada eletrodoméstico da ilustração é um link para o seu tipo.
	 * O SVG (src/lib/ilustracoes/cozinha) é otimizado com svgo e inserido inline para poder ser animado.
	 * Cores por tokens CSS (claro/escuro). Alternativa acessível: "Ver em lista".
	 */
	import { onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import List from '@lucide/svelte/icons/list';
	import ImageIcon from '@lucide/svelte/icons/image';
	import svgBruto from '#lib/ilustracoes/cozinha/cozinha.min.svg?raw';
	import GrelhaTipos from './GrelhaTipos.svelte';
	import { tipos } from '#lib/data/conteudo.ts';
	import { escolherTipo } from '#lib/estado/selecao.svelte.ts';
	import { lerTexto, gravarTexto, CHAVES } from '#lib/estado/armazenamento.ts';
	import { movimento, suportaVT } from '#lib/motion/index.ts';

	// Rotas com o base path (relativas na pré-renderização, absolutas no browser).
	const svg = svgBruto.replaceAll('href="/reparar/', `href="${resolve('/reparar')}/`);

	let vista = $state<'ilustracao' | 'lista'>('ilustracao');
	let cena = $state<HTMLDivElement>();
	let etiquetaEl = $state<HTMLParagraphElement>();
	let etiqueta = $state({ texto: '', x: 0, y: 0, breve: false, visivel: false });
	let escondido = $state(false);
	let foraDeVista = $state(false);

	let aNavegar = false;
	let ultimoPonteiro = 'mouse';
	let temporizador: ReturnType<typeof setTimeout> | undefined;

	onMount(() => {
		if (lerTexto(CHAVES.vistaInicio) === 'lista') vista = 'lista';
		// Animações ambiente param com o separador escondido…
		const visibilidade = () => (escondido = document.hidden);
		visibilidade();
		document.addEventListener('visibilitychange', visibilidade);
		return () => document.removeEventListener('visibilitychange', visibilidade);
	});

	// …e quando a ilustração sai do ecrã.
	$effect(() => {
		if (!cena || typeof IntersectionObserver === 'undefined') return;
		const io = new IntersectionObserver(([e]) => (foraDeVista = !e.isIntersecting));
		io.observe(cena);
		return () => io.disconnect();
	});

	// Se o tamanho mudar, a posição da etiqueta deixa de ser válida.
	$effect(() => {
		if (!cena || typeof ResizeObserver === 'undefined') return;
		const ro = new ResizeObserver(() => esconder());
		ro.observe(cena);
		return () => ro.disconnect();
	});

	function alternarVista() {
		vista = vista === 'lista' ? 'ilustracao' : 'lista';
		gravarTexto(CHAVES.vistaInicio, vista === 'lista' ? 'lista' : null);
	}

	const alvo = (e: Event) => (e.target as Element | null)?.closest?.<SVGElement>('.k-ap, .k-breve') ?? null;

	// ---------- Etiqueta com o nome ----------
	async function mostrar(el: SVGElement) {
		if (!cena) return;
		clearTimeout(temporizador);
		const corpo = el.querySelector('.k-corpo') ?? el;
		const r = corpo.getBoundingClientRect();
		const c = cena.getBoundingClientRect();
		const breve = el.classList.contains('k-breve');
		const texto = breve ? `${el.dataset.brevemente} · Brevemente` : (tipos.get(el.dataset.tipo ?? '')?.nome ?? '');
		const meio = r.left + r.width / 2 - c.left;
		etiqueta = { texto, x: meio, y: Math.max(r.top - c.top, 48), breve, visivel: true };
		await tick();
		const meia = (etiquetaEl?.offsetWidth ?? 0) / 2 + 8;
		etiqueta.x = Math.min(Math.max(meio, meia), c.width - meia);
	}

	function esconder() {
		if (!aNavegar) etiqueta.visivel = false;
	}

	// ---------- Ponteiro, foco e toque ----------
	function aoEntrar(e: PointerEvent) {
		if (e.pointerType !== 'mouse') return;
		const el = alvo(e);
		if (el) mostrar(el);
	}

	function aoSair(e: PointerEvent) {
		if (e.pointerType !== 'mouse') return;
		const el = alvo(e);
		const para = (e.relatedTarget as Element | null)?.closest?.('.k-ap, .k-breve') ?? null;
		if (el && para !== el) esconder();
	}

	function aoFocar(e: FocusEvent) {
		const el = alvo(e);
		if (el) mostrar(el);
	}

	function aoPremir(e: PointerEvent) {
		ultimoPonteiro = e.pointerType;
		const el = alvo(e);
		if (!el) return;
		if (el.classList.contains('k-ap')) el.classList.add('premido');
		if (e.pointerType !== 'mouse') {
			mostrar(el);
			// "Brevemente" ao toque: mostra a etiqueta durante um momento.
			if (el.classList.contains('k-breve')) temporizador = setTimeout(esconder, 1400);
		}
	}

	function aoLargar() {
		if (aNavegar || !cena) return;
		for (const el of cena.querySelectorAll('.premido')) el.classList.remove('premido');
	}

	function aoClicar(e: MouseEvent) {
		const a = (e.target as Element | null)?.closest?.<SVGAElement>('a.k-ap');
		if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
		e.preventDefault();
		if (aNavegar) return;
		aNavegar = true;
		const tipo = a.dataset.tipo!;
		escolherTipo(tipo);
		a.classList.add('premido');
		mostrar(a);
		// Ao toque, o destaque e a etiqueta ficam visíveis um instante antes de navegar.
		const teclado = e.detail === 0;
		const atraso = !teclado && ultimoPonteiro !== 'mouse' ? 160 : 0;
		setTimeout(() => {
			criarFantasma(a, tipo);
			goto(resolve('/reparar/[tipo]', { tipo }));
		}, atraso);
	}

	/**
	 * View Transition partilhada: o view-transition-name não se aplica a elementos dentro de um SVG,
	 * por isso colocamos por cima do aparelho uma cópia HTML com o nome "tipo-…", que o browser
	 * anima até ao cabeçalho do ecrã seguinte.
	 */
	function criarFantasma(a: SVGAElement, tipo: string) {
		if (!cena || !suportaVT() || movimento.reduzido) return;
		const corpo = a.querySelector<SVGGraphicsElement>('.k-corpo');
		if (!corpo) return;
		const r = corpo.getBoundingClientRect();
		const c = cena.getBoundingClientRect();
		const caixa = corpo.getBBox();
		const ns = 'http://www.w3.org/2000/svg';
		const fantasma = document.createElement('div');
		fantasma.className = 'k-fantasma';
		fantasma.style.cssText = `left:${r.left - c.left}px;top:${r.top - c.top}px;width:${r.width}px;height:${r.height}px;view-transition-name:tipo-${tipo}`;
		const copia = document.createElementNS(ns, 'svg');
		copia.setAttribute('viewBox', `${caixa.x} ${caixa.y} ${caixa.width} ${caixa.height}`);
		copia.setAttribute('preserveAspectRatio', 'none');
		copia.setAttribute('aria-hidden', 'true');
		copia.appendChild(corpo.cloneNode(true));
		fantasma.appendChild(copia);
		cena.appendChild(fantasma);
		corpo.style.opacity = '0';
	}
</script>

<section class="cozinha" class:pausada={escondido || foraDeVista} aria-labelledby="cozinha-titulo">
	<h2 id="cozinha-titulo" class="secao-titulo">Que eletrodoméstico avariou?</h2>

	{#if vista === 'ilustracao'}
		<svelte:boundary>
			<!-- Delegação de eventos: os links do SVG são focáveis e ativáveis por teclado de forma nativa. -->
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<div
				class="cena"
				bind:this={cena}
				onpointerover={aoEntrar}
				onpointerout={aoSair}
				onpointerdown={aoPremir}
				onpointerup={aoLargar}
				onpointercancel={aoLargar}
				onfocusin={aoFocar}
				onfocusout={esconder}
				onclick={aoClicar}
			>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- SVG próprio, estático -->
				{@html svg}
				<p
					class="etiqueta"
					class:visivel={etiqueta.visivel}
					class:breve={etiqueta.breve}
					style:left="{etiqueta.x}px"
					style:top="{etiqueta.y}px"
					aria-hidden="true"
					bind:this={etiquetaEl}
				>
					{etiqueta.texto}
				</p>
			</div>

			{#snippet failed()}
				<GrelhaTipos mostrarTitulo={false} id="tipos-fallback" />
			{/snippet}
		</svelte:boundary>
	{:else}
		<GrelhaTipos mostrarTitulo={false} />
	{/if}

	<div class="rodape">
		{#if vista === 'ilustracao'}<p class="dica">Escolhe o aparelho avariado.</p>{/if}
		<button type="button" class="alternar" onclick={alternarVista}>
			{#if vista === 'lista'}
				<ImageIcon aria-hidden="true" /> Ver ilustração
			{:else}
				<List aria-hidden="true" /> Ver em lista
			{/if}
		</button>
	</div>
</section>

<style>
	.cozinha {
		display: flex;
		flex-direction: column;
		gap: var(--e-3);
	}

	.cena {
		/* Subida no hover ≈ 4px no ecrã (unidades do SVG × escala) */
		--k-subida: -3.5px;
		--k-sombra: rgb(var(--k-sombra-cor) / 0.2);
		--k-dur: 200ms;
		position: relative;
		overflow: hidden;
		border-radius: var(--raio-cartao);
		border: 1px solid var(--linha);
		background: var(--k-parede);
		box-shadow: var(--sombra-1);
		-webkit-tap-highlight-color: transparent;
	}

	.cena :global(.k-svg) {
		display: block;
		width: 100%;
		height: auto;
		aspect-ratio: 3 / 4;
	}
	@media (min-width: 520px) {
		.cena {
			--k-subida: -2px;
		}
		/* Paisagem: o SVG usa "slice" e corta o topo decorativo */
		.cena :global(.k-svg) {
			aspect-ratio: 4 / 3;
		}
	}

	/* ---------- Cores (tokens) ---------- */
	.cena :global(.k-parede) { fill: var(--k-parede); }
	.cena :global(.k-parede-2) { fill: var(--k-parede-2); }
	.cena :global(.k-chao) { fill: var(--k-chao); }
	.cena :global(.k-chao-2) { fill: var(--k-chao-2); }
	.cena :global(.k-movel) { fill: var(--k-movel); }
	.cena :global(.k-movel-2) { fill: var(--k-movel-2); }
	.cena :global(.k-movel-3) { fill: var(--k-movel-3); }
	.cena :global(.k-puxador) { fill: var(--k-puxador); }
	.cena :global(.k-puxador-claro) { fill: var(--k-puxador-claro); }
	.cena :global(.k-bancada) { fill: var(--k-bancada); }
	.cena :global(.k-bancada-2) { fill: var(--k-bancada-2); }
	.cena :global(.k-azulejo) { fill: var(--k-azulejo); }
	.cena :global(.k-azulejo-2) { fill: var(--k-azulejo-2); }
	.cena :global(.k-azulejo-3) { fill: var(--k-azulejo-3); }
	.cena :global(.k-apar) { fill: var(--k-apar); }
	.cena :global(.k-apar-2) { fill: var(--k-apar-2); }
	.cena :global(.k-apar-3) { fill: var(--k-apar-3); }
	.cena :global(.k-visor) { fill: var(--k-visor); }
	.cena :global(.k-vidro) { fill: var(--k-vidro); }
	.cena :global(.k-vidro-2) { fill: var(--k-vidro-2); }
	.cena :global(.k-roupa-1) { fill: var(--k-roupa-1); }
	.cena :global(.k-roupa-2) { fill: var(--k-roupa-2); }
	.cena :global(.k-roupa-3) { fill: var(--k-roupa-3); }
	.cena :global(.k-frig) { fill: var(--k-frig); }
	.cena :global(.k-frig-2) { fill: var(--k-frig-2); }
	.cena :global(.k-frig-3) { fill: var(--k-frig-3); }
	.cena :global(.k-cobre) { fill: var(--k-cobre); }
	.cena :global(.k-cobre-2) { fill: var(--k-cobre-2); }
	.cena :global(.k-luz) { fill: var(--k-luz); }
	.cena :global(.k-planta) { fill: var(--k-planta); }
	.cena :global(.k-planta-2) { fill: var(--k-planta-2); }
	.cena :global(.k-ceu) { fill: var(--k-ceu); }
	.cena :global(.k-telhado) { fill: var(--k-telhado); }
	.cena :global(.k-astro) { fill: var(--k-astro); }
	.cena :global(.k-gota) { fill: var(--k-roupa-2); }
	.cena :global(.k-icone) { fill: none; stroke: var(--k-apar-3); stroke-width: 1.6; }
	.cena :global(.k-breve-1) { fill: var(--k-breve); }
	.cena :global(.k-breve-2) { fill: var(--k-breve-2); }
	.cena :global(.k-breve-3) { fill: var(--k-breve-3); }
	.cena :global(.k-sombra) { fill: var(--k-sombra); }
	.cena :global(.k-sombra-parede) { fill: rgb(var(--k-sombra-cor) / 0.1); }
	.cena :global(.k-junta) { fill: none; stroke: var(--k-azulejo-3); stroke-width: 0.4; }
	.cena :global(.k-junta-chao) { fill: none; stroke: var(--k-chao-2); stroke-width: 0.8; }
	.cena :global(.k-caixilho) { fill: none; stroke: var(--k-movel); stroke-width: 2.5; }
	.cena :global(.k-traco) { fill: none; stroke: var(--k-visor); stroke-width: 1.3; stroke-linecap: round; }
	.cena :global(.k-traco-cobre) { fill: none; stroke: var(--k-cobre); stroke-width: 1.2; stroke-linecap: round; stroke-linejoin: round; }
	.cena :global(.k-onda) { fill: none; stroke: var(--k-cobre); stroke-width: 1.1; stroke-linecap: round; }
	.cena :global(.k-brilho) { fill: none; stroke: rgb(255 255 255 / 0.35); stroke-width: 1.6; stroke-linecap: round; }

	/* ---------- Aparelhos ---------- */
	.cena :global(.k-ap) {
		cursor: pointer;
		outline: none;
		transition: opacity var(--k-dur) var(--ease);
	}
	.cena :global(.k-corpo) {
		transform-box: fill-box;
		transform-origin: 50% 100%;
		transition:
			transform var(--k-dur) var(--ease),
			filter var(--k-dur) var(--ease),
			opacity 80ms linear;
	}
	.cena :global(.k-sombra) {
		transform-box: fill-box;
		transform-origin: center;
		transition:
			transform var(--k-dur) var(--ease),
			opacity var(--k-dur) var(--ease);
	}
	.cena :global(.k-halo) {
		fill: none;
		stroke: var(--destaque);
		stroke-width: 2.5;
		vector-effect: non-scaling-stroke;
		opacity: 0;
		transition: opacity var(--k-dur) var(--ease);
	}
	.cena :global(.k-anel) {
		fill: none;
		stroke: var(--foco);
		stroke-width: 3;
		stroke-dasharray: 6 4;
		vector-effect: non-scaling-stroke;
		opacity: 0;
	}

	/* Destaque: hover (rato), foco por teclado ou toque */
	@media (hover: hover) and (pointer: fine) {
		.cena :global(.k-ap:hover .k-corpo) {
			transform: translateY(var(--k-subida));
			filter: drop-shadow(0 0 3px color-mix(in srgb, var(--destaque) 55%, transparent));
		}
		.cena :global(.k-ap:hover .k-sombra) {
			transform: scale(1.15, 1.6);
			opacity: 0.6;
		}
		.cena :global(.k-ap:hover .k-halo) {
			opacity: 1;
		}
		.cena :global(.k-breve:hover) {
			cursor: help;
		}
	}
	.cena :global(.k-ap:focus-visible .k-corpo) {
		transform: translateY(var(--k-subida));
	}
	.cena :global(.k-ap:focus-visible .k-sombra) {
		transform: scale(1.15, 1.6);
		opacity: 0.6;
	}
	.cena :global(.k-ap:focus-visible .k-halo),
	.cena :global(.k-ap:focus-visible .k-anel),
	.cena :global(.k-ap.premido .k-halo) {
		opacity: 1;
	}
	.cena :global(.k-ap.premido .k-corpo) {
		transform: scale(0.97);
	}

	/* Os restantes aparelhos esbatem ligeiramente */
	.cena :global(.k-svg:has(.k-ap:hover, .k-ap:focus-visible, .k-ap.premido) .k-ap:not(:hover, :focus-visible, .premido)) {
		opacity: 0.85;
	}

	/* Brevemente: dessaturados e não navegáveis */
	.cena :global(.k-breve) {
		opacity: 0.8;
	}

	/* ---------- Animações ambiente (só transform/opacity) ---------- */
	.cena :global(.k-tambor) {
		transform-box: fill-box;
		transform-origin: center;
		animation: k-rodar 18s linear infinite;
	}
	.cena :global(.k-tambor-lento) {
		animation-duration: 28s;
		animation-direction: reverse;
	}
	.cena :global(.k-luz) {
		animation: k-piscar 3.2s ease-in-out infinite;
	}
	.pausada .cena :global(.k-tambor),
	.pausada .cena :global(.k-luz) {
		animation-play-state: paused;
	}

	@keyframes -global-k-rodar {
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes -global-k-piscar {
		50% {
			opacity: 0.35;
		}
	}

	/* Cópia usada na View Transition (ver criarFantasma) */
	.cena :global(.k-fantasma) {
		position: absolute;
		pointer-events: none;
	}
	.cena :global(.k-fantasma svg) {
		display: block;
		width: 100%;
		height: 100%;
		overflow: visible;
	}
	.cena :global(.k-fantasma .k-halo) {
		opacity: 1;
	}

	/* ---------- Etiqueta ---------- */
	.etiqueta {
		position: absolute;
		z-index: 2;
		margin: 0;
		padding: 6px 12px;
		border-radius: var(--raio-chip);
		background: var(--primaria);
		color: var(--sobre-primaria);
		font-weight: 700;
		font-size: var(--t-sm);
		line-height: 1.3;
		white-space: nowrap;
		box-shadow: var(--sombra-2);
		pointer-events: none;
		opacity: 0;
		transform: translate(-50%, calc(-100% + 2px));
		transition:
			opacity var(--k-dur) var(--ease),
			transform var(--k-dur) var(--ease);
	}
	.etiqueta.visivel {
		opacity: 1;
		transform: translate(-50%, calc(-100% - 8px));
	}
	.etiqueta.breve {
		background: var(--superficie-1);
		color: var(--texto);
		border: 1px solid var(--linha-forte);
	}

	/* ---------- Rodapé ---------- */
	.rodape {
		display: flex;
		align-items: center;
		gap: var(--e-2);
	}
	.dica {
		flex: 1;
		min-width: 0;
		font-size: var(--t-sm);
		color: var(--texto-suave);
	}
	.alternar {
		flex: none;
		display: inline-flex;
		align-items: center;
		gap: var(--e-2);
		min-height: var(--alvo);
		margin-left: auto;
		padding: 0 var(--e-2);
		border: 0;
		background: none;
		color: var(--primaria);
		font-weight: 700;
		text-decoration: underline;
		text-underline-offset: 0.18em;
	}
	.alternar :global(svg) {
		width: 18px;
		height: 18px;
	}

	/* ---------- Movimento reduzido: sem deslocações, só fades curtos ---------- */
	@media (prefers-reduced-motion: reduce) {
		.cena :global(.k-tambor),
		.cena :global(.k-luz) {
			animation: none;
		}
		.cena :global(.k-ap .k-corpo),
		.cena :global(.k-ap .k-sombra) {
			transform: none !important;
			transition: opacity 120ms linear;
		}
		.etiqueta,
		.etiqueta.visivel {
			transform: translate(-50%, calc(-100% - 8px));
			transition: opacity 120ms linear;
		}
	}
</style>
