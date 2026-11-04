<script lang="ts">
	let { largura = '100%', altura = '20px', raio = '8px', linhas = 1 }: { largura?: string; altura?: string; raio?: string; linhas?: number } =
		$props();
</script>

<div class="pilha" aria-hidden="true">
	{#each { length: linhas } as _, i (i)}
		<div class="esqueleto" style:width={i === linhas - 1 && linhas > 1 ? '70%' : largura} style:height={altura} style:border-radius={raio}></div>
	{/each}
</div>

<style>
	.pilha {
		display: flex;
		flex-direction: column;
		gap: var(--e-2);
	}
	.esqueleto {
		position: relative;
		overflow: hidden;
		background: var(--superficie-2);
	}
	/* Shimmer: só transform (60fps) */
	.esqueleto::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--superficie-1) 70%, transparent), transparent);
		transform: translateX(-100%);
		animation: brilho 1.3s var(--ease) infinite;
		will-change: transform;
	}
	@keyframes brilho {
		to {
			transform: translateX(100%);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.esqueleto::after {
			animation: none;
			display: none;
		}
	}
</style>
