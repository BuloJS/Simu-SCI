/**
 * Recherche de cartes Pokémon via l'API TCGdex (https://tcgdex.dev) — gratuite,
 * multilingue (français inclus), CORS ok. Fournit image + prix Cardmarket.
 */
const BASE = 'https://api.tcgdex.net/v2';

export type Lang = 'fr' | 'en';

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

function pick(o: any, keys: string[]): number | undefined {
  if (!o) return undefined;
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  }
  return undefined;
}

async function getJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TCGdex a répondu ${res.status}`);
  return res.json();
}

export async function searchPokemonCard(
  name: string,
  number: string,
  set: string | undefined,
  lang: Lang = 'fr',
): Promise<PokemonMatch | null> {
  const params = new URLSearchParams();
  if (name.trim()) params.set('name', name.trim());
  const num = parseNumber(number);
  if (num) params.set('localId', num);

  const list = (await getJson(`${BASE}/${lang}/cards?${params.toString()}`)) as any[];
  if (!Array.isArray(list) || list.length === 0) return null;

  // Si une extension est fournie, on essaie de trouver le meilleur candidat.
  const brief =
    (set?.trim() &&
      list.find((c) =>
        String(c.id ?? '').toLowerCase().includes(set.trim().toLowerCase()),
      )) ||
    list[0];

  const full = await getJson(`${BASE}/${lang}/cards/${brief.id}`);
  const cm = full.pricing?.cardmarket ?? {};
  const image = full.image
    ? `${full.image}/high.webp`
    : brief.image
      ? `${brief.image}/high.webp`
      : undefined;
  const total = full.set?.cardCount?.official ?? full.set?.cardCount?.total;

  return {
    cardId: full.id,
    name: full.name,
    set: full.set?.name ?? set ?? '',
    number: full.localId ? `${full.localId}/${total ?? '?'}` : number,
    image,
    price: pick(cm, ['trend', 'avg', 'avg30', 'trendHolo', 'avgHolo']),
    prices: {
      avg30: pick(cm, ['avg30', 'avg30Holo']),
      avg7: pick(cm, ['avg7', 'avg7Holo']),
      avg1: pick(cm, ['avg1', 'avg1Holo']),
      trend: pick(cm, ['trend', 'avg', 'trendHolo', 'avgHolo']),
    },
    url: `https://www.cardmarket.com/${lang === 'fr' ? 'fr' : 'en'}/Pokemon/Products/Search?searchString=${encodeURIComponent(full.name)}`,
  };
}
