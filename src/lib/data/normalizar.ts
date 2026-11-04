/**
 * Normaliza um identificador de modelo para comparação:
 * maiúsculas, sem acentos e sem espaços, hífens, pontos, barras ou outros separadores.
 * Ex.: "wan 28-201/ES" → "WAN28201ES"
 */
export function normalizarModelo(texto: string): string {
	return texto
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, '');
}

/** Id de marca a partir do nome: "Électrolux AB" → "electrolux-ab". */
export function slugMarca(nome: string): string {
	return nome
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80);
}

/** Texto para pesquisa: minúsculas, sem acentos, espaços simples. */
export function normalizarTexto(texto: string): string {
	return texto
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/\s+/g, ' ')
		.trim();
}

/** Nome de marca legível a partir do registo EPREL (ex.: "BOSCH" → "Bosch", mantém "AEG"). */
export function nomeMarcaLegivel(original: string): string {
	const t = original.trim().replace(/\s+/g, ' ');
	if (t.length > 3 && t === t.toUpperCase() && /[A-Z]/.test(t)) {
		return t
			.toLowerCase()
			.replace(/(^|[\s-])([a-zà-ÿ])/g, (_, sep: string, l: string) => sep + l.toUpperCase());
	}
	return t;
}
