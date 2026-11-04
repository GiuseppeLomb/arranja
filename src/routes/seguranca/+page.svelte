<script lang="ts">
	import BarraTopo from '#lib/componentes/BarraTopo.svelte';
	import { RiskBadge } from '#lib/design/index.ts';
</script>

<svelte:head>
	<title>Segurança · Arranja</title>
</svelte:head>

<BarraTopo titulo="Segurança" />

<article class="prosa">
	<p><strong>Nenhuma reparação vale um acidente.</strong> Lê estas regras antes de qualquer guia. Em caso de dúvida, não avances.</p>

	<h2>Antes de começar</h2>
	<ol>
		<li>
			<strong>Desliga da corrente.</strong> Tira a ficha da tomada — desligar só no botão não chega. Se o aparelho estiver ligado diretamente à
			instalação, desliga o disjuntor correspondente no quadro elétrico.
		</li>
		<li><strong>Fecha a água</strong> nas máquinas de lavar: fecha a torneira de alimentação e tem um balde e panos por perto.</li>
		<li><strong>Espera que arrefeça.</strong> Resistências, motores e água podem estar muito quentes logo depois de um ciclo.</li>
		<li><strong>Pede ajuda para mover o aparelho.</strong> Máquinas e frigoríficos são pesados e podem tombar.</li>
		<li>
			<strong>Confirma a garantia.</strong> Se o aparelho ainda estiver dentro da garantia, contacta primeiro o vendedor ou o fabricante: a
			reparação pode não ter custos, e abrir o aparelho pode complicar esse processo.
		</li>
	</ol>

	<h2>O que o Arranja nunca ensina a fazer</h2>
	<p>Estes trabalhos estão marcados como <RiskBadge nivel="proibido" /> e os guias só explicam o perigo:</p>
	<ul>
		<li><strong>Gás combustível</strong> (aparelhos ligados à rede de gás ou a garrafa): qualquer intervenção é para um técnico de gás credenciado.</li>
		<li>
			<strong>Circuito de gás refrigerante</strong> (frigoríficos, arcas, máquinas de secar com bomba de calor): o circuito é selado e o gás pode ser
			inflamável ou um gás fluorado. Abri-lo exige técnico certificado e equipamento próprio.
		</li>
		<li>
			<strong>Interior do micro-ondas:</strong> tem componentes de alta tensão, como o condensador, que podem guardar uma carga perigosa mesmo com o
			aparelho desligado.
		</li>
		<li><strong>Ligações a 400 V</strong> (trifásicas): só um eletricista.</li>
	</ul>

	<h2>Pára e chama um técnico se…</h2>
	<ul>
		<li>sentires cheiro a queimado ou a gás, ou vires marcas de faíscas ou fios derretidos;</li>
		<li>o disjuntor ou o diferencial disparar quando ligas o aparelho;</li>
		<li>houver água junto de ligações elétricas;</li>
		<li>um passo do guia não corresponder ao que vês no teu aparelho.</li>
	</ul>

	<h2>Níveis de risco</h2>
	<ul class="niveis">
		<li><RiskBadge nivel="baixo" /> Manutenção simples, sem abrir o aparelho ou com acesso fácil.</li>
		<li><RiskBadge nivel="medio" /> Exige abrir tampas ou desligar ligações. Segue os avisos com atenção.</li>
		<li><RiskBadge nivel="alto" /> Exige experiência e cuidado redobrado. Se nunca fizeste nada parecido, chama um técnico.</li>
		<li><RiskBadge nivel="proibido" /> Não é para fazer em casa. O guia explica porquê.</li>
	</ul>

	<p>
		Todos os guias começam com o mesmo passo fixo, que não pode ser alterado: <strong>«Desliga da corrente (e da água, se aplicável)»</strong>.
	</p>
	<p class="nota">
		Os guias são informativos. Segues as instruções por tua conta e risco; o Arranja não se responsabiliza por danos resultantes de reparações.
	</p>
</article>

<style>
	.niveis {
		list-style: none;
		padding-left: 0 !important;
	}
	.niveis li {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--e-2);
	}
	.nota {
		font-size: var(--t-sm);
		color: var(--texto-suave);
	}
</style>
