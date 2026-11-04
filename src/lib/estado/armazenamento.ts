/**
 * Acesso seguro a localStorage/sessionStorage.
 * Tudo em try/catch: a app funciona sem armazenamento (modo privado, bloqueado, etc.).
 */
type Tipo = 'local' | 'sessao';

function area(tipo: Tipo): Storage | null {
	try {
		if (typeof window === 'undefined') return null;
		return tipo === 'local' ? window.localStorage : window.sessionStorage;
	} catch {
		return null;
	}
}

export const PREFIXO = 'arranja:';

export function ler<T>(chave: string, padrao: T, tipo: Tipo = 'local'): T {
	try {
		const v = area(tipo)?.getItem(PREFIXO + chave);
		return v == null ? padrao : (JSON.parse(v) as T);
	} catch {
		return padrao;
	}
}

export function gravar(chave: string, valor: unknown, tipo: Tipo = 'local'): void {
	try {
		area(tipo)?.setItem(PREFIXO + chave, JSON.stringify(valor));
	} catch {
		/* sem armazenamento: ignora */
	}
}

export function lerTexto(chave: string, tipo: Tipo = 'local'): string | null {
	try {
		return area(tipo)?.getItem(PREFIXO + chave) ?? null;
	} catch {
		return null;
	}
}

export function gravarTexto(chave: string, valor: string | null, tipo: Tipo = 'local'): void {
	try {
		const a = area(tipo);
		if (valor == null) a?.removeItem(PREFIXO + chave);
		else a?.setItem(PREFIXO + chave, valor);
	} catch {
		/* ignora */
	}
}

/** Chaves usadas pela app (listadas na página de Privacidade). */
export const CHAVES = {
	tema: 'tema',
	favoritos: 'favoritos',
	recentes: 'recentes',
	oficina: 'oficina',
	vistaInicio: 'vista-inicio'
} as const;

/** Apaga todos os dados locais do Arranja. Devolve quantos foram apagados. */
export function apagarTudo(): number {
	let n = 0;
	for (const tipo of ['local', 'sessao'] as Tipo[]) {
		try {
			const a = area(tipo);
			if (!a) continue;
			const chaves: string[] = [];
			for (let i = 0; i < a.length; i++) {
				const k = a.key(i);
				if (k?.startsWith(PREFIXO)) chaves.push(k);
			}
			for (const k of chaves) a.removeItem(k);
			n += chaves.length;
		} catch {
			/* ignora */
		}
	}
	return n;
}
