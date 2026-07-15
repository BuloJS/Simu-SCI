/**
 * Client Twelve Data (https://twelvedata.com) — recherche de symboles et cours
 * en direct des actions / ETF. Appels effectués depuis le navigateur (CORS ok).
 * La clé API est fournie par l'utilisateur et stockée dans son navigateur.
 */
const BASE = 'https://api.twelvedata.com';

export interface SymbolResult {
  symbol: string;
  name: string;
  exchange: string;
  country: string;
  currency: string;
  type: string;
}

export interface Quote {
  symbol: string;
  price: number; // dans la devise de cotation
  currency: string;
  percentChange: number;
  exchange: string;
}

class TwelveDataError extends Error {}

function ensureOk(json: any) {
  if (json && json.status === 'error') {
    throw new TwelveDataError(json.message || 'Erreur Twelve Data');
  }
}

/** Recherche d'actions / ETF par nom ou ticker. */
export async function searchSymbols(
  query: string,
  apiKey: string,
): Promise<SymbolResult[]> {
  const q = query.trim();
  if (q.length < 1) return [];
  const url = `${BASE}/symbol_search?symbol=${encodeURIComponent(q)}&outputsize=15&apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new TwelveDataError(`HTTP ${res.status}`);
  const json = await res.json();
  ensureOk(json);
  const data: any[] = Array.isArray(json.data) ? json.data : [];
  return data.map((d) => ({
    symbol: d.symbol,
    name: d.instrument_name,
    exchange: d.exchange,
    country: d.country,
    currency: d.currency,
    type: d.instrument_type,
  }));
}

/** Cours de plusieurs symboles en un appel (symboles séparés par des virgules). */
export async function fetchQuotes(
  symbols: string[],
  apiKey: string,
): Promise<Record<string, Quote>> {
  const list = [...new Set(symbols.map((s) => s.trim()).filter(Boolean))];
  if (list.length === 0) return {};

  const url = `${BASE}/quote?symbol=${encodeURIComponent(list.join(','))}&apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new TwelveDataError(`HTTP ${res.status}`);
  const json = await res.json();
  ensureOk(json);

  // Un seul symbole -> objet direct ; plusieurs -> objet indexé par symbole.
  const entries = list.length === 1 ? { [list[0]]: json } : json;
  const out: Record<string, Quote> = {};
  for (const sym of list) {
    const q = entries[sym];
    if (!q || q.status === 'error') continue;
    const price = parseFloat(q.close ?? q.price);
    if (!Number.isFinite(price)) continue;
    out[sym] = {
      symbol: sym,
      price,
      currency: q.currency ?? 'EUR',
      percentChange: parseFloat(q.percent_change) || 0,
      exchange: q.exchange ?? '',
    };
  }
  return out;
}

/** Historique de clôtures d'une action/ETF (ordre chronologique) pour la mini-courbe. */
export async function fetchStockHistory(
  symbol: string,
  apiKey: string,
  outputsize = 30,
): Promise<number[]> {
  const url =
    `${BASE}/time_series?symbol=${encodeURIComponent(symbol)}` +
    `&interval=1day&outputsize=${outputsize}&apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new TwelveDataError(`HTTP ${res.status}`);
  const json = await res.json();
  ensureOk(json);
  const values = (json.values ?? []) as { close: string }[];
  return values
    .map((v) => parseFloat(v.close))
    .filter(Number.isFinite)
    .reverse(); // Twelve Data renvoie du plus récent au plus ancien
}

/** Taux de change vers l'EUR pour une devise donnée (1 unité -> x EUR). */
export async function fetchFxToEur(
  currency: string,
  apiKey: string,
): Promise<number> {
  if (!currency || currency.toUpperCase() === 'EUR') return 1;
  const url = `${BASE}/exchange_rate?symbol=${encodeURIComponent(`${currency}/EUR`)}&apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new TwelveDataError(`HTTP ${res.status}`);
  const json = await res.json();
  ensureOk(json);
  const rate = parseFloat(json.rate);
  return Number.isFinite(rate) ? rate : 1;
}

/** Récupère les cours convertis en EUR pour une liste de symboles. */
export async function fetchQuotesEur(
  symbols: string[],
  apiKey: string,
): Promise<Record<string, { eur: number; native: number; currency: string; percentChange: number }>> {
  const quotes = await fetchQuotes(symbols, apiKey);
  const currencies = [...new Set(Object.values(quotes).map((q) => q.currency))];
  const fx: Record<string, number> = {};
  await Promise.all(
    currencies.map(async (c) => {
      fx[c] = await fetchFxToEur(c, apiKey);
    }),
  );
  const out: Record<string, { eur: number; native: number; currency: string; percentChange: number }> = {};
  for (const [sym, q] of Object.entries(quotes)) {
    const rate = fx[q.currency] ?? 1;
    out[sym] = {
      native: q.price,
      eur: q.price * rate,
      currency: q.currency,
      percentChange: q.percentChange,
    };
  }
  return out;
}
