<script lang="ts">
	import { resolve } from '$app/paths';
	import BarraTopo from '#lib/componentes/BarraTopo.svelte';
	import Monograma from '#lib/ilustracoes/Monograma.svelte';
</script>

<svelte:head>
	<title>Sobre · Arranja</title>
</svelte:head>

<BarraTopo titulo="Sobre o Arranja" />

<article class="prosa">
	<div class="logo"><Monograma tamanho={72} /></div>
	<p><strong>Antes de deitar fora, arranja.</strong></p>
	<p>
		O Arranja reúne guias de reparação de eletrodomésticos vendidos em Portugal, escritos em português de Portugal, para quem quer tentar
		resolver uma avaria simples antes de chamar um técnico ou comprar um aparelho novo.
	</p>

	<h2>Princípios</h2>
	<ul>
		<li><strong>Sem fins lucrativos.</strong> Sem anúncios, sem links de afiliados, sem vendas.</li>
		<li><strong>Sem contas, sem cookies, sem rastreio.</strong> Nada sai do teu dispositivo. <a href={resolve('/privacidade')}>Ver privacidade</a>.</li>
		<li><strong>Nada inventado.</strong> Cada passo, peça e código de erro tem fonte verificável. Sem fonte, não entra.</li>
		<li><strong>Sem IA no diagnóstico.</strong> Os diagnósticos são árvores de decisão fixas, escritas e revistas por pessoas.</li>
		<li><strong>Segurança primeiro.</strong> Há trabalhos que o Arranja nunca ensina. <a href={resolve('/seguranca')}>Ver regras</a>.</li>
		<li><strong>Aberto.</strong> Código MIT e conteúdo CC BY-NC-SA 4.0, no GitHub.</li>
	</ul>

	<h2>Funciona sem internet</h2>
	<p>
		Instala o Arranja no ecrã principal (no menu do browser, «Adicionar ao ecrã principal» ou «Instalar app») e os guias ficam disponíveis mesmo
		sem rede — útil na lavandaria ou na cave.
	</p>

	<h2>Quem faz</h2>
	<p>
		Um projeto pessoal e comunitário. Qualquer pessoa pode propor guias e correções:
		<a href={resolve('/contribuir')}>vê como contribuir</a>. O código está em
		<a href="https://github.com/GiuseppeLomb/arranja" target="_blank" rel="noopener noreferrer external">github.com/GiuseppeLomb/arranja</a>.
	</p>
	<p class="nota">Os nomes de marcas são usados apenas para identificar aparelhos. O Arranja não tem qualquer ligação aos fabricantes.</p>
</article>

<style>
	.logo {
		margin-bottom: var(--e-2);
	}
	.nota {
		font-size: var(--t-sm);
		color: var(--texto-suave);
	}
</style>
