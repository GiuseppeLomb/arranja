/** Tipos do conteúdo compilado (src/lib/generated/conteudo.json). Espelham /schemas. */

export type RiskLevel = 'baixo' | 'medio' | 'alto' | 'proibido';

export interface Fonte {
	url: string;
	titulo?: string;
	/** Página(s) do documento onde está a informação. */
	pagina?: string;
	consultado_em: string;
	/** Cópia do manual oficial alojada por um retalhista: autenticidade e onde está alojada. */
	documento_oficial?: DocumentoOficial;
}

export interface DocumentoOficial {
	fabricante: string;
	referencia_documento: string;
	modelos: string[];
	url_alojamento: string;
	alojado_por: string;
}

export interface AplicavelA {
	brand: string;
	familias?: string[];
	prefixos?: string[];
	regex?: string[];
	modelos?: string[];
}

export interface TipoEletrodomestico {
	id: string;
	nome: string;
	nome_curto?: string;
	icone: string;
	usa_agua: boolean;
	eprel_grupos: { grupo: string; regulamento: string }[];
}

export interface Familia {
	id: string;
	brand: string;
	appliance_type: string;
	nome: string;
	notas?: string;
	prefixos?: string[];
	regex?: string[];
	modelos?: string[];
	sources: Fonte[];
	example?: boolean;
}

export interface Ferramenta {
	id: string;
	nome: string;
	descricao: string;
	cuidado?: string;
}

export interface Imagem {
	src: string;
	alt: string;
	licenca: string;
	autor: string;
	fonte_url?: string;
}

export interface Passo {
	texto: string;
	aviso?: string;
	imagem?: Imagem;
}

export interface Peca {
	nome: string;
	codigo_oficial?: string;
	link_oficial?: string;
}

export interface Guia {
	id: string;
	titulo: string;
	resumo?: string;
	appliance_type: string;
	aplicavel_a: AplicavelA[];
	risk_level: RiskLevel;
	perigos?: string[];
	explicacao_perigo?: string;
	avisos?: string[];
	ferramentas: string[];
	tempo_estimado: number;
	passos: Passo[];
	pecas: Peca[];
	sources: Fonte[];
	license: string;
	attribution?: { texto: string; url: string; licenca_original?: string };
	example?: boolean;
}

export type No =
	| { tipo: 'pergunta'; texto: string; ajuda?: string; respostas: { texto: string; ir_para: string }[] }
	| { tipo: 'guia'; guias: string[]; nota?: string }
	| { tipo: 'tecnico'; motivo: string }
	| { tipo: 'dados_insuficientes'; nota?: string };

export interface Arvore {
	id: string;
	titulo: string;
	sintoma: string;
	ordem?: number;
	appliance_type: string;
	aplicavel_a: AplicavelA[];
	codigos?: string[];
	inicio: string;
	nos: Record<string, No>;
	sources: Fonte[];
	example?: boolean;
}

export interface CodigoErro {
	id: string;
	brand: string;
	appliance_type: string;
	code: string;
	aliases?: string[];
	descricao: string;
	aplicavel_a?: AplicavelA[];
	arvore?: string;
	guias?: string[];
	sources: Fonte[];
	example?: boolean;
}

export interface Marca {
	id: string;
	nome: string;
	/** Da lista curada (data/brands.yaml). */
	curada?: boolean;
	grupo?: string;
	distribuidor?: string;
	pagina_pecas?: string;
	/** Nº de modelos EPREL por tipo de eletrodoméstico. */
	eprel: Record<string, number>;
	/** Tipos onde há conteúdo próprio para esta marca. */
	conteudo: string[];
	example?: boolean;
}

export interface GrupoEprel {
	grupo: string;
	appliance_type: string;
	total: number;
	obtido_em: string;
}

export interface Conteudo {
	gerado_em: string;
	exemplos: boolean;
	tipos: TipoEletrodomestico[];
	ferramentas: Ferramenta[];
	familias: Familia[];
	guias: Guia[];
	arvores: Arvore[];
	codigos: CodigoErro[];
	marcas: Marca[];
	eprel: { grupos: GrupoEprel[] };
}

/** Shard de modelos EPREL: static/data/modelos/{tipo}/{marca}.json */
export interface ShardModelos {
	/** Grupos EPREL referidos por índice em `m`. */
	g: string[];
	/** [identificador do modelo, nº de registo EPREL, índice do grupo] */
	m: [string, string, number][];
}
