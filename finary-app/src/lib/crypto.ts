/**
 * Récupération des cours crypto en euros via l'API publique CoinGecko
 * (gratuite, sans clé). Ex de retour : { bitcoin: { eur: 58000 } }
 */
export async function fetchCryptoPrices(
  coinIds: string[],
): Promise<Record<string, number>> {
  const ids = [...new Set(coinIds)].filter(Boolean);
  if (ids.length === 0) return {};

  const url =
    'https://api.coingecko.com/api/v3/simple/price?ids=' +
    encodeURIComponent(ids.join(',')) +
    '&vs_currencies=eur';

  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko a répondu ${res.status}`);

  const data = (await res.json()) as Record<string, { eur?: number }>;
  const prices: Record<string, number> = {};
  for (const id of ids) {
    const v = data[id]?.eur;
    if (typeof v === 'number') prices[id] = v;
  }
  return prices;
}

/** Historique de prix en € d'une crypto (pour la mini-courbe). */
export async function fetchCryptoHistory(
  coinId: string,
  days = 30,
): Promise<number[]> {
  const url =
    `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coinId)}` +
    `/market_chart?vs_currency=eur&days=${days}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko a répondu ${res.status}`);
  const data = (await res.json()) as { prices?: [number, number][] };
  return (data.prices ?? []).map((p) => p[1]).filter(Number.isFinite);
}
