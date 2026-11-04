<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import { page } from '$app/state';
	import { goto, pushState, replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import Stethoscope from '@lucide/svelte/icons/stethoscope';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import CircleQuestionMark from '@lucide/svelte/icons/circle-question-mark';
	import PencilLine from '@lucide/svelte/icons/pencil-line';
	import FileSearch from '@lucide/svelte/icons/file-search';
	import Layers from '@lucide/svelte/icons/layers';
	import BarraTopo from '#lib/componentes/BarraTopo.svelte';
	import Migalhas, { type Migalha } from '#lib/componentes/Migalhas.svelte';
	import SeloModelo from '#lib/componentes/SeloModelo.svelte';
	import IconeEletrodomestico from '#lib/ilustracoes/IconeEletrodomestico.svelte';
	import { Button, Card, Chip, SearchBar, Skeleton, EmptyState, RiskBadge, Sheet } from '#lib/design/index.ts';
	import { marcasDoTipo, conteudoPara, familiasDoModelo, marcas, nomeMarca } from '#lib/data/conteudo.ts';
	import { carregarModelos, pesquisarModelos, type ModeloEprel } from '#lib/data/modelos.ts';
	import { normalizarModelo, normalizarTexto, slugMarca } from '#lib/data/normalizar.ts';
	import { selecao, carregarSelecao, escolherTipo, escolherMarca, escolherModelo } from '#lib/estado/selecao.svelte.ts';
	import { registarRecente, carregarColecoes } from '#lib/estado/colecoes.svelte.ts';
	import { comTransicao, entrar, entrarEcra, cascata, suportaVT, movimento } from '#lib/motion/index.ts';

	let { data } = $props();
	const tipo = $derived(data.tipo);

	type Passo = 'marca' | 'modelo' | 'problema';
	const ORDEM: Passo[] = ['marca', 'modelo', 'problema'];

	let montado = $state(false);
	const passoInicial = $derived<Passo>(
		selecao.tipo === tipo.id && selecao.marca ? (selecao.modelo !== undefined ? 'problema' : 'modelo') : 'marca'
	);
	const passo = $derived<Passo>(page.state.passo ?? passoInicial);

	onMount(async () => {
		carregarSelecao();
		carregarColecoes();
		if (selecao.tipo !== tipo.id) escolherTipo(tipo.id);
		montado = true;
		await tick();
		// A entrada inicial do histórico fica com o passo explícito, para "voltar" funcionar passo a passo.
		if (!page.state.passo) {
			try {
				replaceState('', { passo: passoInicial });
			} catch {
				setTimeout(() => replaceState('', { passo: passoInicial }), 0);
			}
		}
	});

	async function irPara(p: Passo) {
		if (p === passo) return;
		document.documentElement.dataset.direcao = ORDEM.indexOf(p) > ORDEM.indexOf(passo) ? 'avancar' : 'recuar';
		await comTransicao(() => pushState('', { passo: p }));
	}

	// Sem View Transitions, os passos entram com transições do Svelte.
	const animarPasso = (node: Element) => (suportaVT() || !montado ? { duration: 0 } : entrarEcra(node, { x: 0, y: 16 }));

	// ---------- Marca ----------
	const listaMarcas = $derived(marcasDoTipo(tipo.id));
	let filtroMarca = $state('');
	let marcaLivre = $state('');
	const marcasFiltradas = $derived.by(() => {
		const f = normalizarTexto(filtroMarca);
		return f ? listaMarcas.filter((m) => normalizarTexto(m.nome).includes(f)) : listaMarcas;
	});

	function escolher(m: { id: string; nome: string }) {
		escolherMarca({ id: m.id, nome: m.nome });
		irPara('modelo');
	}

	function usarMarcaLivre(e: SubmitEvent) {
		e.preventDefault();
		const nome = marcaLivre.trim().replace(/\s+/g, ' ');
		const id = slugMarca(nome);
		if (!id) return;
		escolher({ id, nome: marcas.get(id)?.nome ?? nome });
	}

	// ---------- Modelo ----------
	const nModelosEprel = $derived(selecao.marca ? (marcas.get(selecao.marca.id)?.eprel[tipo.id] ?? 0) : 0);
	let listaModelos = $state<ModeloEprel[] | null>(null);
	let aCarregarModelos = $state(false);
	let textoModelo = $state('');
	let ajudaModelo = $state(false);

	$effect(() => {
		const m = selecao.marca;
		if (passo !== 'modelo' || !m || nModelosEprel === 0) return;
		aCarregarModelos = true;
		listaModelos = null;
		carregarModelos(tipo.id, m.id).then((l) => {
			listaModelos = l;
			aCarregarModelos = false;
		});
	});

	const sugestoes = $derived(listaModelos && textoModelo.trim().length >= 2 ? pesquisarModelos(listaModelos, textoModelo, 25) : []);
	const normalizado = $derived(normalizarModelo(textoModelo));
	const familiasCorrespondentes = $derived(
		selecao.marca && normalizado.length >= 2 ? familiasDoModelo(tipo.id, selecao.marca.id, normalizado) : []
	);

	function escolherEprel(m: ModeloEprel) {
		escolherModelo({ texto: m.identificador, normalizado: m.normalizado, eprel: { registo: m.registo, grupo: m.grupo, url: m.url } });
		irPara('problema');
	}

	function usarModeloLivre() {
		if (normalizado.length < 2) return;
		const exato = listaModelos?.find((m) => m.normalizado === normalizado);
		if (exato) return escolherEprel(exato);
		escolherModelo({ texto: textoModelo.trim(), normalizado });
		irPara('problema');
	}

	function semModelo() {
		escolherModelo(null);
		irPara('problema');
	}

	// ---------- Problema ----------
	const encontrado = $derived(
		selecao.marca && selecao.modelo !== undefined ? conteudoPara(tipo.id, selecao.marca.id, selecao.modelo?.normalizado ?? null) : null
	);
	const total = $derived(encontrado ? encontrado.codigos.length + encontrado.arvores.length + encontrado.guias.length : 0);
	let filtroCodigo = $state('');
	const codigosFiltrados = $derived.by(() => {
		if (!encontrado) return [];
		const f = normalizarModelo(filtroCodigo);
		return f ? encontrado.codigos.filter((c) => [c.item.code, ...(c.item.aliases ?? [])].some((x) => normalizarModelo(x).includes(f))) : encontrado.codigos;
	});

	$effect(() => {
		if (montado && passo === 'problema' && selecao.marca && selecao.modelo !== undefined) {
			const r = { tipo: tipo.id, marca: $state.snapshot(selecao.marca), modelo: $state.snapshot(selecao.modelo) };
			// untrack: registar lê e escreve a lista de recentes (evita ciclo de efeitos).
			untrack(() => registarRecente(r));
		}
	});

	// ---------- Migalhas ----------
	const migalhas = $derived.by<Migalha[]>(() => {
		const itens: Migalha[] = [{ id: 'tipo', rotulo: 'Eletrodoméstico', valor: tipo.nome_curto ?? tipo.nome, ir: () => goto(resolve('/reparar')) }];
		const i = ORDEM.indexOf(passo);
		itens.push({ id: 'marca', rotulo: 'Marca', valor: i > 0 ? selecao.marca?.nome : 'Escolher', ir: () => irPara('marca'), atual: passo === 'marca' });
		if (i >= 1)
			itens.push({
				id: 'modelo',
				rotulo: 'Modelo',
				valor: i > 1 ? (selecao.modelo?.texto ?? 'Não sei') : 'Indicar',
				ir: () => irPara('modelo'),
				atual: passo === 'modelo'
			});
		if (i >= 2) itens.push({ id: 'problema', rotulo: 'Problema', valor: 'Escolher', atual: true });
		return itens;
	});
</script>

<svelte:head>
	<title>{tipo.nome} · Arranja</title>
</svelte:head>

<BarraTopo titulo={tipo.nome} voltar={resolve('/reparar')} vt="tipo-{tipo.id}" />
<Migalhas itens={migalhas} />

{#key passo}
	<section class="passo" in:animarPasso aria-live="polite">
		{#if passo === 'marca'}
			<h2>Qual é a marca?</h2>

			{#if listaMarcas.length > 8}
				<SearchBar bind:value={filtroMarca} rotulo="Filtrar marcas" placeholder="Filtrar marcas" inputmode="text" />
			{/if}

			{#if listaMarcas.length}
				<ul class="chips">
					{#each marcasFiltradas.slice(0, 120) as m, i (m.id)}
						<li in:entrar={{ delay: cascata(i, 16) }}>
							<Chip onclick={() => escolher(m)} selecionado={selecao.marca?.id === m.id} vt="marca-{m.id}">
								{m.nome}{m.example ? ' (exemplo)' : ''}
							</Chip>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="nota">
					Ainda não temos a lista oficial de marcas para este eletrodoméstico. Escreve a marca tal como aparece no aparelho.
				</p>
			{/if}

			<form class="livre" onsubmit={usarMarcaLivre}>
				<label for="marca-livre">{listaMarcas.length ? 'A tua marca não está na lista?' : 'Marca'}</label>
				<div class="linha-livre">
					<input id="marca-livre" type="text" autocomplete="off" bind:value={marcaLivre} placeholder="Ex.: nome da marca" />
					<Button type="submit" variante="secundaria" disabled={!slugMarca(marcaLivre)}>Continuar</Button>
				</div>
			</form>
		{:else if passo === 'modelo' && selecao.marca}
			<h2 class="titulo-marca">
				<span class="marca-nome" style:view-transition-name="marca-{selecao.marca.id}">{selecao.marca.nome}</span>
				<span class="sub">Qual é o modelo?</span>
			</h2>

			<SearchBar
				bind:value={textoModelo}
				rotulo="Modelo do aparelho"
				rotuloVisivel
				placeholder="Ex.: como aparece na etiqueta"
				inputmode="text"
				maiusculas
				onsubmit={usarModeloLivre}
			/>

			<button type="button" class="ajuda" onclick={() => (ajudaModelo = true)}>
				<CircleQuestionMark aria-hidden="true" /> Onde encontro o modelo?
			</button>

			{#if nModelosEprel > 0}
				{#if aCarregarModelos}
					<div aria-label="A carregar modelos"><Skeleton altura="56px" raio="16px" linhas={4} /></div>
				{:else if sugestoes.length}
					<ul class="modelos" aria-label="Modelos encontrados no EPREL">
						{#each sugestoes as m, i (m.registo + m.normalizado)}
							<li in:entrar={{ delay: cascata(i) }}>
								<Card onclick={() => escolherEprel(m)} classe="modelo-item">
									<span class="modelo-id">{m.identificador}</span>
									<span class="modelo-meta">EPREL n.º {m.registo}</span>
									<ChevronRight aria-hidden="true" class="seta" />
								</Card>
							</li>
						{/each}
					</ul>
				{:else if textoModelo.trim().length >= 2}
					<p class="nota">Não encontrámos este modelo na lista oficial (EPREL). Confirma a etiqueta ou usa o modelo tal como o escreveste.</p>
				{:else}
					<p class="nota">{nModelosEprel} modelos desta marca na base de dados europeia EPREL. Começa a escrever para procurar.</p>
				{/if}
			{:else}
				<p class="nota">
					Não temos a lista oficial de modelos desta marca. Escreve o modelo tal como aparece na etiqueta — vamos compará-lo com as
					famílias de modelos que conhecemos.
				</p>
			{/if}

			{#if familiasCorrespondentes.length}
				<p class="familia" in:entrar>
					<Layers aria-hidden="true" />
					<span>Pertence à família <strong>{familiasCorrespondentes.map((f) => f.nome).join(', ')}</strong></span>
				</p>
			{/if}

			<div class="acoes">
				{#if normalizado.length >= 2}
					<Button variante="primaria" largo onclick={usarModeloLivre}>
						{#snippet icone()}<PencilLine aria-hidden="true" />{/snippet}
						Usar «{textoModelo.trim()}»
					</Button>
				{/if}
				<Button variante="fantasma" largo onclick={semModelo}>Não sei o modelo</Button>
			</div>

			<Sheet bind:aberto={ajudaModelo} titulo="Onde encontro o modelo?">
				<div class="prosa">
					<p>
						Procura a <strong>etiqueta de características</strong> do aparelho. Costuma estar no aro da porta, na parte de trás, por baixo ou
						dentro do aparelho, e indica a marca, o modelo e muitas vezes um número de série.
					</p>
					<p>
						Nas etiquetas energéticas europeias mais recentes (desde março de 2021), o código QR leva à ficha do modelo na base de dados
						EPREL, onde aparece o identificador exato.
					</p>
					<p>Escreve o modelo como está na etiqueta. Espaços, hífens e barras não importam.</p>
				</div>
			</Sheet>
		{:else if passo === 'problema' && selecao.marca && encontrado}
			<Card classe="resumo">
				<span class="resumo-icone"><IconeEletrodomestico icone={tipo.icone} tamanho={32} /></span>
				<span class="resumo-txt">
					<strong>{selecao.marca.nome} {selecao.modelo?.texto ?? ''}</strong>
					<span>{tipo.nome}</span>
				</span>
				<span class="resumo-selo">
					{#if selecao.modelo}
						<SeloModelo modelo={selecao.modelo} />
					{:else}
						<span class="sem-modelo">Modelo não indicado</span>
					{/if}
				</span>
			</Card>

			<h2>Qual é o problema?</h2>

			{#if !selecao.modelo}
				<p class="nota">Sem modelo, só mostramos conteúdo que serve a todos os modelos desta marca.</p>
			{/if}

			{#if total === 0}
				<EmptyState titulo="Ainda não temos dados verificados para este modelo" texto="Todo o conteúdo do Arranja precisa de fonte verificada. Podes ajudar a acrescentá-lo.">
					{#snippet icone()}<FileSearch />{/snippet}
					<Button variante="destaque" href={resolve('/contribuir')}>Contribuir com dados</Button>
					<Button variante="secundaria" href={resolve('/seguranca')}>Regras de segurança</Button>
				</EmptyState>
			{:else}
				{#if encontrado.codigos.length}
					<section class="pilha" aria-labelledby="codigos-t">
						<h3 id="codigos-t" class="secao-titulo">Código de erro no visor</h3>
						{#if encontrado.codigos.length > 6}
							<SearchBar bind:value={filtroCodigo} rotulo="Filtrar códigos de erro" placeholder="Ex.: E18" maiusculas />
						{/if}
						<ul class="chips">
							{#each codigosFiltrados as { item }, i (item.id)}
								<li in:entrar={{ delay: cascata(i) }}>
									<Chip href={resolve('/erro/[id]', { id: item.id })}>
										{#snippet icone()}<CircleAlert aria-hidden="true" />{/snippet}
										{item.code}
									</Chip>
								</li>
							{/each}
						</ul>
					</section>
				{/if}

				{#if encontrado.arvores.length}
					<section class="pilha" aria-labelledby="sintomas-t">
						<h3 id="sintomas-t" class="secao-titulo">Sintomas</h3>
						<ul class="cartoes">
							{#each encontrado.arvores as { item, c }, i (item.id)}
								<li in:entrar={{ delay: cascata(i) }}>
									<Card href={resolve('/diagnostico/[id]', { id: item.id })} classe="item-lista">
										<Stethoscope aria-hidden="true" class="ic" />
										<span class="item-txt">
											<strong>{item.sintoma}</strong>
											<span>{c.nivel === 'familia' && c.familia ? c.familia.nome : 'Diagnóstico passo a passo'}</span>
										</span>
										<ChevronRight aria-hidden="true" class="seta" />
									</Card>
								</li>
							{/each}
						</ul>
					</section>
				{/if}

				{#if encontrado.guias.length}
					<section class="pilha" aria-labelledby="guias-t">
						<h3 id="guias-t" class="secao-titulo">Guias de reparação</h3>
						<ul class="cartoes">
							{#each encontrado.guias as { item }, i (item.id)}
								<li in:entrar={{ delay: cascata(i) }}>
									<Card href={resolve('/guia/[id]', { id: item.id })} classe="item-lista">
										<BookOpen aria-hidden="true" class="ic" />
										<span class="item-txt">
											<strong>{item.titulo}</strong>
											<span class="item-meta"><RiskBadge nivel={item.risk_level} /> ≈ {item.tempo_estimado} min</span>
										</span>
										<ChevronRight aria-hidden="true" class="seta" />
									</Card>
								</li>
							{/each}
						</ul>
					</section>
				{/if}

				<p class="nota rodape">
					Não encontras o teu problema? <a href={resolve('/contribuir')}>Diz-nos o que falta</a> ou consulta as
					<a href={resolve('/seguranca')}>regras de segurança</a>.
				</p>
			{/if}
		{:else}
			<div aria-hidden="true"><Skeleton altura="48px" linhas={3} /></div>
		{/if}
	</section>
{/key}

{#if movimento.reduzido}<span class="vh">Movimento reduzido ativo</span>{/if}

<style>
	.passo {
		display: flex;
		flex-direction: column;
		gap: var(--e-5);
	}
	.titulo-marca {
		display: flex;
		flex-direction: column;
		gap: var(--e-1);
	}
	.marca-nome {
		font-size: var(--t-2xl);
		width: fit-content;
	}
	.titulo-marca .sub {
		font-family: var(--fonte-texto);
		font-size: var(--t-md);
		color: var(--texto-suave);
		font-weight: 700;
		letter-spacing: 0;
	}
	.chips {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: var(--e-2);
	}
	.nota {
		color: var(--texto-suave);
		font-size: var(--t-sm);
	}
	.rodape {
		margin-top: var(--e-2);
	}
	.livre {
		display: flex;
		flex-direction: column;
		gap: var(--e-2);
		padding-top: var(--e-4);
		border-top: 1px solid var(--linha);
	}
	.livre label {
		font-weight: 700;
	}
	.linha-livre {
		display: flex;
		gap: var(--e-2);
	}
	.linha-livre input {
		flex: 1;
		min-width: 0;
		min-height: var(--alvo);
		padding: 0 var(--e-4);
		border-radius: var(--raio-controlo);
		border: 2px solid var(--linha-forte);
		background: var(--superficie-1);
	}
	.linha-livre input:focus {
		outline: none;
		border-color: var(--foco);
	}
	.ajuda {
		display: inline-flex;
		align-items: center;
		gap: var(--e-2);
		align-self: flex-start;
		min-height: var(--alvo);
		padding: 0 var(--e-2);
		margin-top: calc(var(--e-3) * -1);
		border: 0;
		background: none;
		color: var(--primaria);
		font-weight: 700;
		text-decoration: underline;
		text-underline-offset: 0.18em;
	}
	.ajuda :global(svg) {
		width: 18px;
		height: 18px;
	}
	.modelos,
	.cartoes {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--e-2);
	}
	:global(.modelo-item),
	:global(.item-lista) {
		display: flex !important;
		align-items: center;
		gap: var(--e-3);
	}
	.modelo-id {
		flex: 1;
		font-weight: 700;
		overflow-wrap: anywhere;
	}
	.modelo-meta {
		font-size: var(--t-xs);
		color: var(--texto-suave);
	}
	:global(.modelo-item .seta),
	:global(.item-lista .seta) {
		flex: none;
		width: 20px;
		height: 20px;
		color: var(--texto-suave);
	}
	:global(.item-lista .ic) {
		flex: none;
		width: 24px;
		height: 24px;
		color: var(--primaria);
	}
	.item-txt {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--e-1);
	}
	.item-txt > span {
		font-size: var(--t-sm);
		color: var(--texto-suave);
	}
	.item-meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--e-2);
	}
	.familia {
		display: flex;
		align-items: center;
		gap: var(--e-2);
		padding: var(--e-3) var(--e-4);
		border-radius: var(--raio-controlo);
		background: var(--superficie-2);
	}
	.familia :global(svg) {
		flex: none;
		width: 20px;
		height: 20px;
		color: var(--primaria);
	}
	.acoes {
		display: flex;
		flex-direction: column;
		gap: var(--e-2);
	}
	:global(.resumo) {
		display: grid !important;
		grid-template-columns: auto 1fr;
		gap: var(--e-2) var(--e-3);
		align-items: center;
	}
	.resumo-icone {
		display: grid;
		place-items: center;
		width: 48px;
		height: 48px;
		border-radius: 14px;
		background: var(--superficie-2);
		color: var(--primaria);
	}
	.resumo-txt {
		display: flex;
		flex-direction: column;
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.resumo-txt span {
		font-size: var(--t-sm);
		color: var(--texto-suave);
	}
	.resumo-selo {
		grid-column: 1 / -1;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--e-3);
	}
	.sem-modelo {
		font-size: var(--t-sm);
		font-weight: 700;
		color: var(--texto-suave);
	}
</style>
