<script lang="ts">
	/** Monograma "A" estilizado como chave inglesa (tinta + cobre). Mesmo desenho de static/icone.svg. */
	let { tamanho = 40 }: { tamanho?: number } = $props();
	const id = `m-${Math.random().toString(36).slice(2, 8)}`;
</script>

<svg viewBox="0 0 512 512" width={tamanho} height={tamanho} aria-hidden="true">
	<defs>
		<mask {id}>
			<rect width="512" height="512" fill="#fff" />
			<path d="M226 52h60v100h-60z" fill="#000" />
		</mask>
	</defs>
	<rect width="512" height="512" rx="112" fill="#14302B" />
	<circle cx="256" cy="150" r="80" fill="#F6F1E9" mask="url(#{id})" />
	<path d="M256 190L150 420M256 190l106 230" stroke="#F6F1E9" stroke-width="58" stroke-linecap="round" fill="none" />
	<path d="M190 330h132" stroke="#D9772B" stroke-width="46" stroke-linecap="round" />
</svg>
