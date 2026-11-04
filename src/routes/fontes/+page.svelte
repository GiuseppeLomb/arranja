<script lang="ts">
	import BarraTopo from '#lib/componentes/BarraTopo.svelte';
	import { conteudo, nomeTipo } from '#lib/data/conteudo.ts';

	const dataPt = (iso: string) => new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
	const totalModelos = conteudo.eprel.grupos.reduce((s, g) => s + g.total, 0);
	const ifixit = conteudo.guias.filter((g) => g.attribution && /ifixit\.com/.test(g.attribution.url));
	const nFontes = new Set(
		[...conteudo.guias, ...conteudo.arvores, ...conteudo.codigos, ...conteudo.familias].flatMap((x) => x.sources.map((s) => s.url))
	).size;
</script>

<svelte:head>
	<title>Fontes e atribuições · Arranja</title>
</svelte:head>

<BarraTopo titulo="Fontes e atribuições" />

<article class="prosa">
	<h2>Dados de modelos: EPREL</h2>
	<p>
		A lista de modelos vem do <strong>EPREL — European Product Registry for Energy Labelling</strong>, a base de dados de etiquetagem energética da
		<strong>Comissão Europeia</strong>
		(<a href="https://eprel.ec.europa.eu" target="_blank" rel="noopener noreferrer external">eprel.ec.europa.eu</a>), obtida através da API pública
		ao abrigo dos
		<a
			href="https://ec.europa.eu/assets/move-ener/eprel/EPREL%20Public/Public%20API%20Term%20and%20Conditions/API_TERMS_AND_CONDITIONS_EN.pdf"
			target="_blank"
			rel="noopener noreferrer external">termos e condições da API</a
		>.
	</p>
	<p>
		Os dados pertencem aos serviços da Comissão Europeia responsáveis pelo EPREL e foram fornecidos pelos fabricantes, que são responsáveis pela sua
		exatidão. O Arranja <strong>não é afiliado, patrocinado nem aprovado</strong> pela Comissão Europeia nem pelo EPREL. A cópia local é substituída
		por inteiro todos os meses, para refletir correções e remoções.
	</p>
	{#if conteudo.eprel.grupos.length}
		<ul>
			{#each conteudo.eprel.grupos as g (g.grupo)}
				<li>{nomeTipo(g.appliance_type)} — grupo <code>{g.grupo}</code>: {g.total} modelos (obtidos a {dataPt(g.obtido_em)})</li>
			{/each}
		</ul>
		<p>Total: {totalModelos} modelos.</p>
	{:else}
		<p class="nota">Ainda não importámos dados do EPREL (aguarda chave da API). Até lá, indicas o modelo à mão.</p>
	{/if}
	<p class="nota">
		Os dados EPREL não estão abrangidos pela licença CC BY-NC-SA do conteúdo do Arranja: continuam sujeitos aos termos da API EPREL.
	</p>

	<h2>Guias derivados do iFixit</h2>
	<p>
		Alguns guias podem basear-se em guias do <a href="https://www.ifixit.com" target="_blank" rel="noopener noreferrer external">iFixit</a>,
		publicados sob licença Creative Commons BY-NC-SA. Cada um indica o autor original e liga para a página de origem.
	</p>
	{#if ifixit.length}
		<ul>
			{#each ifixit as g (g.id)}
				<li>{g.titulo} — <a href={g.attribution!.url} target="_blank" rel="noopener noreferrer external">{g.attribution!.texto}</a></li>
			{/each}
		</ul>
	{:else}
		<p class="nota">De momento nenhum guia publicado deriva do iFixit.</p>
	{/if}

	<h2>Outras fontes</h2>
	<p>
		Cada guia, diagnóstico, código de erro e família de modelos lista as suas fontes, com a data de consulta. Neste momento há {nFontes}
		{nFontes === 1 ? 'fonte distinta' : 'fontes distintas'}. Manuais e documentos dos fabricantes nunca são alojados aqui: só ligamos para as páginas
		oficiais.
	</p>

	<h2>Licenças</h2>
	<ul>
		<li><strong>Código:</strong> MIT.</li>
		<li><strong>Conteúdo próprio</strong> (guias, diagnósticos, códigos de erro, famílias, glossário, ilustrações): CC BY-NC-SA 4.0.</li>
		<li><strong>Dados EPREL:</strong> termos da API EPREL (ver acima).</li>
		<li><strong>Tipos de letra:</strong> Bricolage Grotesque e Atkinson Hyperlegible Next, SIL Open Font License 1.1, alojados localmente.</li>
		<li><strong>Ícones de interface:</strong> Lucide (licença ISC). Ícones de eletrodomésticos, ilustrações e logótipo: próprios.</li>
		<li><strong>Marcas:</strong> só nomes em texto; nenhum logótipo de fabricante é usado.</li>
	</ul>
</article>

<style>
	.nota {
		font-size: var(--t-sm);
		color: var(--texto-suave);
	}
</style>
