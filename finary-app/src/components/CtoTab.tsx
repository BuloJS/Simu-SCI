import { useState } from 'react';
import { formatEur, formatPct, uid } from '../lib/format';
import type { CtoLine } from '../types';

export function CtoTab({
  items,
  onChange,
}: {
  items: CtoLine[];
  onChange: (items: CtoLine[]) => void;
}) {
  const [nom, setNom] = useState('');
  const [ticker, setTicker] = useState('');
  const [quantite, setQuantite] = useState('');
  const [pru, setPru] = useState('');
  const [cours, setCours] = useState('');

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const q = parseFloat(quantite);
    const p = parseFloat(pru);
    const c = parseFloat(cours);
    if (!nom.trim() || !Number.isFinite(q) || q <= 0) return;
    onChange([
      ...items,
      {
        id: uid(),
        nom: nom.trim(),
        ticker: ticker.trim().toUpperCase(),
        quantite: q,
        pru: Number.isFinite(p) ? p : 0,
        cours: Number.isFinite(c) ? c : Number.isFinite(p) ? p : 0,
      },
    ]);
    setNom('');
    setTicker('');
    setQuantite('');
    setPru('');
    setCours('');
  };

  const setCoursFor = (id: string, value: number) =>
    onChange(items.map((c) => (c.id === id ? { ...c, cours: value } : c)));
  const remove = (id: string) => onChange(items.filter((c) => c.id !== id));

  const valeur = items.reduce((s, c) => s + c.quantite * c.cours, 0);
  const investi = items.reduce((s, c) => s + c.quantite * c.pru, 0);
  const pv = valeur - investi;

  return (
    <div className="space-y-6">
      <form
        onSubmit={add}
        className="card grid grid-cols-2 gap-3 lg:grid-cols-6 lg:items-end"
      >
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
            value={cours}
            onChange={(e) => setCours(e.target.value)}
          />
        </label>
        <button type="submit" className="btn-primary h-[38px]">
          + Ajouter
        </button>
      </form>

      {items.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-4 py-3">Titre</th>
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
                  <tr
                    key={c.id}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800/60"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.nom}</div>
                      <div className="text-xs text-slate-400">{c.ticker}</div>
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
