# Arranja

**Antes de deitar fora, arranja.**

Guias de reparação DIY de eletrodomésticos vendidos em Portugal, em português de Portugal.
Projeto aberto e sem fins lucrativos: sem contas, sem backend, sem cookies, sem analytics e sem IA no diagnóstico.

🔗 **App:** <https://giuseppelomb.github.io/arranja/>

## Objetivo

Ajudar quem tem um eletrodoméstico avariado a perceber se consegue resolver o problema em segurança antes
de chamar um técnico ou de o deitar fora. O fluxo é simples:

1. **Eletrodoméstico → Marca → Modelo → Problema** (sintoma ou código de erro).
2. **Diagnóstico** por árvore de decisão determinística, uma pergunta de cada vez.
3. **Checklist** de ferramentas, peças e avisos de risco.
4. **Guia passo a passo** com Modo Oficina (ecrã sempre ligado, letra maior, botões gigantes).

### Regras do projeto

- **Nada inventado.** Todo o conteúdo de reparação tem `sources` (URL + data de consulta). Sem dados
  verificados, a app diz «Ainda não temos dados verificados para este modelo».
- **Segurança.** Cada guia tem `risk_level` (`baixo`, `medio`, `alto`, `proibido`). Gás (combustível e
  refrigerante), interior de micro-ondas e ligações a 400 V são sempre `proibido`: só se explica o perigo.
  Todos os guias começam com o passo fixo «Desliga da corrente (e da água, se aplicável)».
- **Privacidade.** Zero pedidos a terceiros a partir do browser (imposto por Content-Security-Policy).
  Favoritos e recentes ficam só em `localStorage`.

## Licenças

| O quê | Licença |
|---|---|
| Código | [MIT](LICENSE) |
| Conteúdo próprio (`/data`, exceto `/data/eprel`; ilustrações) | [CC BY-NC-SA 4.0](LICENSE-CONTENT) |
| Dados de modelos em `/data/eprel` | [Termos da API EPREL](data/eprel/README.md) — Comissão Europeia |
| Conteúdo derivado do iFixit | CC BY-NC-SA, com atribuição e link para a página original |
| Tipos de letra | SIL Open Font License 1.1 (alojados localmente) |
| Ícones de interface | Lucide (ISC) |

Manuais e PDFs de fabricantes nunca são alojados (só links). Não são usados logótipos de marcas.
O Arranja não é afiliado, patrocinado nem aprovado pela Comissão Europeia nem por qualquer fabricante.

## Correr localmente

Requisitos: Node.js 22+ (recomendado 24).

```bash
npm ci
npm run dev          # http://localhost:5173 — inclui o conteúdo de exemplo
```

| Comando | O que faz |
|---|---|
| `npm run dev` | Compila `/data` com exemplos e arranca o servidor de desenvolvimento |
| `npm run build` | Build de produção (sem exemplos) para `build/` |
| `npm run build:demo` | Build de produção **com** exemplos, para testar todos os ecrãs |
| `npm run preview` | Serve o último build |
| `npm run validate` | Valida `/data` (JSON Schema + regras), snapshots EPREL e contraste WCAG AA |
| `npm run check` | `svelte-check` (TypeScript), avisos tratados como erros |
| `npm run import:eprel` | Importa modelos do EPREL (precisa de `EPREL_API_KEY`) |
| `npm run icons` | Gera os PNG do manifest e o `favicon.ico` a partir de `static/icone.svg` |

> Os scripts chamam `node` diretamente (em vez dos atalhos de `node_modules/.bin`) para funcionarem em
> caminhos com caracteres especiais no Windows, como `&`.

### Conteúdo de exemplo

Há um guia, uma árvore, dois códigos de erro e uma família marcados `example: true`, com uma marca fictícia
(«Marca Exemplo»). Servem só para testar os ecrãs: aparecem em `npm run dev`/`build:demo` e **nunca** no
build de produção.

## Estrutura

```
data/            conteúdo em YAML (+ data/eprel/*.json gerados)
schemas/         JSON Schema de cada tipo de dado
scripts/         build-data, validate, contraste, import-eprel
src/lib/design   tokens CSS e componentes (Button, Card, Chip, SearchBar, StepCard, RiskBadge,
                 ProgressBar, Sheet, Toast, EmptyState, Skeleton)
src/lib/motion   durações, easing, springs, transições, gestos e View Transitions
src/routes       ecrãs (SvelteKit, tudo pré-renderizado)
static/          ícones, imagens dos guias
```

Stack: SvelteKit 3 + Svelte 5 + TypeScript 6, adapter-static, Motion, `@vite-pwa/sveltekit` (Workbox),
Fuse.js, canvas-confetti, Lucide, Fontsource. Dados em YAML compilados para JSON e validados com ajv.

## EPREL

Os modelos vêm do [EPREL](https://eprel.ec.europa.eu) (Comissão Europeia). A listagem por grupo exige uma
chave da API pública:

1. Pede a chave em <https://eprel.ec.europa.eu/screen/requestpublicapikey>.
2. Guarda-a como secret `EPREL_API_KEY` em *Settings → Secrets and variables → Actions*.
3. Ativa *Settings → Actions → General → Allow GitHub Actions to create and approve pull requests*.

O workflow `eprel.yml` corre todos os meses, substitui os snapshots em `data/eprel/` e abre um PR.
Sem chave, a app funciona na mesma: o modelo é escrito à mão e comparado com as famílias de modelos.

## Contribuir

Lê o [CONTRIBUTING.md](CONTRIBUTING.md). Podes propor guias e correções sem programar, através dos
formulários de [issue](https://github.com/GiuseppeLomb/arranja/issues/new/choose).

## Publicação

Cada push para `main` publica no GitHub Pages através do workflow `deploy.yml` (com `BASE_PATH=/arranja`).
O CI (`ci.yml`) corre `validate`, `check` e `build` em cada PR.
