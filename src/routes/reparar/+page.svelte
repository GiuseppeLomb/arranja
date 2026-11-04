<script lang="ts">
	import BarraTopo from '#lib/componentes/BarraTopo.svelte';
	import Migalhas from '#lib/componentes/Migalhas.svelte';
	import GrelhaTipos from '#lib/componentes/GrelhaTipos.svelte';
</script>

<svelte:head>
	<title>Reparar · Arranja</title>
</svelte:head>

<BarraTopo titulo="Reparar" />
<Migalhas itens={[{ id: 'tipo', rotulo: 'Eletrodoméstico', valor: 'Escolher', atual: true }]} />
<GrelhaTipos titulo="Escolhe o eletrodoméstico" id="reparar-tipos" />
