/**
 * Compila /data (YAML + snapshots EPREL) para JSON consumido pela app.
 *
 *   tsx scripts/build-data.ts            → produção (sem conteúdo de exemplo)
 *   tsx scripts/build-data.ts --exemplos → desenvolvimento (inclui `example: true`)
 *
 * Saídas (não versionadas):
 *   src/lib/generated/conteudo.json          conteúdo + catálogo de marcas
 *   static/data/modelos/{tipo}/{marca}.json  modelos EPREL por marca (carregados a pedido)
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { carregar, validarSemantica, ficheirosEprel, imprimirProblemas, validadores, RAIZ } from './lib/dados.ts';
import { normalizarModelo, slugMarca, nomeMarcaLegivel } from '../src/lib/data/normalizar.ts';
import type { Conteudo, Marca, GrupoEprel, ShardModelos } from '../src/lib/data/tipos.ts';

const exemplos = process.argv.includes('--exemplos') || process.env.ARRANJA_EXEMPLOS === '1';

interface ModeloEprel {
	brand: string;
	model_identifier: string;
	appliance_type: string;
	grupo?: string;
	eprel_registration_number?: string;
	eprel_url: string;
}
interface Snapshot {
	fonte: { obtido_em: string };
	grupo: string;
	appliance_type: string;
	total: number;
	modelos: ModeloEprel[];
}

const { dados, problemas } = carregar();
problemas.push(...validarSemantica(dados));
if (problemas.length) {
	console.error(`✗ ${problemas.length} problema(s) nos dados:`);
	imprimirProblemas(problemas);
	process.exit(1);
}

const real = <T extends { example?: boolean }>(xs: T[]) => (exemplos ? xs : xs.filter((x) => !x.example));
const familias = real(dados.familias);
const guias = real(dados.guias);
const arvores = real(dados.arvores);
const codigos = real(dados.codigos);
const marcasYaml = real(dados.marcas);

// ---------- Catálogo de marcas ----------
const marcas = new Map<string, Marca>();
const obterMarca = (id: string, nome: string) => {
	let m = marcas.get(id);
	if (!m) {
		m = { id, nome, eprel: {}, conteudo: [] };
		marcas.set(id, m);
	}
	return m;
};
for (const m of marcasYaml) {
	const x = obterMarca(m.id, m.nome);
	if (m.pagina_pecas) x.pagina_pecas = m.pagina_pecas;
	if (m.example) x.example = true;
}
const marcarConteudo = (brand: string, tipo: string) => {
	if (brand === '*') return;
	const m = marcas.get(brand);
	if (m && !m.conteudo.includes(tipo)) m.conteudo.push(tipo);
};
for (const g of guias) for (const r of g.aplicavel_a) marcarConteudo(r.brand, g.appliance_type);
for (const a of arvores) for (const r of a.aplicavel_a) marcarConteudo(r.brand, a.appliance_type);
for (const c of codigos) marcarConteudo(c.brand, c.appliance_type);
for (const f of familias) marcarConteudo(f.brand, f.appliance_type);

// ---------- EPREL ----------
const destinoModelos = join(RAIZ, 'static', 'data', 'modelos');
rmSync(destinoModelos, { recursive: true, force: true });

const grupos: GrupoEprel[] = [];
const shards = new Map<string, { g: string[]; m: Map<string, [string, string, number]> }>();
const grafias = new Map<string, Map<string, number>>(); // id → (grafia original → contagem)
const gruposValidos = new Map(dados.tipos.flatMap((t) => t.eprel_grupos.map((g) => [g.grupo, t.id] as const)));
const snapshotValido = validadores().snapshot;

for (const ficheiro of ficheirosEprel()) {
	const snap = JSON.parse(readFileSync(ficheiro, 'utf8')) as Snapshot;
	if (!snapshotValido(snap)) {
		console.error(`✗ ${ficheiro}: snapshot EPREL inválido`, snapshotValido.errors?.slice(0, 5));
		process.exit(1);
	}
	const tipo = gruposValidos.get(snap.grupo);
	if (!tipo || tipo !== snap.appliance_type) {
		console.error(`✗ ${ficheiro}: grupo ${snap.grupo} não está associado a ${snap.appliance_type} em data/tipos.yaml`);
		process.exit(1);
	}
	grupos.push({ grupo: snap.grupo, appliance_type: tipo, total: snap.modelos.length, obtido_em: snap.fonte.obtido_em });

	for (const mod of snap.modelos) {
		const id = slugMarca(mod.brand);
		if (!id) continue;
		const g = grafias.get(id) ?? new Map<string, number>();
		g.set(mod.brand, (g.get(mod.brand) ?? 0) + 1);
		grafias.set(id, g);

		const chave = `${tipo}/${id}`;
		let s = shards.get(chave);
		if (!s) {
			s = { g: [], m: new Map() };
			shards.set(chave, s);
		}
		let gi = s.g.indexOf(snap.grupo);
		if (gi < 0) gi = s.g.push(snap.grupo) - 1;
		const norm = normalizarModelo(mod.model_identifier);
		const reg = mod.eprel_registration_number ?? '';
		// Um registo por modelo normalizado; prefere o regulamento mais recente (primeiro listado em tipos.yaml).
		if (!s.m.has(norm)) s.m.set(norm, [mod.model_identifier, reg, gi]);
	}
}

for (const [id, g] of grafias) {
	const maisComum = [...g.entries()].sort((a, b) => b[1] - a[1])[0][0];
	obterMarca(id, nomeMarcaLegivel(maisComum));
}

for (const [chave, s] of shards) {
	const [tipo, marca] = chave.split('/');
	const m = [...s.m.values()].sort((a, b) => a[0].localeCompare(b[0], 'en'));
	marcas.get(marca)!.eprel[tipo] = m.length;
	const shard: ShardModelos = { g: s.g, m };
	mkdirSync(join(destinoModelos, tipo), { recursive: true });
	writeFileSync(join(destinoModelos, tipo, `${marca}.json`), JSON.stringify(shard));
}

// ---------- Saída ----------
const conteudo: Conteudo = {
	gerado_em: new Date().toISOString(),
	exemplos,
	tipos: dados.tipos,
	ferramentas: dados.ferramentas,
	familias,
	guias,
	arvores,
	codigos,
	marcas: [...marcas.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt')),
	eprel: { grupos }
};

const destino = join(RAIZ, 'src', 'lib', 'generated');
mkdirSync(destino, { recursive: true });
writeFileSync(join(destino, 'conteudo.json'), JSON.stringify(conteudo));
mkdirSync(join(RAIZ, 'static', 'data'), { recursive: true });
writeFileSync(
	join(RAIZ, 'static', 'data', 'versao.json'),
	JSON.stringify({ gerado_em: conteudo.gerado_em, guias: guias.length, arvores: arvores.length, codigos: codigos.length, grupos_eprel: grupos })
);

const totalModelos = grupos.reduce((s, g) => s + g.total, 0);
console.log(
	`✓ dados compilados${exemplos ? ' (com exemplos)' : ''}: ${guias.length} guias, ${arvores.length} árvores, ${codigos.length} códigos, ` +
		`${familias.length} famílias, ${marcas.size} marcas, ${totalModelos} modelos EPREL em ${shards.size} ficheiros`
);
