<script lang="ts">
	/**
	 * Ilustrações próprias das ferramentas do glossário.
	 * Linha monocromática (currentColor), 64×64. Licença: CC BY-NC-SA 4.0 (Arranja).
	 */
	let { id, tamanho = 64 }: { id: string; tamanho?: number } = $props();
</script>

<svg
	viewBox="0 0 64 64"
	width={tamanho}
	height={tamanho}
	fill="none"
	stroke="currentColor"
	stroke-width="2.4"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#if id === 'chave-fendas' || id === 'chave-phillips' || id === 'chave-torx'}
		<g transform="rotate(-45 32 32)">
			<rect x="4" y="25" width="22" height="14" rx="6" />
			<path d="M10 27.5v9M15 27.5v9M20 27.5v9" />
			<rect x="26" y="29" width="5" height="6" rx="1.5" />
			<path d="M31 32h22" />
			{#if id === 'chave-fendas'}
				<path d="M53 29.5l5 1.3v2.4l-5 1.3z" />
			{:else if id === 'chave-phillips'}
				<path d="M53 30l6 2-6 2z" />
			{:else}
				<path d="M53 30h4l2 2-2 2h-4z" />
			{/if}
		</g>
		{#if id === 'chave-phillips'}
			<circle cx="52" cy="12" r="7" />
			<path d="M52 7.5v9M47.5 12h9" />
		{:else if id === 'chave-torx'}
			<circle cx="52" cy="12" r="7" />
			<path d="M52 8l1.3 2.4 2.7-.1-1.4 2.3 1.4 2.3-2.7-.1L52 17.2l-1.3-2.4-2.7.1 1.4-2.3-1.4-2.3 2.7.1z" />
		{:else}
			<circle cx="52" cy="12" r="7" />
			<path d="M47.5 12h9" />
		{/if}
	{:else if id === 'chave-inglesa'}
		<g transform="rotate(-45 32 32)">
			<rect x="4" y="28.5" width="36" height="9" rx="4.5" />
			<path d="M40 24h10a5 5 0 0 1 5 5v1h-8v6h8v1a5 5 0 0 1-5 5H40z" />
			<circle cx="44" cy="33" r="2" />
			<path d="M10 33h16" />
		</g>
	{:else if id === 'alicate' || id === 'alicate-pontas'}
		<path d="M23 60c1-11 4-19 9-26" />
		<path d="M41 60c-1-11-4-19-9-26" />
		<path d="M20 60l3-0.5M44 60l-3-0.5" />
		<circle cx="32" cy="32" r="3.2" />
		{#if id === 'alicate'}
			<path d="M30 29.5L26 12q6-5 12 0l-4 17.5" />
			<path d="M28.5 18h7M28 23h8" />
		{:else}
			<path d="M30.5 29.2L30 5.5h4l-.5 23.7" />
			<path d="M32 6v22" />
		{/if}
	{:else if id === 'espatula-plastico'}
		<g transform="rotate(-35 32 32)">
			<path d="M6 27h40l12 5-12 5H6a4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4z" />
			<path d="M10 32h20" />
		</g>
	{:else if id === 'multimetro'}
		<rect x="15" y="5" width="34" height="54" rx="6" />
		<rect x="20.5" y="10.5" width="23" height="12" rx="2" />
		<path d="M25 16.5h5M33 16.5h6" />
		<circle cx="32" cy="35" r="7.5" />
		<path d="M32 35l4-4" />
		<circle cx="24" cy="51" r="2" />
		<circle cx="32" cy="51" r="2" />
		<circle cx="40" cy="51" r="2" />
	{:else if id === 'lanterna'}
		<g transform="rotate(-40 32 32)">
			<rect x="6" y="27" width="26" height="10" rx="3" />
			<path d="M32 27l8-5h4v20h-4l-8-5z" />
			<path d="M14 30.5v3" />
		</g>
		<path d="M44 12l6-6M48 20l9-2M41 9l1-7" />
	{:else if id === 'balde'}
		<path d="M14 22h36" />
		<path d="M16 22l4 34h24l4-34" />
		<path d="M18 22c0-15 28-15 28 0" />
		<path d="M19 32h26" />
	{:else if id === 'toalhas'}
		<rect x="9" y="38" width="46" height="14" rx="5" />
		<rect x="13" y="25" width="38" height="13" rx="5" />
		<rect x="17" y="13" width="30" height="12" rx="5" />
		<path d="M15 45h34M19 31.5h26M23 19h18" />
	{:else if id === 'luvas'}
		<path d="M22 58V31c0-3 4.5-3 4.5 0V18c0-3 4.5-3 4.5 0v-3c0-3 4.5-3 4.5 0v3c0-3 4.5-3 4.5 0v15l3.5-4.5c2-2.5 5.5-.5 4.5 2.5L39 46v12" />
		<path d="M22 50h17" />
	{:else if id === 'escova'}
		<g transform="rotate(-35 32 32)">
			<rect x="4" y="29" width="34" height="7" rx="3.5" />
			<rect x="38" y="25" width="20" height="8" rx="2" />
			<path d="M41 25v-7M45 25v-8M49 25v-8M53 25v-8M57 25v-7" />
		</g>
	{:else if id === 'nivel-bolha'}
		<rect x="4" y="24" width="56" height="16" rx="3" />
		<rect x="24" y="28" width="16" height="8" rx="4" />
		<circle cx="32" cy="32" r="2" />
		<path d="M10 24v6M54 24v6M28 28v8M36 28v8" />
	{:else}
		<rect x="10" y="10" width="44" height="44" rx="8" />
		<path d="M24 24l16 16M40 24L24 40" />
	{/if}
</svg>
