import { Fragment, useState } from 'react';
import { CRYPTO_PRESETS } from '../data/rates';
import { fetchCryptoHistory, fetchCryptoPrices } from '../lib/crypto';
import { formatEur, formatPct, uid } from '../lib/format';
import type { CryptoLine } from '../types';
import { HoldingsOverview } from './HoldingsOverview';
import { Sparkline } from './Sparkline';

export function CryptoTab({
  items,
  onChange,
}: {
  items: CryptoLine[];
  onChange: (items: CryptoLine[]) => void;
}) {
  const [coinId, setCoinId] = useState(CRYPTO_PRESETS[0].coinId);
  const [quantite, setQuantite] = useState('');
  const [pru, setPru] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  // Mini-courbe historique par ligne (dépliable)
  const [openId, setOpenId] = useState<string | null>(null);
  const [hist, setHist] = useState<Record<string, number[]>>({});
  const [histLoading, setHistLoading] = useState<string | null>(null);

  const toggleHist = async (c: CryptoLine) => {
    if (openId === c.id) {
      setOpenId(null);
      return;
    }
    setOpenId(c.id);
    if (hist[c.coinId]) return;
    setHistLoading(c.coinId);
    try {
      const data = await fetchCryptoHistory(c.coinId, 30);
      setHist((h) => ({ ...h, [c.coinId]: data }));
    } catch {
      /* silencieux */
    } finally {
      setHistLoading(null);
    }
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const q = parseFloat(quantite);
    if (!Number.isFinite(q) || q <= 0) return;
    const preset = CRYPTO_PRESETS.find((c) => c.coinId === coinId)!;
    const p = parseFloat(pru);
    const newList: CryptoLine[] = [
      ...items,
      {
        id: uid(),
        nom: preset.nom,
        coinId: preset.coinId,
        symbol: preset.symbol,
        quantite: q,
        pru: Number.isFinite(p) ? p : 0,
        cours: 0,
      },
    ];
    onChange(newList);
    setQuantite('');
    setPru('');
    // récupère les cours en repartant de la liste à jour (évite la closure obsolète)
    void refresh(newList);
  };

  const remove = (id: string) => onChange(items.filter((c) => c.id !== id));

  const refresh = async (baseList: CryptoLine[] = items) => {
    const coinIds = baseList.map((i) => i.coinId);
    if (coinIds.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const prices = await fetchCryptoPrices(coinIds);
      onChange(
        baseList.map((c) =>
          prices[c.coinId] != null ? { ...c, cours: prices[c.coinId] } : c,
        ),
      );
      setUpdatedAt(new Date().toLocaleTimeString('fr-FR'));
    } catch {
      setError('Impossible de récupérer les cours (API CoinGecko).');
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
          label: c.symbol || c.nom,
          value: c.quantite * c.cours,
          invested: c.quantite * c.pru,
        }))}
      />

      <form
        onSubmit={add}
        className="card grid grid-cols-2 gap-3 lg:grid-cols-5 lg:items-end"
      >
        <label className="text-sm">
          <span className="mb-1 block text-slate-500 dark:text-slate-400">Crypto</span>
          <select
            className="input"
            value={coinId}
            onChange={(e) => setCoinId(e.target.value)}
          >
            {CRYPTO_PRESETS.map((c) => (
              <option key={c.coinId} value={c.coinId}>
                {c.nom} ({c.symbol})
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-500 dark:text-slate-400">Quantité</span>
          <input
            className="input"
            type="number"
            step="any"
            min="0"
            placeholder="0.5"
            value={quantite}
            onChange={(e) => setQuantite(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-500 dark:text-slate-400">
            PRU (€, optionnel)
          </span>
          <input
            className="input"
            type="number"
            step="any"
            value={pru}
            onChange={(e) => setPru(e.target.value)}
          />
        </label>
        <button type="submit" className="btn-primary h-[38px]">
          + Ajouter
        </button>
        <button
          type="button"
          className="btn-ghost h-[38px]"
          onClick={() => refresh()}
          disabled={loading || items.length === 0}
        >
          {loading ? 'Maj…' : '↻ Cours live'}
        </button>
        <p className="col-span-2 text-xs text-slate-400 lg:col-span-5">
          Cours en temps réel via CoinGecko.
          {updatedAt && ` Dernière mise à jour : ${updatedAt}.`}
          {error && <span className="ml-1 text-rose-500">{error}</span>}
        </p>
      </form>

      {items.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-4 py-3">Crypto</th>
                <th className="px-4 py-3 text-right">Qté</th>
                <th className="px-4 py-3 text-right">PRU</th>
                <th className="px-4 py-3 text-right">Cours</th>
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
                        <span className="font-medium">
                          {openId === c.id ? '▾' : '▸'} {c.nom}
                        </span>
                        <span className="ml-1 text-xs text-slate-400">{c.symbol}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">{c.quantite}</td>
                    <td className="px-4 py-3 text-right">
                      {c.pru ? formatEur(c.pru) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.cours ? formatEur(c.cours) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">{formatEur(val)}</td>
                    <td
                      className={`px-4 py-3 text-right ${
                        plus >= 0 ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {inv > 0 ? (
                        <>
                          {formatEur(plus)}
                          <span className="ml-1 text-xs opacity-70">
                            ({formatPct(plus / inv)})
                          </span>
                        </>
                      ) : (
                        '—'
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
                        {histLoading === c.coinId ? (
                          <span className="text-xs text-slate-400">Chargement de la courbe…</span>
                        ) : hist[c.coinId]?.length ? (
                          <div className="flex items-center gap-3">
                            <Sparkline data={hist[c.coinId]} />
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
      )}
    </div>
  );
}
