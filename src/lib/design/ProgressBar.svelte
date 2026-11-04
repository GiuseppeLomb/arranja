<script lang="ts">
	let { valor, rotulo, texto }: { valor: number; rotulo: string; texto?: string } = $props();
	const v = $derived(Math.max(0, Math.min(1, valor)));
</script>

<div class="progresso">
	<div
		class="trilho"
		role="progressbar"
		aria-label={rotulo}
		aria-valuemin={0}
		aria-valuemax={100}
		aria-valuenow={Math.round(v * 100)}
		aria-valuetext={texto}
	>
		<div class="enchimento" style:transform="scaleX({v})"></div>
	</div>
	{#if texto}<span class="texto">{texto}</span>{/if}
</div>

<style>
	.progresso {
		display: flex;
		align-items: center;
		gap: var(--e-3);
	}
	.trilho {
		flex: 1;
		height: 8px;
		border-radius: var(--raio-chip);
		background: var(--superficie-3);
		overflow: hidden;
	}
	.enchimento {
		height: 100%;
		background: var(--primaria);
		border-radius: inherit;
		transform-origin: left center;
		transition: transform var(--dur-ecra) var(--ease);
		will-change: transform;
	}
	.texto {
		font-size: var(--t-sm);
		font-weight: 700;
		color: var(--texto-suave);
		font-variant-numeric: tabular-nums;
		min-width: 3.5em;
		text-align: right;
	}
	@media (prefers-reduced-motion: reduce) {
		.enchimento {
			transition: none;
		}
	}
</style>
