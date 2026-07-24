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
  mic: string; // code de marché (ex: XPAR pour Euronext Paris) — lève l'ambiguïté des tickers
  country: string;
  currency: string;
  type: string;
}

/** Un symbole à coter, avec sa place de cotation pour éviter les homonymes. */
export interface QuoteEntry {
  symbol: string;
  mic?: string;
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
    mic: d.mic_code ?? '',
    country: d.country,
    currency: d.currency,
    type: d.instrument_type,
  }));
}

/**
 * Cours de plusieurs symboles. On regroupe par place de cotation (MIC) et on fait
 * un appel par groupe avec le paramètre `mic_code`, ce qui évite de récupérer un
 * homonyme coté sur une autre bourse (ex: ACA Paris vs ACA US).
 */
export async function fetchQuotes(
  entries: QuoteEntry[],
  apiKey: string,
): Promise<Record<string, Quote>> {
  const seen = new Set<string>();
  const groups = new Map<string, string[]>(); // mic ('' si inconnu) -> symboles
  for (const e of entries) {
    const sym = e.symbol?.trim();
    if (!sym) continue;
    const mic = e.mic ?? '';
    const uniq = `${sym}|${mic}`;
    if (seen.has(uniq)) continue;
    seen.add(uniq);
    const arr = groups.get(mic) ?? [];
    arr.push(sym);
    groups.set(mic, arr);
  }

  const out: Record<string, Quote> = {};
  await Promise.all(
    [...groups.entries()].map(async ([mic, syms]) => {
      try {
        let url = `${BASE}/quote?symbol=${encodeURIComponent(syms.join(','))}&apikey=${apiKey}`;
        if (mic) url += `&mic_code=${encodeURIComponent(mic)}`;
        const res = await fetch(url);
        if (!res.ok) throw new TwelveDataError(`HTTP ${res.status}`);
        const json = await res.json();
        ensureOk(json);
        const map = syms.length === 1 ? { [syms[0]]: json } : json;
        for (const sym of syms) {
          const q = map[sym];
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
      } catch {
        /* on ignore ce groupe pour ne pas casser tout le rafraîchissement */
      }
    }),
  );
  return out;
}

/** Historique de clôtures d'une action/ETF (ordre chronologique) pour la mini-courbe. */
export async function fetchStockHistory(
  symbol: string,
  apiKey: string,
  outputsize = 30,
  mic?: string,
): Promise<number[]> {
  const url =
    `${BASE}/time_series?symbol=${encodeURIComponent(symbol)}` +
    (mic ? `&mic_code=${encodeURIComponent(mic)}` : '') +
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

/** Récupère les cours convertis en EUR pour une liste de titres (avec leur MIC). */
export async function fetchQuotesEur(
  entries: QuoteEntry[],
  apiKey: string,
): Promise<Record<string, { eur: number; native: number; currency: string; percentChange: number }>> {
  const quotes = await fetchQuotes(entries, apiKey);
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
