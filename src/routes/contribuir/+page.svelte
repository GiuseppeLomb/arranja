<script lang="ts">
	import { resolve } from '$app/paths';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Wrench from '@lucide/svelte/icons/wrench';
	import BarraTopo from '#lib/componentes/BarraTopo.svelte';
	import { Button } from '#lib/design/index.ts';

	const REPO = 'https://github.com/GiuseppeLomb/arranja';
	const exemploFamilia = `# data/familias/<marca>.yaml
- id: marca-serie-abc
  brand: marca                  # id da marca (data/marcas.yaml)
  appliance_type: maquina-lavar-roupa
  nome: "Marca Série ABC"
  prefixos: [ABC]               # modelos começados por ABC…
  regex: ["^ABC\\\\d{3}[A-Z]{2}$"] # opcional, mais preciso
  sources:
    - url: https://www.fabricante.example/…
      titulo: Catálogo oficial da série ABC
      consultado_em: 2026-11-04`;
</script>

<svelte:head>
	<title>Contribuir · Arranja</title>
</svelte:head>

<BarraTopo titulo="Contribuir" />

<article class="prosa">
	<p>
		O Arranja vive de contribuições verificadas. Não precisas de saber programar: podes propor um guia ou uma correção através de um formulário no
		GitHub.
	</p>

	<div class="acoes">
		<Button variante="destaque" href="{REPO}/issues/new?template=novo-guia.yml" externo>
			{#snippet icone()}<BookOpen aria-hidden="true" />{/snippet}
			Propor um guia
		</Button>
		<Button variante="secundaria" href="{REPO}/issues/new?template=correcao.yml" externo>
			{#snippet icone()}<Wrench aria-hidden="true" />{/snippet}
			Pedir uma correção
		</Button>
	</div>

	<h2>Regras de verificação</h2>
	<ul>
		<li><strong>Fonte obrigatória</strong> para cada guia, árvore, código de erro e família: URL e data de consulta. Sem fonte, não entra.</li>
		<li><strong>Escreve por palavras tuas</strong>, em português de Portugal. Nunca copies texto de manuais.</li>
		<li><strong>Fotos próprias</strong> ou com licença compatível (CC0, CC BY, CC BY-SA, CC BY-NC, CC BY-NC-SA), sempre com autor e licença.</li>
		<li><strong>Manuais e PDFs de fabricantes não são alojados</strong> — só links para as páginas oficiais.</li>
		<li><strong>Sem logótipos de marcas</strong> e sem links de afiliados.</li>
		<li><strong>Segurança:</strong> gás, circuitos de refrigerante, interior de micro-ondas e ligações a 400 V são sempre «proibido».</li>
		<li>Conteúdo derivado do <strong>iFixit</strong> leva atribuição e link para a página original.</li>
		<li>Tudo é <strong>revisto por outra pessoa</strong> antes de ser publicado, e validado automaticamente (<code>npm run validate</code>).</li>
	</ul>

	<h2 id="familias">Mapear famílias de modelos</h2>
	<p>
		Os guias, diagnósticos e códigos de erro ligam-se a <strong>marca + família de modelos</strong>. Uma família agrupa modelos pelo início ou
		pelo padrão do identificador — por exemplo, todos os modelos de uma marca começados por <code>WAN</code>. Quando alguém escreve o modelo, o
		Arranja normaliza-o (maiúsculas, sem espaços, hífens, pontos ou barras) e compara-o com estes padrões.
	</p>
	<p>Para mapear uma família precisas de:</p>
	<ol>
		<li>
			<strong>Uma fonte</strong> que mostre que esses modelos partilham a mesma construção ou as mesmas peças: catálogo de peças do fabricante,
			manual de serviço publicado pelo fabricante, ou a lista de modelos compatíveis numa página oficial de peças.
		</li>
		<li><strong>O padrão mais estreito possível.</strong> Prefere <code>WAN28</code> a <code>WA</code>; um prefixo largo demais apanha modelos diferentes.</li>
		<li><strong>Exemplos reais</strong> de identificadores que pertencem e que não pertencem à família, para a revisão.</li>
	</ol>
	<pre><code>{exemploFamilia}</code></pre>
	<p>
		Os padrões aplicam-se ao identificador já normalizado. <code>prefixos</code> chega na maioria dos casos; usa <code>regex</code> só quando o
		prefixo não distingue as famílias. A validação rejeita expressões inválidas, marcas desconhecidas e famílias sem fonte.
	</p>
	<p>
		Se não sabes editar YAML, abre uma <a href="{REPO}/issues/new?template=correcao.yml" target="_blank" rel="noopener noreferrer external"
			>questão</a
		> com a marca, o padrão, exemplos e a fonte — alguém trata do resto.
	</p>

	<h2>Para quem programa</h2>
	<p>
		O conteúdo vive em <code>/data</code> (YAML), validado pelos esquemas em <code>/schemas</code>. Lê o
		<a href="{REPO}/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer external">CONTRIBUTING.md</a> para o fluxo completo.
	</p>
	<p class="nota">
		Ao contribuir, aceitas que o teu conteúdo seja publicado sob CC BY-NC-SA 4.0. Lê também as <a href={resolve('/seguranca')}>regras de segurança</a>.
	</p>
</article>

<style>
	.acoes {
		display: flex;
		flex-wrap: wrap;
		gap: var(--e-3);
	}
	.nota {
		font-size: var(--t-sm);
		color: var(--texto-suave);
	}
</style>
