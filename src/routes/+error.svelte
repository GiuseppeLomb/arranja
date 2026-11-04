<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import FileSearch from '@lucide/svelte/icons/file-search';
	import { Button, EmptyState } from '#lib/design/index.ts';
</script>

<svelte:head>
	<title>{page.status === 404 ? 'Página não encontrada' : 'Erro'} · Arranja</title>
</svelte:head>

<div class="erro">
	<EmptyState
		titulo={page.status === 404 ? 'Não encontrámos esta página' : 'Algo correu mal'}
		texto={page.status === 404
			? 'Pode ter mudado de sítio, ou ainda não temos dados verificados para isto.'
			: (page.error?.message ?? 'Tenta outra vez daqui a pouco.')}
		nivel="h1"
	>
		{#snippet icone()}<FileSearch />{/snippet}
		<Button variante="primaria" href={resolve('/')}>Ir para o início</Button>
		<Button variante="secundaria" href={resolve('/contribuir')}>Contribuir</Button>
	</EmptyState>
</div>

<style>
	.erro {
		padding-top: var(--e-12);
	}
</style>
