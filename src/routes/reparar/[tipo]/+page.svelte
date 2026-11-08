<script lang="ts">
	/**
	 * Fluxo: Aparelho → Problema (sintomas sempre visíveis) → Diagnóstico.
	 * Marca e modelo são uma refinação opcional: só acrescentam códigos de erro e guias específicos.
	 * Nunca há beco sem saída: sem marca, marca desconhecida ou modelo desconhecido, os sintomas e guias universais continuam lá.
	 */
	import { onMount, tick, untrack } from 'svelte';
	import { page } from '$app/state';
	import { goto, pushState, replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Fuse from 'fuse.js';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Stethoscope from '@lucide/svelte/icons/stethoscope';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import CircleQuestionMark from '@lucide/svelte/icons/circle-question-mark';
	import PencilLine from '@lucide/svelte/icons/pencil-line';
	import FileSearch from '@lucide/svelte/icons/file-search';
	import Layers from '@lucide/svelte/icons/layers';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import X from '@lucide/svelte/icons/x';
	import BarraTopo from '#lib/componentes/BarraTopo.svelte';
	import Migalhas, { type Migalha } from '#lib/componentes/Migalhas.svelte';
	import SeloModelo from '#lib/componentes/SeloModelo.svelte';
	import IconeEletrodomestico from '#lib/ilustracoes/IconeEletrodomestico.svelte';
	import { Button, Card, Chip, SearchBar, Skeleton, EmptyState, RiskBadge, Sheet } from '#lib/design/index.ts';
	import { marcasDoTipo, conteudoPara, familiasDoModelo, marcas, nomeMarca, codigosDoTipo } from '#lib/data/conteudo.ts';
	import { carregarModelos, pesquisarModelos, type ModeloEprel } from '#lib/data/modelos.ts';
	import { normalizarModelo, slugMarca } from '#lib/data/normalizar.ts';
	import {
		selecao,
		carregarSelecao,
		escolherTipo,
		escolherMarca,
		escolherModelo,
		limparMarca
	} from '#lib/estado/selecao.svelte.ts';
	import { registarRecente, carregarColecoes } from '#lib/estado/colecoes.svelte.ts';
	import { comTransicao, entrar, entrarEcra, cascata, suportaVT } from '#lib/motion/index.ts';

	let { data } = $props();
	const tipo = $derived(data.tipo);

	type Passo = 'problema' | 'marca' | 'modelo';
	const ORDEM: Passo[] = ['problema', 'marca', 'modelo'];
	const passo = $derived<Passo>(page.state.passo ?? 'problema');
	let montado = $state(false);

	onMount(async () => {
		carregarSelecao();
		carregarColecoes();
		if (selecao.tipo !== tipo.id) escolherTipo(tipo.id);
		montado = true;
		await tick();
		if (!page.state.passo) {
			try {
				replaceState('', { passo: 'problema' });
			} catch {
				/* router ainda não pronto: o passo por omissão já é "problema" */
			}
		}
	});

	async function irPara(p: Passo) {
		if (p === passo) return;
		document.documentElement.dataset.direcao = ORDEM.indexOf(p) > ORDEM.indexOf(passo) ? 'avancar' : 'recuar';
		await comTransicao(() => pushState('', { passo: p }));
	}

	const animarPasso = (node: Element) => (suportaVT() || !montado ? { duration: 0 } : entrarEcra(node, { x: 0, y: 16 }));

	// ---------- Conteúdo (universal + específico da marca/modelo, se indicados) ----------
	const marcaId = $derived(montado && selecao.tipo === tipo.id ? (selecao.marca?.id ?? null) : null);
	const modeloNorm = $derived(montado && selecao.marca ? (selecao.modelo?.normalizado ?? null) : null);
	const encontrado = $derived(conteudoPara(tipo.id, marcaId, modeloNorm));

	let consultaCodigo = $state('');
	// Com marca: todos os códigos da marca, separados entre confirmados para o modelo indicado e os outros
	// (documentados noutros modelos — mostram-se com aviso). Sem marca: pesquisa em todas as marcas.
	const codigosEncontrados = $derived.by(() => {
		if (marcaId) {
			const q = normalizarModelo(consultaCodigo);
			const lista = encontrado.codigos;
			return q ? lista.filter(({ item: c }) => [c.code, ...(c.aliases ?? [])].some((x) => normalizarModelo(x).startsWith(q))) : lista;
		}
		return consultaCodigo.trim() ? codigosDoTipo(tipo.id, consultaCodigo).map((item) => ({ item, confirmado: false })) : [];
	});
	const codigosMostrados = $derived(codigosEncontrados.map((c) => c.item));
	const codigosConfirmados = $derived(codigosEncontrados.filter((c) => c.confirmado).map((c) => c.item));
	// Sem marca não há grupos: é uma pesquisa em todas as marcas.
	const codigosOutros = $derived(
		codigosEncontrados.filter((c) => !c.confirmado && (!marcaId || c.item.ambito === 'modelos')).map((c) => c.item)
	);
	const codigosSemModelos = $derived(marcaId ? codigosEncontrados.filter((c) => c.item.ambito === 'sem-modelos').map((c) => c.item) : []);
	// Códigos que a fonte diz valerem para todos os modelos da marca (sem modelo indicado ainda não estão confirmados para «o teu»).
	const codigosTodaMarca = $derived(marcaId ? codigosEncontrados.filter((c) => !c.confirmado && c.item.ambito === 'marca').map((c) => c.item) : []);

	$effect(() => {
		if (montado && passo === 'problema' && selecao.marca) {
			const r = { tipo: tipo.id, marca: $state.snapshot(selecao.marca), modelo: $state.snapshot(selecao.modelo) ?? null };
			untrack(() => registarRecente(r));
		}
	});

	// ---------- Marca (opcional) ----------
	const listaMarcas = $derived(marcasDoTipo(tipo.id));
	const fuseMarcas = $derived(new Fuse(listaMarcas, { keys: ['nome'], threshold: 0.35, ignoreLocation: true }));
	let filtroMarca = $state('');
	const marcasFiltradas = $derived(filtroMarca.trim() ? fuseMarcas.search(filtroMarca.trim()).map((r) => r.item) : listaMarcas);

	function escolher(m: { id: string; nome: string }) {
		escolherMarca({ id: m.id, nome: m.nome });
		irPara('modelo');
	}

	function usarMarcaLivre() {
		const nome = filtroMarca.trim().replace(/\s+/g, ' ');
		const id = slugMarca(nome);
		if (!id) return;
		escolher({ id, nome: marcas.get(id)?.nome ?? nome });
	}

	function removerMarca() {
		limparMarca();
		consultaCodigo = '';
	}

	// ---------- Modelo (opcional) ----------
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

	// ---------- Migalhas ----------
	const migalhas = $derived.by<Migalha[]>(() => {
		const itens: Migalha[] = [
			{ id: 'tipo', rotulo: 'Eletrodoméstico', valor: tipo.nome_curto ?? tipo.nome, ir: () => goto(resolve('/reparar')) },
			{ id: 'problema', rotulo: 'Problema', valor: 'Escolher', ir: () => irPara('problema'), atual: passo === 'problema' }
		];
		if (passo !== 'problema' || selecao.marca) {
			itens.push({ id: 'marca', rotulo: 'Marca (opcional)', valor: selecao.marca?.nome ?? 'Indicar', ir: () => irPara('marca'), atual: passo === 'marca' });
		}
		if (passo === 'modelo' || selecao.modelo) {
			itens.push({ id: 'modelo', rotulo: 'Modelo (opcional)', valor: selecao.modelo?.texto ?? 'Indicar', ir: () => irPara('modelo'), atual: passo === 'modelo' });
		}
		return itens;
	});
</script>

<svelte:head>
	<title>{tipo.nome} · Arranja</title>
</svelte:head>

<BarraTopo titulo={tipo.nome} voltar={resolve('/reparar')} vt="tipo-{tipo.id}">
	{#snippet icone()}<IconeEletrodomestico icone={tipo.icone} tamanho={28} />{/snippet}
</BarraTopo>
<Migalhas itens={migalhas} />

{#key passo}
	<section class="passo" in:animarPasso>
		{#if passo === 'problema'}
			<!-- Refinação opcional -->
			{#if selecao.marca}
				<div class="refinado" in:entrar>
					<div class="refinado-txt">
						<span class="rot">A tua máquina</span>
						<strong>{selecao.marca.nome}{selecao.modelo ? ` ${selecao.modelo.texto}` : ''}</strong>
						{#if selecao.modelo}<SeloModelo modelo={selecao.modelo} />{/if}
					</div>
					<div class="refinado-acoes">
						<Button variante="fantasma" onclick={() => irPara('marca')}>Alterar</Button>
						<Button variante="fantasma" rotulo="Remover marca e modelo" onclick={removerMarca}>
							{#snippet icone()}<X aria-hidden="true" />{/snippet}
						</Button>
					</div>
				</div>
			{:else}
				<Card onclick={() => irPara('marca')} classe="refinar">
					<SlidersHorizontal aria-hidden="true" class="ic" />
					<span class="item-txt">
						<strong>Refinar com marca e modelo (opcional)</strong>
						<span>Acrescenta códigos de erro e guias específicos da tua máquina.</span>
					</span>
					<ChevronRight aria-hidden="true" class="seta" />
				</Card>
			{/if}

			<h2>Qual é o problema?</h2>

			{#if encontrado.arvores.length}
				<ul class="cartoes" aria-label="Sintomas">
					{#each encontrado.arvores as { item, c }, i (item.id)}
						<li in:entrar={{ delay: cascata(i) }}>
							<Card href={resolve('/diagnostico/[id]', { id: item.id })} classe="item-lista">
								<Stethoscope aria-hidden="true" class="ic" />
								<span class="item-txt">
									<strong>{item.sintoma}</strong>
									{#if c.nivel === 'familia' && c.familia}<span>{c.familia.nome}</span>{:else if c.nivel !== 'todas'}<span>Específico de {nomeMarca(selecao.marca?.id ?? '')}</span>{/if}
								</span>
								<ChevronRight aria-hidden="true" class="seta" />
							</Card>
						</li>
					{/each}
				</ul>
			{:else}
				<EmptyState
					titulo="Ainda não temos diagnósticos verificados para este eletrodoméstico"
					texto="Todo o conteúdo precisa de fonte oficial verificada. Estamos a acrescentar sintomas aparelho a aparelho."
				>
					{#snippet icone()}<FileSearch />{/snippet}
					<Button variante="destaque" href={resolve('/contribuir')}>Contribuir</Button>
					<Button variante="secundaria" href={resolve('/seguranca')}>Regras de segurança</Button>
				</EmptyState>
			{/if}

			<!-- Código de erro no visor -->
			<section class="pilha" aria-labelledby="codigos-t">
				<h3 id="codigos-t" class="secao-titulo">Aparece um código de erro no visor?</h3>
				<SearchBar bind:value={consultaCodigo} rotulo="Código de erro" placeholder="Ex.: E18" maiusculas />
				{#if codigosMostrados.length}
					{#if codigosConfirmados.length}
						<p class="grupo-codigos confirmado"><CircleCheck aria-hidden="true" /> Confirmados para o teu modelo</p>
						<ul class="chips">
							{#each codigosConfirmados.slice(0, 60) as c, i (c.id)}
								<li in:entrar={{ delay: cascata(i, 10) }}>
									<Chip href={resolve('/erro/[id]', { id: c.id })}>
										{#snippet icone()}<CircleAlert aria-hidden="true" />{/snippet}
										{c.code}
									</Chip>
								</li>
							{/each}
						</ul>
					{/if}
					{#if codigosOutros.length}
						{#if marcaId}
							<p class="grupo-codigos">
								{#if modeloNorm}
									{codigosConfirmados.length ? 'Outros códigos' : 'Códigos'} {selecao.marca?.nome} confirmados noutros modelos — no teu pode ser diferente;
									confirma no manual.
								{:else}
									Códigos {selecao.marca?.nome} confirmados só em alguns modelos. Indica o modelo para saberes se estão confirmados para o teu.
								{/if}
							</p>
						{/if}
						<ul class="chips">
							{#each codigosOutros.slice(0, 60) as c, i (c.id)}
								<li in:entrar={{ delay: cascata(i, 10) }}>
									<Chip href={resolve('/erro/[id]', { id: c.id })}>
										{#snippet icone()}<CircleAlert aria-hidden="true" />{/snippet}
										{c.code}{marcaId ? '' : ` · ${nomeMarca(c.brand)}`}
									</Chip>
								</li>
							{/each}
						</ul>
					{/if}
					{#if codigosTodaMarca.length}
						<p class="grupo-codigos">Códigos que a {selecao.marca?.nome} indica para todos os seus modelos.</p>
						<ul class="chips">
							{#each codigosTodaMarca.slice(0, 60) as c, i (c.id)}
								<li in:entrar={{ delay: cascata(i, 10) }}>
									<Chip href={resolve('/erro/[id]', { id: c.id })}>
										{#snippet icone()}<CircleAlert aria-hidden="true" />{/snippet}
										{c.code}
									</Chip>
								</li>
							{/each}
						</ul>
					{/if}
					{#if codigosSemModelos.length}
						<p class="grupo-codigos">
							Códigos {selecao.marca?.nome} indicados em páginas gerais ou manuais sem modelos — no teu pode ser diferente; confirma no manual do teu
							modelo.
						</p>
						<ul class="chips">
							{#each codigosSemModelos.slice(0, 60) as c, i (c.id)}
								<li in:entrar={{ delay: cascata(i, 10) }}>
									<Chip href={resolve('/erro/[id]', { id: c.id })}>
										{#snippet icone()}<CircleAlert aria-hidden="true" />{/snippet}
										{c.code}
									</Chip>
								</li>
							{/each}
						</ul>
					{/if}
				{:else if consultaCodigo.trim()}
					<p class="nota">
						Não encontrámos este código{selecao.marca ? ` para ${selecao.marca.nome}` : ''}. Escolhe o sintoma acima — funciona com qualquer
						marca.
					</p>
				{:else if marcaId}
					<p class="nota">Ainda não temos códigos de erro verificados para {selecao.marca?.nome}. Escolhe o sintoma acima.</p>
				{:else}
					<p class="nota">Escreve o código tal como aparece. Para resultados exatos, indica a marca.</p>
				{/if}
			</section>

			{#if encontrado.guias.length}
				<section class="pilha" aria-labelledby="guias-t">
					<h3 id="guias-t" class="secao-titulo">Guias</h3>
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
		{:else if passo === 'marca'}
			<h2>Qual é a marca? <span class="opcional">(opcional)</span></h2>
			<p class="nota">A marca só acrescenta códigos de erro e guias específicos. Os sintomas funcionam sem ela.</p>

			<SearchBar bind:value={filtroMarca} rotulo="Procurar marca" placeholder="Escreve a marca (ex.: Becken)" inputmode="text" onsubmit={usarMarcaLivre} />

			{#if marcasFiltradas.length}
				<ul class="chips">
					{#each marcasFiltradas.slice(0, 120) as m, i (m.id)}
						<li in:entrar={{ delay: cascata(i, 16) }}>
							<Chip onclick={() => escolher(m)} selecionado={selecao.marca?.id === m.id} vt="marca-{m.id}">
								{m.nome}{m.example ? ' (exemplo)' : ''}
							</Chip>
						</li>
					{/each}
				</ul>
			{/if}

			<div class="acoes">
				{#if filtroMarca.trim() && !marcasFiltradas.some((m) => m.nome.toLowerCase() === filtroMarca.trim().toLowerCase())}
					<Button variante="secundaria" largo onclick={usarMarcaLivre}>
						{#snippet icone()}<PencilLine aria-hidden="true" />{/snippet}
						Usar «{filtroMarca.trim()}»
					</Button>
				{/if}
				<Button variante="fantasma" largo onclick={() => irPara('problema')}>Continuar sem marca</Button>
			</div>
		{:else if passo === 'modelo' && selecao.marca}
			<h2 class="titulo-marca">
				<span class="marca-nome" style:view-transition-name="marca-{selecao.marca.id}">{selecao.marca.nome}</span>
				<span class="sub">Qual é o modelo? <span class="opcional">(opcional)</span></span>
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
					<p class="nota">Não encontrámos este modelo na lista oficial (EPREL). Podes usá-lo na mesma — os sintomas e guias universais continuam disponíveis.</p>
				{/if}
			{:else}
				<p class="nota">
					Não temos a lista oficial de modelos desta marca. Escreve o modelo tal como aparece na etiqueta, ou continua sem ele — os sintomas e
					guias universais funcionam com qualquer modelo.
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
				<Button variante="fantasma" largo onclick={semModelo}>Continuar sem modelo</Button>
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
		{:else}
			<div aria-hidden="true"><Skeleton altura="48px" linhas={3} /></div>
		{/if}
	</section>
{/key}

<style>
	.passo {
		display: flex;
		flex-direction: column;
		gap: var(--e-5);
	}
	.opcional {
		font-family: var(--fonte-texto);
		font-size: var(--t-md);
		font-weight: 700;
		color: var(--texto-suave);
		letter-spacing: 0;
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
	.grupo-codigos {
		display: flex;
		align-items: flex-start;
		gap: var(--e-2);
		color: var(--texto-suave);
		font-size: var(--t-sm);
	}
	.grupo-codigos.confirmado {
		color: var(--texto);
		font-weight: 700;
	}
	.grupo-codigos :global(svg) {
		flex: none;
		width: 18px;
		height: 18px;
		color: var(--primaria);
	}
	.nota {
		color: var(--texto-suave);
		font-size: var(--t-sm);
	}
	.rodape {
		margin-top: var(--e-2);
	}
	.refinado {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--e-3);
		padding: var(--e-3) var(--e-4);
		border-radius: var(--raio-cartao);
		background: var(--superficie-2);
	}
	.refinado-txt {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--e-1);
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.refinado-txt .rot {
		font-size: var(--t-xs);
		font-weight: 700;
		color: var(--texto-suave);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.refinado-acoes {
		display: flex;
		flex: none;
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
	:global(.item-lista),
	:global(.refinar) {
		display: flex !important;
		align-items: center;
		gap: var(--e-3);
	}
	:global(.refinar) {
		border-style: dashed !important;
		background: transparent !important;
		box-shadow: none !important;
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
	:global(.item-lista .seta),
	:global(.refinar .seta) {
		flex: none;
		width: 20px;
		height: 20px;
		color: var(--texto-suave);
	}
	:global(.item-lista .ic),
	:global(.refinar .ic) {
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
</style>
