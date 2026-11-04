<script lang="ts">
	import { resolve } from '$app/paths';
	import Trash from '@lucide/svelte/icons/trash';
	import BarraTopo from '#lib/componentes/BarraTopo.svelte';
	import { Button } from '#lib/design/index.ts';
	import { apagarTudo, PREFIXO, CHAVES } from '#lib/estado/armazenamento.ts';
	import { favoritos, recentes } from '#lib/estado/colecoes.svelte.ts';
	import { definirTema } from '#lib/estado/preferencias.svelte.ts';
	import { mostrarToast } from '#lib/estado/toasts.svelte.ts';

	function apagar() {
		const n = apagarTudo();
		favoritos.lista = [];
		recentes.lista = [];
		definirTema('auto');
		mostrarToast(n ? 'Dados locais apagados' : 'Não havia dados guardados', 'sucesso');
	}
</script>

<svelte:head>
	<title>Privacidade · Arranja</title>
</svelte:head>

<BarraTopo titulo="Privacidade" />

<article class="prosa">
	<p><strong>Resumo: o Arranja não recolhe dados sobre ti.</strong></p>
	<ul>
		<li>Sem contas nem registos.</li>
		<li>Sem cookies.</li>
		<li>Sem estatísticas, analytics ou publicidade.</li>
		<li>Sem pedidos a serviços de terceiros: tipos de letra, ícones e dados estão todos alojados junto da app.</li>
		<li>As pesquisas e escolhas são feitas no teu dispositivo e não são enviadas para lado nenhum.</li>
	</ul>

	<h2>O que fica guardado no teu dispositivo</h2>
	<p>Só para tua conveniência, no armazenamento local do browser (nunca sai do dispositivo). A app funciona igual sem ele.</p>
	<ul>
		<li><code>{PREFIXO}{CHAVES.favoritos}</code> — guias, diagnósticos e códigos que marcaste com estrela.</li>
		<li><code>{PREFIXO}{CHAVES.recentes}</code> — os últimos aparelhos (tipo, marca e modelo) que consultaste.</li>
		<li><code>{PREFIXO}{CHAVES.tema}</code> — tema claro/escuro, se o escolheste.</li>
		<li><code>{PREFIXO}{CHAVES.oficina}</code> — se o Modo Oficina está ligado.</li>
		<li><code>{PREFIXO}{CHAVES.vistaInicio}</code> — se preferes ver os eletrodomésticos em lista em vez da ilustração.</li>
		<li><code>{PREFIXO}selecao</code> (só durante a sessão) — as escolhas do fluxo de reparação em curso.</li>
	</ul>
	<p>A cópia offline da app é guardada pelo service worker na cache do browser.</p>
	<div>
		<Button variante="secundaria" onclick={apagar}>
			{#snippet icone()}<Trash aria-hidden="true" />{/snippet}
			Apagar todos os dados locais
		</Button>
	</div>

	<h2>Alojamento</h2>
	<p>
		O Arranja é servido pelo GitHub Pages. Como qualquer servidor, o GitHub pode registar dados técnicos dos acessos (por exemplo, o endereço IP)
		por motivos de segurança, segundo a
		<a href="https://docs.github.com/pt/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer external"
			>declaração de privacidade do GitHub</a
		>. O Arranja não tem acesso a esses registos.
	</p>

	<h2>Ligações externas</h2>
	<p>
		Algumas páginas têm ligações para sites externos (fichas EPREL, páginas oficiais de peças dos fabricantes, fontes dos guias). Só são abertas se
		tocares nelas e têm as suas próprias políticas de privacidade.
	</p>

	<p>Dúvidas? Abre uma questão no <a href="https://github.com/GiuseppeLomb/arranja/issues" target="_blank" rel="noopener noreferrer external">GitHub</a> ou lê <a href={resolve('/sobre')}>sobre o projeto</a>.</p>
</article>
