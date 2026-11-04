# data/eprel — modelos do EPREL

Snapshots gerados por `scripts/import-eprel.ts` (um ficheiro por grupo de produto EPREL).
**Não editar à mão.** São atualizados mensalmente pelo workflow `.github/workflows/eprel.yml`,
que abre um pull request — nunca há commit direto na `main`.

## Origem e termos

- Fonte: **EPREL — European Product Registry for Energy Labelling**, Comissão Europeia
  (<https://eprel.ec.europa.eu>), através da API pública.
- Os dados pertencem aos serviços da Comissão Europeia responsáveis pelo EPREL e são
  fornecidos pelos fabricantes, que são responsáveis pela sua exatidão.
- Reutilizados ao abrigo dos
  [termos e condições da API EPREL](https://ec.europa.eu/assets/move-ener/eprel/EPREL%20Public/Public%20API%20Term%20and%20Conditions/API_TERMS_AND_CONDITIONS_EN.pdf).
- **Não estão sob a CC BY-NC-SA 4.0** do restante conteúdo: os termos da API proíbem acrescentar
  restrições ao que o EPREL permite.
- O Arranja **não é afiliado, patrocinado nem aprovado** pela Comissão Europeia.

## O que é guardado

Só o necessário para identificar o modelo: marca (`supplierOrTrademark`), identificador
(`modelIdentifier`), grupo, n.º de registo EPREL, `eprel_url` e datas de colocação no mercado.

Cada importação **substitui o snapshot inteiro** do grupo, para que correções e remoções feitas no
EPREL se reflitam aqui (art. 4.º §2 f dos termos).

## Grupos importados

Definidos em `data/tipos.yaml` (`eprel_grupos`), com o regulamento atual e o anterior de cada tipo:

| Tipo | Grupos |
|---|---|
| Máquina de lavar roupa | `washingmachines2019`, `washingmachines` |
| Máquina de lavar loiça | `dishwashers2019`, `dishwashers` |
| Máquina de secar roupa | `tumbledryers20232534`, `tumbledriers` |
| Máquina de lavar e secar | `washerdriers2019`, `washerdriers` |
| Frigorífico | `refrigeratingappliances2019`, `refrigeratingappliances` |
