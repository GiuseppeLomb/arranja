/** Avisos gerais de segurança associados a cada tipo de perigo declarado num guia. */
export const TEXTO_PERIGO: Record<string, string> = {
	eletricidade: 'Risco elétrico: trabalha sempre com a ficha fora da tomada. Desligar só no botão não chega.',
	agua: 'Água: fecha a torneira de alimentação e tem um recipiente e panos por perto.',
	peso: 'Peso: não movas o aparelho sozinho. Pede ajuda e protege as costas.',
	'arestas-cortantes': 'Arestas cortantes: usa luvas ao mexer em chapa e peças metálicas.',
	temperatura: 'Temperatura: espera que o aparelho e a água arrefeçam antes de começar.',
	'gas-combustivel': 'Gás combustível: qualquer intervenção é só para técnico credenciado.',
	'gas-refrigerante': 'Gás refrigerante: o circuito é selado; abri-lo exige técnico certificado.',
	'micro-ondas-interior': 'Interior de micro-ondas: tem componentes de alta tensão que guardam carga mesmo desligados.',
	'ligacao-400v': 'Ligação trifásica (400 V): só um eletricista pode intervir.'
};

/** Primeiro passo de todos os guias — fixo, acrescentado pela app, não editável. */
export const PASSO_SEGURANCA = 'Desliga da corrente (e da água, se aplicável)';
