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
