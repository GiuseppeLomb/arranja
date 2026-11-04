<script lang="ts">
	import type { Snippet } from 'svelte';
	import { carregarMotion } from '#lib/motion/carregar.ts';
	import X from '@lucide/svelte/icons/x';
	import { SPRING, DUR, movimento } from '#lib/motion/index.ts';

	type Props = { aberto?: boolean; titulo: string; children: Snippet };
	let { aberto = $bindable(false), titulo, children }: Props = $props();

	let dialogo = $state<HTMLDialogElement>();
	let painel = $state<HTMLElement>();
	let fundo = $state<HTMLElement>();
	const idTitulo = `sheet-${Math.random().toString(36).slice(2, 8)}`;

	$effect(() => {
		if (!dialogo || !painel) return;
		if (aberto && !dialogo.open) abrir();
		else if (!aberto && dialogo.open) fechar();
	});

	async function abrir() {
		dialogo!.showModal();
		const { animate } = await carregarMotion();
		if (movimento.reduzido) {
			animate(painel!, { opacity: [0, 1] }, { duration: 0.12 });
		} else {
			animate(painel!, { y: ['100%', '0%'] }, SPRING.sheet);
		}
		animate(fundo!, { opacity: [0, 1] }, { duration: DUR.padrao / 1000 });
	}

	async function fechar() {
		const { animate } = await carregarMotion();
		const a = movimento.reduzido
			? animate(painel!, { opacity: 0 }, { duration: 0.1 })
			: animate(painel!, { y: '100%' }, { duration: DUR.padrao / 1000, ease: [0.2, 0.8, 0.2, 1] });
		animate(fundo!, { opacity: 0 }, { duration: DUR.padrao / 1000 });
		await a;
		dialogo?.close();
		if (painel) painel.style.opacity = '';
	}

	// Arrastar para fechar (pela pega)
	let y0 = 0;
	let dy = 0;
	let t0 = 0;
	let arrastar = false;
	function baixo(e: PointerEvent) {
		arrastar = true;
		y0 = e.clientY;
		dy = 0;
		t0 = performance.now();
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}
	function mover(e: PointerEvent) {
		if (!arrastar || !painel) return;
		dy = Math.max(0, e.clientY - y0);
		if (!movimento.reduzido) painel.style.transform = `translateY(${dy}px)`;
	}
	function cima() {
		if (!arrastar || !painel) return;
		arrastar = false;
		const v = dy / Math.max(1, performance.now() - t0);
		if (dy > 120 || v > 0.6) {
			aberto = false;
		} else {
			const p = painel;
			carregarMotion().then(({ animate }) => animate(p, { y: 0 }, SPRING.sheet));
		}
	}
</script>

<dialog
	bind:this={dialogo}
	class="sheet"
	aria-labelledby={idTitulo}
	oncancel={(e) => {
		e.preventDefault();
		aberto = false;
	}}
	onclose={() => (aberto = false)}
>
	<div class="fundo" bind:this={fundo} onclick={() => (aberto = false)} aria-hidden="true"></div>
	<div class="painel" bind:this={painel}>
		<div class="pega" onpointerdown={baixo} onpointermove={mover} onpointerup={cima} onpointercancel={cima} aria-hidden="true">
			<span></span>
		</div>
		<header>
			<h2 id={idTitulo}>{titulo}</h2>
			<button type="button" class="fechar" aria-label="Fechar" onclick={() => (aberto = false)}><X aria-hidden="true" /></button>
		</header>
		<div class="conteudo">
			{@render children()}
		</div>
	</div>
</dialog>

<style>
	.sheet {
		position: fixed;
		inset: 0;
		width: 100%;
		max-width: none;
		height: 100%;
		max-height: none;
		margin: 0;
		padding: 0;
		border: 0;
		background: transparent;
		color: var(--texto);
	}
	.sheet::backdrop {
		background: transparent;
	}
	.fundo {
		position: absolute;
		inset: 0;
		background: rgb(0 0 0 / 0.45);
	}
	.painel {
		position: absolute;
		left: 50%;
		bottom: 0;
		width: 100%;
		max-width: var(--largura-max);
		max-height: 88dvh;
		margin-left: calc(var(--largura-max) / -2);
		display: flex;
		flex-direction: column;
		background: var(--superficie-1);
		border-radius: 24px 24px 0 0;
		box-shadow: var(--sombra-3);
		padding-bottom: env(safe-area-inset-bottom);
		will-change: transform;
	}
	@media (max-width: 640px) {
		.painel {
			left: 0;
			margin-left: 0;
		}
	}
	.pega {
		display: grid;
		place-items: center;
		height: 28px;
		cursor: grab;
		touch-action: none;
	}
	.pega span {
		width: 44px;
		height: 5px;
		border-radius: 999px;
		background: var(--linha-forte);
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--e-3);
		padding: 0 var(--e-4) var(--e-2) var(--e-5);
	}
	h2 {
		font-size: var(--t-lg);
	}
	.fechar {
		width: var(--alvo);
		height: var(--alvo);
		display: grid;
		place-items: center;
		border: 0;
		border-radius: 50%;
		background: var(--superficie-2);
		color: var(--texto);
	}
	.fechar :global(svg) {
		width: 20px;
		height: 20px;
	}
	.conteudo {
		overflow-y: auto;
		padding: var(--e-2) var(--e-5) var(--e-6);
		overscroll-behavior: contain;
	}
</style>
