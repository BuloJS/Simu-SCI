import { useState } from 'react';
import { LIVRET_PRESETS, RATES_AS_OF } from '../data/rates';
import { formatEur, formatRate, uid } from '../lib/format';
import type { Livret } from '../types';

export function LivretTab({
  items,
  onChange,
}: {
  items: Livret[];
  onChange: (items: Livret[]) => void;
}) {
  const [preset, setPreset] = useState(LIVRET_PRESETS[0].nom);
  const [banque, setBanque] = useState('');
  const [montant, setMontant] = useState('');
  const [taux, setTaux] = useState(String(LIVRET_PRESETS[0].taux));

  const selectPreset = (nom: string) => {
    setPreset(nom);
    const p = LIVRET_PRESETS.find((x) => x.nom === nom);
    if (p) setTaux(String(p.taux));
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const m = parseFloat(montant);
    if (!Number.isFinite(m) || m <= 0) return;
    const livret: Livret = {
      id: uid(),
      nom: preset,
      banque: banque.trim(),
      montant: m,
      taux: parseFloat(taux) || 0,
    };
    onChange([...items, livret]);
    setMontant('');
    setBanque('');
  };

  const remove = (id: string) => onChange(items.filter((l) => l.id !== id));

  const total = items.reduce((s, l) => s + l.montant, 0);
  const interets = items.reduce((s, l) => s + (l.montant * l.taux) / 100, 0);

  return (
    <div className="space-y-6">
      <form
        onSubmit={add}
        className="card grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
      >
        <label className="text-sm">
          <span className="mb-1 block text-slate-500 dark:text-slate-400">Produit</span>
          <select
            className="input"
            value={preset}
            onChange={(e) => selectPreset(e.target.value)}
          >
            {LIVRET_PRESETS.map((p) => (
              <option key={p.nom} value={p.nom}>
                {p.nom}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-500 dark:text-slate-400">Banque</span>
          <input
            className="input"
            placeholder="Boursorama…"
            value={banque}
            onChange={(e) => setBanque(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-500 dark:text-slate-400">Montant (€)</span>
          <input
            className="input"
            type="number"
            min="0"
            step="any"
            placeholder="10000"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-500 dark:text-slate-400">Taux (%)</span>
          <input
            className="input"
            type="number"
            step="any"
            value={taux}
            onChange={(e) => setTaux(e.target.value)}
          />
        </label>
        <button type="submit" className="btn-primary h-[38px]">
          + Ajouter
        </button>
        <p className="text-xs text-slate-400 sm:col-span-2 lg:col-span-5">
          Taux réglementés pré-remplis (en vigueur au {RATES_AS_OF}) — modifiables à la main.
        </p>
      </form>

      {items.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-4 py-3">Produit</th>
                <th className="px-4 py-3">Banque</th>
                <th className="px-4 py-3 text-right">Montant</th>
                <th className="px-4 py-3 text-right">Taux</th>
                <th className="px-4 py-3 text-right">Intérêts / an</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800/60"
                >
                  <td className="px-4 py-3 font-medium">{l.nom}</td>
                  <td className="px-4 py-3 text-slate-500">{l.banque || '—'}</td>
                  <td className="px-4 py-3 text-right">{formatEur(l.montant)}</td>
                  <td className="px-4 py-3 text-right">{formatRate(l.taux)}</td>
                  <td className="px-4 py-3 text-right text-emerald-500">
                    {formatEur((l.montant * l.taux) / 100)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => remove(l.id)}
                      className="text-slate-400 hover:text-rose-500"
                      aria-label="Supprimer"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className="px-4 py-3" colSpan={2}>
                  Total ({items.length})
                </td>
                <td className="px-4 py-3 text-right">{formatEur(total)}</td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3 text-right text-emerald-500">
                  {formatEur(interets)}
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
