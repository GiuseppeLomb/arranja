<script lang="ts">
	import { flip } from 'svelte/animate';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Info from '@lucide/svelte/icons/info';
	import { toasts, fecharToast } from '#lib/estado/toasts.svelte.ts';
	import { entrar, sair, DUR, movimento } from '#lib/motion/index.ts';
</script>

<div class="regiao" role="status" aria-live="polite">
	{#each toasts.lista as t (t.id)}
		<button
			type="button"
			class="toast"
			onclick={() => fecharToast(t.id)}
			in:entrar={{ y: 16 }}
			out:sair
			animate:flip={{ duration: movimento.reduzido ? 0 : DUR.padrao }}
		>
			{#if t.tom === 'sucesso'}<CircleCheck aria-hidden="true" />{:else}<Info aria-hidden="true" />{/if}
			<span>{t.texto}</span>
		</button>
	{/each}
</div>

<style>
	.regiao {
		position: fixed;
		left: 50%;
		bottom: calc(var(--nav-altura) + env(safe-area-inset-bottom) + var(--e-4));
		transform: translateX(-50%);
		z-index: 60;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--e-2);
		width: min(calc(100% - var(--e-8)), 480px);
		pointer-events: none;
	}
	.toast {
		pointer-events: auto;
		display: flex;
		align-items: center;
		gap: var(--e-3);
		min-height: var(--alvo);
		padding: var(--e-3) var(--e-5);
		border: 0;
		border-radius: var(--raio-chip);
		background: var(--grafite);
		color: #ffffff;
		font-weight: 700;
		box-shadow: var(--sombra-2);
		text-align: left;
	}
	:global([data-theme='dark']) .toast {
		background: var(--superficie-3);
		color: var(--texto);
	}
	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-theme='light'])) .toast {
			background: var(--superficie-3);
			color: var(--texto);
		}
	}
	.toast :global(svg) {
		flex: none;
		width: 20px;
		height: 20px;
	}
</style>
