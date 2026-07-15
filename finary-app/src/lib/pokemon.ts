/**
 * Recherche de cartes Pokémon via l'API publique pokemontcg.io (gratuite, CORS ok).
 * Fournit l'image et les prix Cardmarket (moyennes 30/7/1 j + tendance, en €).
 */
const BASE = 'https://api.pokemontcg.io/v2';

export interface PokemonPrices {
  avg30?: number;
  avg7?: number;
  avg1?: number;
  trend?: number;
}

export interface PokemonMatch {
  cardId: string;
  name: string;
  set: string;
  number: string;
  image?: string;
  price?: number;
  prices: PokemonPrices;
  url?: string;
}

/** Extrait le numéro seul depuis "1/104", "1 sur 104", "1"… */
export function parseNumber(input: string): string {
  return input.split(/[/\s]+/)[0]?.trim() ?? '';
}

export async function searchPokemonCard(
  name: string,
  number: string,
  set?: string,
): Promise<PokemonMatch | null> {
  const parts: string[] = [];
  if (name.trim()) parts.push(`name:"${name.replace(/"/g, '')}"`);
  const num = parseNumber(number);
  if (num) parts.push(`number:${num}`);
  if (set?.trim()) parts.push(`set.name:"${set.replace(/"/g, '')}"`);
  if (parts.length === 0) return null;

  const url = `${BASE}/cards?q=${encodeURIComponent(parts.join(' '))}&pageSize=5&orderBy=-set.releaseDate`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Pokémon TCG API a répondu ${res.status}`);
  const json = (await res.json()) as { data?: any[] };
  const card = json.data?.[0];
  if (!card) return null;

  const p = card.cardmarket?.prices ?? {};
  return {
    cardId: card.id,
    name: card.name,
    set: card.set?.name ?? set ?? '',
    number: card.number ? `${card.number}/${card.set?.printedTotal ?? '?'}` : number,
    image: card.images?.large ?? card.images?.small,
    price: p.trendPrice ?? p.averageSellPrice ?? undefined,
    prices: {
      avg30: p.avg30,
      avg7: p.avg7,
      avg1: p.avg1,
      trend: p.trendPrice ?? p.averageSellPrice,
    },
    url: card.cardmarket?.url,
  };
}
