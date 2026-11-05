<script lang="ts">
	import type { Fonte } from '#lib/data/tipos.ts';
	import { nomeMarca } from '#lib/data/conteudo.ts';

	type Props = {
		fontes: Fonte[];
		licenca?: string;
		atribuicao?: { texto: string; url: string; licenca_original?: string };
	};
	let { fontes, licenca, atribuicao }: Props = $props();

	const data = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });
	const host = (u: string) => {
		try {
			return new URL(u).hostname.replace(/^www\./, '');
		} catch {
			return u;
		}
	};
</script>

<section class="fontes" aria-labelledby="fontes-titulo">
	<h2 id="fontes-titulo" class="secao-titulo">Fontes</h2>
	<ul>
		{#each fontes as f (f.url)}
			<li>
				{#if f.documento_oficial}
					{@const doc = f.documento_oficial}
					<a href={f.url} target="_blank" rel="noopener noreferrer external">Manual oficial {nomeMarca(doc.fabricante)} (ref. {doc.referencia_documento})</a>
					<span class="meta">Modelos: {doc.modelos.join(', ')}</span>
					<span class="meta">{f.pagina ? `${/[,–]/.test(f.pagina) ? 'pp.' : 'p.'} ${f.pagina} · ` : ''}cópia alojada por {doc.alojado_por} ({host(f.url)}) · consultado a {data(f.consultado_em)}</span>
				{:else}
					<a href={f.url} target="_blank" rel="noopener noreferrer external">{f.titulo ?? host(f.url)}</a>
					<span class="meta">{f.pagina ? `${/[,–]/.test(f.pagina) ? 'pp.' : 'p.'} ${f.pagina} · ` : ''}{host(f.url)} · consultado a {data(f.consultado_em)}</span>
				{/if}
			</li>
		{/each}
	</ul>
	{#if atribuicao}
		<p class="atribuicao">
			{atribuicao.texto} — <a href={atribuicao.url} target="_blank" rel="noopener noreferrer external">página original</a>
			{#if atribuicao.licenca_original}({atribuicao.licenca_original}){/if}
		</p>
	{/if}
	{#if licenca}
		<p class="licenca">Conteúdo sob licença {licenca.replace(/-/g, ' ').replace('CC BY NC SA', 'CC BY-NC-SA')}.</p>
	{/if}
</section>

<style>
	.fontes {
		display: flex;
		flex-direction: column;
		gap: var(--e-3);
		padding-top: var(--e-4);
		border-top: 1px solid var(--linha);
	}
	ul {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--e-3);
	}
	li {
		display: flex;
		flex-direction: column;
	}
	li a {
		font-weight: 700;
		overflow-wrap: anywhere;
	}
	.meta,
	.licenca,
	.atribuicao {
		font-size: var(--t-sm);
		color: var(--texto-suave);
	}
</style>
