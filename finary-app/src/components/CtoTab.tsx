import { Fragment, useState } from 'react';
import { formatEur, formatPct, uid } from '../lib/format';
import { fetchQuotesEur, fetchStockHistory, type SymbolResult } from '../lib/stocks';
import type { CtoLine } from '../types';
import { HoldingsOverview } from './HoldingsOverview';
import { Sparkline } from './Sparkline';
import { SymbolSearch } from './SymbolSearch';

type Live = Record<
  string,
  { eur: number; native: number; currency: string; percentChange: number }
>;

export function CtoTab({
  items,
  onChange,
  apiKey,
  setApiKey,
}: {
  items: CtoLine[];
  onChange: (items: CtoLine[]) => void;
  apiKey: string;
  setApiKey: (k: string) => void;
}) {
  const [nom, setNom] = useState('');
  const [ticker, setTicker] = useState('');
  const [devise, setDevise] = useState('EUR');
  const [bourse, setBourse] = useState('');
  const [quantite, setQuantite] = useState('');
  const [pru, setPru] = useState('');
  const [cours, setCours] = useState('');

  const [keyDraft, setKeyDraft] = useState('');
  const [live, setLive] = useState<Live>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  // Mini-courbe historique par ligne (dépliable)
  const [openId, setOpenId] = useState<string | null>(null);
  const [hist, setHist] = useState<Record<string, number[]>>({});
  const [histLoading, setHistLoading] = useState<string | null>(null);

  const toggleHist = async (c: CtoLine) => {
    if (openId === c.id) {
      setOpenId(null);
      return;
    }
    setOpenId(c.id);
    if (!apiKey || !c.ticker || hist[c.ticker]) return;
    setHistLoading(c.ticker);
    try {
      const data = await fetchStockHistory(c.ticker, apiKey, 30);
      setHist((h) => ({ ...h, [c.ticker]: data }));
    } catch {
      /* silencieux : la courbe restera indisponible */
    } finally {
      setHistLoading(null);
    }
  };

  const onPick = (r: SymbolResult) => {
    setNom(r.name);
    setTicker(r.symbol);
    setDevise(r.currency || 'EUR');
    setBourse(r.exchange || '');
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const q = parseFloat(quantite);
    const p = parseFloat(pru);
    const c = parseFloat(cours);
    if (!nom.trim() || !Number.isFinite(q) || q <= 0) return;
    const tk = ticker.trim().toUpperCase();
    // cours saisi ? on le garde. Sinon on partira du PRU en attendant le cours live.
    const coursSaisi = Number.isFinite(c);
    const newList: CtoLine[] = [
      ...items,
      {
        id: uid(),
        nom: nom.trim(),
        ticker: tk,
        devise: devise || 'EUR',
        bourse,
        quantite: q,
        pru: Number.isFinite(p) ? p : 0,
        cours: coursSaisi ? c : Number.isFinite(p) ? p : 0,
      },
    ];
    onChange(newList);
    setNom('');
    setTicker('');
    setDevise('EUR');
    setBourse('');
    setQuantite('');
    setPru('');
    setCours('');
    // Récupère automatiquement le cours du marché pour calculer la plus-value
    if (apiKey && tk && !coursSaisi) void refresh(newList);
  };

  const setCoursFor = (id: string, value: number) =>
    onChange(items.map((c) => (c.id === id ? { ...c, cours: value } : c)));
  const remove = (id: string) => onChange(items.filter((c) => c.id !== id));

  const refresh = async (baseList: CtoLine[] = items) => {
    const tickers = baseList.map((i) => i.ticker).filter(Boolean);
    if (!apiKey || tickers.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const quotes = await fetchQuotesEur(tickers, apiKey);
      setLive(quotes);
      onChange(
        baseList.map((c) =>
          quotes[c.ticker] ? { ...c, cours: quotes[c.ticker].eur } : c,
        ),
      );
      setUpdatedAt(new Date().toLocaleTimeString('fr-FR'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de récupération des cours');
    } finally {
      setLoading(false);
    }
  };

  const valeur = items.reduce((s, c) => s + c.quantite * c.cours, 0);
  const investi = items.reduce((s, c) => s + c.quantite * c.pru, 0);
  const pv = valeur - investi;

  return (
    <div className="space-y-6">
      <HoldingsOverview
        rows={items.map((c) => ({
          label: c.ticker || c.nom,
          value: c.quantite * c.cours,
          invested: c.quantite * c.pru,
        }))}
      />

      {/* Clé API si absente */}
      {!apiKey && (
        <div className="card border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10">
          <p className="text-sm font-medium">🔑 Active la recherche et les cours en direct</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Colle ta clé API Twelve Data (gratuite). Elle reste dans ton navigateur,
            elle n'est jamais envoyée ailleurs.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              className="input"
              placeholder="Clé API Twelve Data"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
            />
            <button
              className="btn-primary shrink-0"
              onClick={() => setApiKey(keyDraft)}
              disabled={!keyDraft.trim()}
            >
              Enregistrer
            </button>
          </div>
        </div>
      )}

      <form onSubmit={add} className="card space-y-3">
        {apiKey && <SymbolSearch apiKey={apiKey} onSelect={onPick} />}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6 lg:items-end">
          <label className="col-span-2 text-sm lg:col-span-1">
            <span className="mb-1 block text-slate-500 dark:text-slate-400">Nom</span>
            <input
              className="input"
              placeholder="MSCI World"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-500 dark:text-slate-400">Ticker</span>
            <input
              className="input"
              placeholder="CW8"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-500 dark:text-slate-400">Quantité</span>
            <input
              className="input"
              type="number"
              step="any"
              min="0"
              value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-500 dark:text-slate-400">PRU (€)</span>
            <input
              className="input"
              type="number"
              step="any"
              value={pru}
              onChange={(e) => setPru(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-500 dark:text-slate-400">Cours (€)</span>
            <input
              className="input"
              type="number"
              step="any"
              placeholder="auto"
              value={cours}
              onChange={(e) => setCours(e.target.value)}
            />
          </label>
          <button type="submit" className="btn-primary h-[38px]">
            + Ajouter
          </button>
        </div>
        {devise !== 'EUR' && nom && (
          <p className="text-xs text-slate-400">
            {ticker} coté en {devise} sur {bourse} — le cours live sera converti en €.
          </p>
        )}
      </form>

      {items.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              {updatedAt
                ? `Cours mis à jour à ${updatedAt}`
                : apiKey
                  ? 'Cours du marché récupéré auto à l’ajout · « ↻ Cours live » pour rafraîchir'
                  : 'Sans clé API : saisis le cours actuel à la main pour voir la plus-value'}
              {error && <span className="ml-1 text-rose-500">· {error}</span>}
            </p>
            <button
              className="btn-ghost"
              onClick={() => refresh()}
              disabled={loading || !apiKey}
              title={!apiKey ? 'Ajoute ta clé API' : ''}
            >
              {loading ? 'Maj…' : '↻ Cours live'}
            </button>
          </div>

          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="px-4 py-3">Titre</th>
                  <th className="px-4 py-3 text-right">Qté</th>
                  <th className="px-4 py-3 text-right">PRU</th>
                  <th className="px-4 py-3 text-right">Cours (€)</th>
                  <th className="px-4 py-3 text-right">Valeur</th>
                  <th className="px-4 py-3 text-right">+/- value</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => {
                  const val = c.quantite * c.cours;
                  const inv = c.quantite * c.pru;
                  const plus = val - inv;
                  return (
                    <Fragment key={c.id}>
                    <tr className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleHist(c)}
                          className="text-left hover:opacity-80"
                          title="Voir la courbe 30 j"
                        >
                          <div className="font-medium">
                            {openId === c.id ? '▾' : '▸'} {c.nom}
                          </div>
                          <div className="text-xs text-slate-400">
                            {c.ticker}
                            {c.bourse ? ` · ${c.bourse}` : ''}
                          </div>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">{c.quantite}</td>
                      <td className="px-4 py-3 text-right">{formatEur(c.pru)}</td>
                      <td className="px-4 py-3 text-right">
                        <input
                          className="input w-24 py-1 text-right"
                          type="number"
                          step="any"
                          value={c.cours}
                          onChange={(e) =>
                            setCoursFor(c.id, parseFloat(e.target.value) || 0)
                          }
                        />
                      </td>
                      <td className="px-4 py-3 text-right">{formatEur(val)}</td>
                      <td
                        className={`px-4 py-3 text-right ${
                          plus >= 0 ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {formatEur(plus)}
                        {inv > 0 && (
                          <span className="ml-1 text-xs opacity-70">
                            ({formatPct(plus / inv)})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => remove(c.id)}
                          className="text-slate-400 hover:text-rose-500"
                          aria-label="Supprimer"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                    {openId === c.id && (
                      <tr className="border-b border-slate-100 dark:border-slate-800/60">
                        <td colSpan={7} className="bg-slate-50 px-4 py-3 dark:bg-slate-900/40">
                          {!apiKey ? (
                            <span className="text-xs text-slate-400">
                              Ajoute ta clé API pour voir la courbe.
                            </span>
                          ) : histLoading === c.ticker ? (
                            <span className="text-xs text-slate-400">Chargement de la courbe…</span>
                          ) : hist[c.ticker]?.length ? (
                            <div className="flex items-center gap-3">
                              <Sparkline data={hist[c.ticker]} />
                              <span className="text-xs text-slate-400">30 jours</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Courbe indisponible.</span>
                          )}
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td className="px-4 py-3" colSpan={4}>
                    Total ({items.length})
                  </td>
                  <td className="px-4 py-3 text-right">{formatEur(valeur)}</td>
                  <td
                    className={`px-4 py-3 text-right ${
                      pv >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {formatEur(pv)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Panneau cours en direct */}
          {Object.keys(live).length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                Cours en direct
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {items
                  .filter((c) => live[c.ticker])
                  .map((c) => {
                    const q = live[c.ticker];
                    const up = q.percentChange >= 0;
                    return (
                      <div key={c.id} className="card p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{c.ticker}</span>
                          <span
                            className={`text-xs font-medium ${
                              up ? 'text-emerald-500' : 'text-rose-500'
                            }`}
                          >
                            {up ? '▲' : '▼'} {Math.abs(q.percentChange).toFixed(2)}%
                          </span>
                        </div>
                        <div className="mt-1 text-lg font-semibold">
                          {formatEur(q.eur)}
                        </div>
                        {q.currency !== 'EUR' && (
                          <div className="text-xs text-slate-400">
                            {q.native.toFixed(2)} {q.currency}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
