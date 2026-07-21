/**
 * Cartes Pokémon via l'API TCGdex (https://tcgdex.dev) — gratuite, multilingue
 * (français inclus), CORS ok. Recherche (liste de résultats) puis détail (prix
 * Cardmarket, repli TCGplayer converti en €).
 */
const BASE = 'https://api.tcgdex.net/v2';

export type Lang = 'fr' | 'en';

export interface PokemonPrices {
  avg30?: number;
  avg7?: number;
  avg1?: number;
  trend?: number;
}

/** Résultat bref (pour le choix parmi plusieurs cartes). */
export interface PokemonBrief {
  id: string;
  localId?: string;
  name: string;
  image?: string;
  setId: string;
}

export interface PokemonMatch {
  cardId: string;
  name: string;
  set: string;
  number: string;
  image?: string;
  price?: number;
  prices: PokemonPrices;
  url?: string; // lien Cardmarket
  tcgUrl?: string; // lien TCGplayer
  source?: string; // "Cardmarket" ou "TCGplayer"
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

/** Meilleur prix marché TCGplayer (USD) parmi les variantes normal/holo/reverse. */
function tcgplayerUsd(tp: any): number | undefined {
  if (!tp || typeof tp !== 'object') return undefined;
  const fields = ['marketPrice', 'midPrice', 'directLowPrice', 'lowPrice', 'highPrice'];
  for (const v of Object.values(tp)) {
    if (v && typeof v === 'object') {
      const p = pick(v, fields);
      if (p != null) return p;
    }
  }
  return pick(tp, fields);
}

/** Taux USD -> EUR (frankfurter.app, gratuit, sans clé), avec cache 1 h et repli. */
let fxCache: { rate: number; ts: number } | null = null;
async function usdToEur(): Promise<number> {
  if (fxCache && Date.now() - fxCache.ts < 3_600_000) return fxCache.rate;
  try {
    const r = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR');
    if (r.ok) {
      const j = await r.json();
      const rate = j.rates?.EUR;
      if (typeof rate === 'number') {
        fxCache = { rate, ts: Date.now() };
        return rate;
      }
    }
  } catch {
    /* repli ci-dessous */
  }
  return 0.92;
}

/** Liste des cartes correspondant à un nom (+ numéro optionnel). */
export async function searchPokemonList(
  name: string,
  number: string,
  lang: Lang = 'fr',
  limit = 18,
): Promise<PokemonBrief[]> {
  const params = new URLSearchParams();
  if (name.trim()) params.set('name', name.trim());
  const num = parseNumber(number);
  if (num) params.set('localId', num);
  if ([...params].length === 0) return [];

  const list = (await getJson(`${BASE}/${lang}/cards?${params.toString()}`)) as any[];
  if (!Array.isArray(list)) return [];
  return list.slice(0, limit).map((c) => ({
    id: c.id,
    localId: c.localId,
    name: c.name,
    image: c.image ? `${c.image}/low.webp` : undefined,
    setId:
      typeof c.id === 'string' && c.id.includes('-')
        ? c.id.slice(0, c.id.lastIndexOf('-'))
        : '',
  }));
}

/** Détail d'une carte choisie : image HD + prix (Cardmarket puis TCGplayer). */
export async function getCardDetails(id: string, lang: Lang = 'fr'): Promise<PokemonMatch> {
  const full = await getJson(`${BASE}/${lang}/cards/${id}`);
  const cm = full.pricing?.cardmarket ?? {};
  const image = full.image ? `${full.image}/high.webp` : undefined;
  const total = full.set?.cardCount?.official ?? full.set?.cardCount?.total;

  const cmTrend = pick(cm, ['trend', 'avg', 'avg30', 'trendHolo', 'avgHolo']);
  let price = cmTrend;
  let prices: PokemonPrices = {
    avg30: pick(cm, ['avg30', 'avg30Holo']),
    avg7: pick(cm, ['avg7', 'avg7Holo']),
    avg1: pick(cm, ['avg1', 'avg1Holo']),
    trend: cmTrend,
  };
  let source: string | undefined = cmTrend != null ? 'Cardmarket' : undefined;

  if (price == null) {
    const usd = tcgplayerUsd(full.pricing?.tcgplayer);
    if (usd != null) {
      price = usd * (await usdToEur());
      prices = { trend: price };
      source = 'TCGplayer';
    }
  }

  const cmLang = lang === 'fr' ? 'fr' : 'en';
  const q = encodeURIComponent(full.name);
  return {
    cardId: full.id,
    name: full.name,
    set: full.set?.name ?? '',
    number: full.localId ? `${full.localId}/${total ?? '?'}` : '',
    image,
    price,
    prices,
    url: `https://www.cardmarket.com/${cmLang}/Pokemon/Products/Search?searchString=${q}`,
    tcgUrl: `https://www.tcgplayer.com/search/pokemon/product?q=${q}&productLineName=pokemon`,
    source,
  };
}
