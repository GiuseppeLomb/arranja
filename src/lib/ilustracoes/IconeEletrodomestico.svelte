<script lang="ts">
	/** Ícones próprios dos tipos de eletrodoméstico (linha, monocromáticos, currentColor). */
	let { icone, tamanho = 24 }: { icone: string; tamanho?: number } = $props();
</script>

<svg
	viewBox="0 0 24 24"
	width={tamanho}
	height={tamanho}
	fill="none"
	stroke="currentColor"
	stroke-width="1.6"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#if icone === 'frigorifico'}
		<rect x="5" y="2" width="14" height="20" rx="2.2" />
		<path d="M5 9.5h14" />
		<path d="M8 5v2.2" />
		<path d="M8 12.5v4" />
		<path d="M7 22v.6M17 22v.6" />
	{:else}
		<rect x="3" y="2" width="18" height="20" rx="2.2" />
		<path d="M3 6.5h18" />
		<circle cx="6.2" cy="4.25" r="0.55" fill="currentColor" stroke="none" />
		<circle cx="8.4" cy="4.25" r="0.55" fill="currentColor" stroke="none" />
		{#if icone === 'maquina-lavar-loica'}
			<path d="M15 4.25h3" />
			<path d="M8 9.5h8" />
			<path d="M6 19.5h12" />
			<path d="M7.5 19.5v-5M10.5 19.5v-6M13.5 19.5v-6M16.5 19.5v-5" />
		{:else}
			<path d="M15 4.25h3" />
			<circle cx="12" cy="14.2" r="5.2" />
			{#if icone === 'maquina-lavar-roupa'}
				<path d="M8.9 14.8c1 .9 2.1.9 3.1 0s2.1-.9 3.1 0" />
			{:else if icone === 'maquina-secar'}
				<path d="M10.6 11.6c.6.6.6 1.3 0 1.9s-.6 1.3 0 1.9.6 1.3 0 1.9" />
				<path d="M13.4 11.6c.6.6.6 1.3 0 1.9s-.6 1.3 0 1.9.6 1.3 0 1.9" />
			{:else if icone === 'maquina-lavar-secar'}
				<path d="M8.6 15.4c.8.7 1.7.7 2.5 0" />
				<path d="M13.6 11.8c.55.55.55 1.2 0 1.75s-.55 1.2 0 1.75.55 1.2 0 1.75" />
			{/if}
		{/if}
	{/if}
</svg>
