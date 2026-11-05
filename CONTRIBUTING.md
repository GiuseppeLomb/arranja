# Contribuir para o Arranja

Obrigado! O Arranja só é útil se for **fiável**. Por isso, as regras de verificação são estritas.

## Formas de contribuir

- **Sem programar:** abre uma issue com o formulário [Novo guia](https://github.com/GiuseppeLomb/arranja/issues/new?template=novo-guia.yml)
  ou [Correção](https://github.com/GiuseppeLomb/arranja/issues/new?template=correcao.yml).
- **Com Git:** edita os ficheiros YAML em `/data` e abre um pull request.

## Regras de verificação

1. **Fontes obrigatórias.** Cada guia, árvore, código de erro e família de modelos tem `sources`, com `url`
   (https) e `consultado_em` (AAAA-MM-DD). Fontes aceitáveis: manuais e catálogos oficiais dos fabricantes,
   páginas oficiais de peças, manuais de serviço publicados pelo fabricante, guias do iFixit.
   Fóruns e vídeos só como complemento, nunca como fonte única de um passo técnico.
2. **Nada inventado.** Não se escrevem passos, peças, códigos de erro ou códigos de peça sem fonte.
   Na dúvida, usa `dados_insuficientes` numa árvore em vez de adivinhar.
3. **Palavras tuas, em PT-PT.** Reescreve; nunca copies texto de manuais ou de outros sites.
4. **Fotos próprias ou com licença compatível** (CC0, CC BY, CC BY-SA, CC BY-NC, CC BY-NC-SA), sempre com
   `autor` e `licenca`. Guardadas em `static/imagens/…`.
5. **Sem alojar manuais/PDFs de fabricantes** — só links para as páginas oficiais.
6. **Sem logótipos de marcas** (só o nome em texto) e **sem links de afiliados**.
7. **iFixit:** conteúdo derivado leva `attribution` com o link para a página original (o `validate` exige-o).
8. **Só domínios permitidos.** Todas as URLs (fontes, links de peças, atribuições) têm de pertencer a um domínio de `data/fontes-permitidas.yaml`: sites e repositórios oficiais dos fabricantes, retalhistas para as suas marcas próprias, e iFixit. Blogs, fóruns, sites de SEO, sites genéricos de manuais e conteúdo gerado por IA não são fontes. Para acrescentar um domínio, mostra no PR que é oficial.
   - **Manual oficial alojado por um retalhista** (categoria `alojamento-documento-oficial`, ex.: auchan.pt): só é aceite se o PDF for a cópia do manual do fabricante, com o nome/copyright do fabricante, a referência do documento impressa (ex.: LG «MFL68881095») e os modelos exatos. A fonte leva obrigatoriamente `documento_oficial` com `fabricante`, `referencia_documento`, `modelos`, `url_alojamento` e `alojado_por`; o `validate` rejeita-a sem isso. Não guardes o PDF no repositório e não contornes bloqueios das lojas.
9. **Revisão antes do merge.** Todo o conteúdo é revisto por outra pessoa. O CI corre `npm run validate`.

## Segurança

- `risk_level`: `baixo`, `medio`, `alto` ou `proibido`.
- **Proibidos por defeito** (o `validate` rejeita outra classificação): `gas-combustivel`,
  `gas-refrigerante`, `micro-ondas-interior`, `ligacao-400v` em `perigos`.
- Guias `proibido` não têm passos nem ferramentas: só `explicacao_perigo` e a recomendação de técnico.
- **Não escrevas o passo «Desliga da corrente»**: a app acrescenta sempre, como passo 1 fixo,
  «Desliga da corrente (e da água, se aplicável)».

## Formato dos dados

Os esquemas estão em `/schemas`. Um ficheiro por guia (`data/guias/<id>.yaml`) e por árvore
(`data/arvores/<id>.yaml`), com o `id` igual ao nome do ficheiro. Códigos de erro e famílias são listas por
marca (`data/codigos/<marca>.yaml`, `data/familias/<marca>.yaml`). Marcas novas entram em `data/brands.yaml`.

### Ligação a marcas, famílias e modelos (`aplicavel_a`)

Guias, árvores e códigos ligam-se a **marca + família de modelos** por padrões. O modelo escrito pelo
utilizador é normalizado — maiúsculas, sem espaços, hífens, pontos ou barras (`wan 28-201/ES` → `WAN28201ES`) —
e comparado com:

```yaml
aplicavel_a:
  - brand: marca-x            # id da marca; "*" = todas (sem padrões)
    familias: [marca-x-abc]   # famílias em data/familias
    prefixos: [ABC12]         # modelos normalizados que começam por…
    regex: ['^ABC12\d{3}$']   # expressão regular sobre o identificador normalizado
    modelos: [ABC12345XY]     # modelos exatos
```

Sem `familias`/`prefixos`/`regex`/`modelos`, a regra aplica-se a todos os modelos da marca. Se o utilizador
disser que não sabe o modelo, só aparece o conteúdo sem restrições.

### Mapear uma família de modelos

```yaml
# data/familias/marca-x.yaml
- id: marca-x-abc
  brand: marca-x
  appliance_type: maquina-lavar-roupa
  nome: Marca X Série ABC
  prefixos: [ABC]
  sources:
    - url: https://…           # catálogo de peças / manual de serviço que mostre a família
      titulo: Catálogo oficial da série ABC
      consultado_em: 2026-11-04
```

Usa o padrão mais estreito possível e indica, no PR, exemplos de modelos que pertencem e que não pertencem.

### Exemplo mínimo de guia

```yaml
id: marca-x-limpar-filtro           # igual ao nome do ficheiro
titulo: Limpar o filtro da bomba de escoamento
appliance_type: maquina-lavar-roupa
aplicavel_a:
  - brand: marca-x
    familias: [marca-x-abc]
risk_level: baixo
perigos: [agua]
ferramentas: [balde, toalhas]       # ids de data/ferramentas.yaml
tempo_estimado: 20                  # minutos
passos:
  - texto: …                        # por palavras tuas, com fonte
    imagem:                         # opcional
      src: imagens/guias/marca-x-limpar-filtro/passo-2.webp
      alt: …
      licenca: CC-BY-NC-SA-4.0
      autor: …
pecas:
  - nome: …
    codigo_oficial: …               # opcional
    link_oficial: https://…         # página oficial de peças, sem afiliados
sources:
  - url: https://…
    consultado_em: 2026-11-04
license: CC-BY-NC-SA-4.0
```

### Árvores de diagnóstico

Nós `pergunta` (com 2 a 6 `respostas`, cada uma com `ir_para`) e finais `guia`, `tecnico` ou
`dados_insuficientes`. O `validate` rejeita ciclos, nós inalcançáveis e referências inexistentes.

## Fluxo técnico

```bash
npm ci
npm run dev        # testa no browser
npm run validate   # tem de passar
npm run check      # tem de passar
```

As marcas estão em `data/brands.yaml` (lista curada). O grupo ou o distribuidor de uma marca só entram com fonte oficial.

Ao contribuir, aceitas que o código seja publicado sob MIT e o conteúdo sob CC BY-NC-SA 4.0.
Os dados em `data/eprel/` são gerados automaticamente — não os edites à mão.
