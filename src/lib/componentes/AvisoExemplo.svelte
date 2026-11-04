<script lang="ts">
	import FlaskConical from '@lucide/svelte/icons/flask-conical';
</script>

<p class="exemplo" role="note">
	<FlaskConical aria-hidden="true" />
	<span><strong>Conteúdo de exemplo</strong> — fictício, só existe em desenvolvimento para testar os ecrãs. Não seguir.</span>
</p>

<style>
	.exemplo {
		display: flex;
		gap: var(--e-3);
		align-items: flex-start;
		padding: var(--e-3) var(--e-4);
		border-radius: var(--raio-controlo);
		border: 2px dashed var(--linha-forte);
		background: var(--superficie-2);
		font-size: var(--t-sm);
	}
	.exemplo :global(svg) {
		flex: none;
		width: 20px;
		height: 20px;
		margin-top: 2px;
	}
</style>
