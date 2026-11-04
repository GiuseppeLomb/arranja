<script lang="ts">
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';

	type Props = {
		value?: string;
		rotulo: string;
		placeholder?: string;
		id?: string;
		/** Mostra o rótulo visível em vez de só para leitores de ecrã. */
		rotuloVisivel?: boolean;
		inputmode?: 'search' | 'text';
		maiusculas?: boolean;
		oninput?: (v: string) => void;
		onsubmit?: (v: string) => void;
		onfocus?: () => void;
		el?: HTMLInputElement;
	};

	let {
		value = $bindable(''),
		rotulo,
		placeholder,
		id = `pesquisa-${Math.random().toString(36).slice(2, 8)}`,
		rotuloVisivel = false,
		inputmode = 'search',
		maiusculas = false,
		oninput,
		onsubmit,
		onfocus,
		el = $bindable()
	}: Props = $props();

	function submeter(e: SubmitEvent) {
		e.preventDefault();
		onsubmit?.(value);
	}

	function limpar() {
		value = '';
		oninput?.('');
		el?.focus();
	}
</script>

<form class="barra" role="search" onsubmit={submeter}>
	<label for={id} class={rotuloVisivel ? 'rotulo' : 'vh'}>{rotulo}</label>
	<div class="campo">
		<Search class="lupa" aria-hidden="true" />
		<input
			bind:this={el}
			{id}
			type="search"
			{inputmode}
			enterkeyhint="search"
			autocomplete="off"
			autocapitalize={maiusculas ? 'characters' : 'off'}
			spellcheck="false"
			{placeholder}
			bind:value
			oninput={() => oninput?.(value)}
			{onfocus}
		/>
		{#if value}
			<button type="button" class="limpar" aria-label="Limpar pesquisa" onclick={limpar}>
				<X aria-hidden="true" />
			</button>
		{/if}
	</div>
</form>

<style>
	.barra {
		display: flex;
		flex-direction: column;
		gap: var(--e-2);
		width: 100%;
	}
	.rotulo {
		font-weight: 700;
	}
	.campo {
		position: relative;
		display: flex;
		align-items: center;
	}
	.campo :global(.lupa) {
		position: absolute;
		left: var(--e-4);
		width: 22px;
		height: 22px;
		color: var(--texto-suave);
		pointer-events: none;
	}
	input {
		width: 100%;
		min-height: var(--alvo-grande);
		padding: 0 var(--e-12) 0 var(--e-12);
		border-radius: var(--raio-chip);
		border: 2px solid var(--linha-forte);
		background: var(--superficie-1);
		color: var(--texto);
		font-size: var(--t-md);
		box-shadow: var(--sombra-1);
		transition:
			border-color var(--dur-micro) var(--ease),
			box-shadow var(--dur-micro) var(--ease);
	}
	input::placeholder {
		color: var(--texto-suave);
		opacity: 1;
	}
	input:focus {
		outline: none;
		border-color: var(--foco);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--foco) 25%, transparent);
	}
	input::-webkit-search-cancel-button {
		display: none;
	}
	.limpar {
		position: absolute;
		right: 4px;
		width: var(--alvo);
		height: var(--alvo);
		display: grid;
		place-items: center;
		border: 0;
		border-radius: 50%;
		background: transparent;
		color: var(--texto-suave);
	}
	.limpar :global(svg) {
		width: 20px;
		height: 20px;
	}
</style>
