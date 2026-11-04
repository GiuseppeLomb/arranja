<script lang="ts" module>
	export interface Migalha {
		id: string;
		rotulo: string;
		valor?: string;
		/** Se definido, a migalha é clicável (volta a esse passo). */
		ir?: () => void;
		atual?: boolean;
	}
</script>

<script lang="ts">
	import { flip } from 'svelte/animate';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { surgir, sair, DUR, movimento } from '#lib/motion/index.ts';

	let { itens }: { itens: Migalha[] } = $props();
</script>

<nav class="migalhas" aria-label="Passos do fluxo">
	<ol>
		{#each itens as m, i (m.id)}
			<li in:surgir out:sair animate:flip={{ duration: movimento.reduzido ? 0 : DUR.padrao }}>
				{#if i > 0}<ChevronRight class="sep" aria-hidden="true" />{/if}
				{#if m.ir && !m.atual}
					<button type="button" onclick={m.ir}>
						<span class="rot">{m.rotulo}</span>
						{#if m.valor}<span class="val">{m.valor}</span>{/if}
					</button>
				{:else}
					<span class="item" aria-current={m.atual ? 'step' : undefined}>
						<span class="rot">{m.rotulo}</span>
						{#if m.valor}<span class="val">{m.valor}</span>{/if}
					</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>

<style>
	.migalhas {
		overflow-x: auto;
		scrollbar-width: none;
		margin: 0 calc(var(--e-4) * -1) var(--e-4);
		padding: 0 var(--e-4);
	}
	.migalhas::-webkit-scrollbar {
		display: none;
	}
	ol {
		list-style: none;
		display: flex;
		align-items: center;
		gap: var(--e-1);
		white-space: nowrap;
	}
	li {
		display: flex;
		align-items: center;
		gap: var(--e-1);
	}
	li :global(.sep) {
		width: 16px;
		height: 16px;
		color: var(--texto-suave);
		flex: none;
	}
	button,
	.item {
		display: inline-flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		min-height: var(--alvo);
		padding: 2px var(--e-3);
		border-radius: var(--raio-controlo);
		border: 0;
		background: transparent;
		text-align: left;
		line-height: 1.2;
	}
	button {
		background: var(--superficie-2);
	}
	@media (hover: hover) {
		button:hover {
			background: var(--superficie-3);
		}
	}
	.item[aria-current='step'] {
		background: var(--primaria);
		color: var(--sobre-primaria);
	}
	.item[aria-current='step'] .rot {
		color: inherit;
	}
	.rot {
		font-size: var(--t-xs);
		color: var(--texto-suave);
		font-weight: 700;
	}
	.val {
		font-weight: 700;
		font-size: var(--t-sm);
		max-width: 16ch;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
