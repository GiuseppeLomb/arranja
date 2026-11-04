import { browser } from '$app/env';

/** Estado reativo de prefers-reduced-motion. */
export const movimento = $state({ reduzido: false });

if (browser && typeof matchMedia === 'function') {
	const mq = matchMedia('(prefers-reduced-motion: reduce)');
	movimento.reduzido = mq.matches;
	mq.addEventListener('change', (e) => {
		movimento.reduzido = e.matches;
	});
}
