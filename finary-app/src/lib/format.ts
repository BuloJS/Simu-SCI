const eur = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
});

const eur0 = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const pct = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

export const formatEur = (n: number) => eur.format(Number.isFinite(n) ? n : 0);
export const formatEur0 = (n: number) => eur0.format(Number.isFinite(n) ? n : 0);
/** value = ratio (0.15 => 15 %) */
export const formatPct = (ratio: number) =>
  pct.format(Number.isFinite(ratio) ? ratio : 0);
/** value déjà en pourcentage (1.5 => "1,5 %") */
export const formatRate = (rate: number) =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(rate)} %`;

export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
