import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatEur, formatEur0, uid } from '../lib/format';
import { searchPokemonCard, type Lang } from '../lib/pokemon';
import type { PokemonCard } from '../types';

/** États Cardmarket, du meilleur au pire, avec coefficient sur le prix de référence (NM). */
const CONDITIONS: { key: string; label: string; factor: number }[] = [
  { key: 'M', label: 'Mint (neuf)', factor: 1.15 },
  { key: 'NM', label: 'Near Mint', factor: 1.0 },
  { key: 'EX', label: 'Excellent', factor: 0.85 },
  { key: 'GD', label: 'Good', factor: 0.7 },
  { key: 'LP', label: 'Light Played', factor: 0.55 },
  { key: 'PL', label: 'Played', factor: 0.4 },
  { key: 'PO', label: 'Poor', factor: 0.25 },
];
const factorOf = (cond?: string) =>
  CONDITIONS.find((c) => c.key === cond)?.factor ?? 1;

const PERIODS: { key: keyof NonNullable<PokemonCard['prices']>; label: string }[] = [
  { key: 'avg30', label: '30 j' },
  { key: 'avg7', label: '7 j' },
  { key: 'avg1', label: '1 j' },
  { key: 'trend', label: "Auj." },
];

export function PokemonModal({
  items,
  onChange,
  onClose,
}: {
  items: PokemonCard[];
  onChange: (items: PokemonCard[]) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [set, setSet] = useState('');
  const [number, setNumber] = useState('');
  const [lang, setLang] = useState<Lang>('fr');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setNote(null);
    try {
      const match = await searchPokemonCard(name, number, set, lang);
      if (match) {
        onChange([
          ...items,
          {
            id: uid(),
            cardId: match.cardId,
            name: match.name,
            set: match.set,
            number: match.number,
            image: match.image,
            price: match.price ?? 0,
            prices: match.prices,
            url: match.url,
            condition: 'NM',
            source: match.source,
          },
        ]);
        if (match.price == null)
          setNote('Carte trouvée mais sans prix (ni Cardmarket ni TCGplayer) — saisis la valeur à la main.');
      } else {
        onChange([
          ...items,
          { id: uid(), name: name.trim(), set: set.trim(), number: number.trim(), price: 0, condition: 'NM' },
        ]);
        setNote('Carte non trouvée — ajoutée sans prix (vérifie le nom/numéro ou saisis la valeur).');
      }
      setName('');
      setSet('');
      setNumber('');
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Erreur de recherche');
    } finally {
      setBusy(false);
    }
  };

  const remove = (id: string) => onChange(items.filter((c) => c.id !== id));
  const patch = (id: string, p: Partial<PokemonCard>) =>
    onChange(items.map((c) => (c.id === id ? { ...c, ...p } : c)));

  // Valeur ajustée par l'état
  const adjusted = (c: PokemonCard) => (c.price || 0) * factorOf(c.condition);
  const total = items.reduce((s, c) => s + adjusted(c), 0);

  // Courbe d'évolution : somme de la collection à chaque période (ajustée par l'état)
  const evolution = useMemo(
    () =>
      PERIODS.map((p) => ({
        label: p.label,
        value: items.reduce((s, c) => {
          const base = c.prices?.[p.key] ?? c.price ?? 0;
          return s + base * factorOf(c.condition);
        }, 0),
      })),
    [items],
  );
  const hasEvolution = evolution.some((p) => p.value > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="my-6 min-h-[90vh] w-full max-w-6xl rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-2xl dark:border-slate-700 dark:bg-[#0d1017]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">🃏 Ma collection Pokémon</h2>
            <p className="text-xs text-slate-400">
              {items.length} carte(s) · Valeur totale (état inclus) :{' '}
              <span className="font-semibold text-brand">{formatEur(total)}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-slate-300 text-xs dark:border-slate-700">
              {(['fr', 'en'] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-3 py-1.5 ${lang === l ? 'bg-brand text-white' : 'text-slate-500'}`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="btn-ghost">
              Fermer ✕
            </button>
          </div>
        </div>

        {/* Courbe d'évolution de la collection */}
        {hasEvolution && (
          <div className="card mb-4">
            <p className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              Évolution de la collection (30 derniers jours)
            </p>
            <div className="h-40 w-full">
              <ResponsiveContainer>
                <AreaChart data={evolution} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pkmGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
                  <XAxis dataKey="label" fontSize={12} stroke="#94a3b8" />
                  <YAxis tickFormatter={(v) => formatEur0(v)} width={64} fontSize={12} stroke="#94a3b8" />
                  <Tooltip
                    formatter={(v) => formatEur(Number(v))}
                    contentStyle={{ borderRadius: 10, border: 'none', background: '#0f172a', color: '#fff', fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5} fill="url(#pkmGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Ajout */}
        <form onSubmit={add} className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:items-end">
          <label className="text-sm">
            <span className="mb-1 block text-slate-500 dark:text-slate-400">Nom de la carte</span>
            <input className="input" placeholder={lang === 'fr' ? 'Dracaufeu' : 'Charizard'} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-500 dark:text-slate-400">Extension</span>
            <input className="input" placeholder="Set de Base" value={set} onChange={(e) => setSet(e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-500 dark:text-slate-400">Numéro</span>
            <input className="input" placeholder="4/102 ou 1 sur 104" value={number} onChange={(e) => setNumber(e.target.value)} />
          </label>
          <button type="submit" className="btn-primary h-[38px]" disabled={busy}>
            {busy ? 'Recherche…' : '+ Ajouter'}
          </button>
        </form>
        {note && <p className="mt-2 text-xs text-amber-500">{note}</p>}

        {items.length === 0 ? (
          <p className="mt-6 text-center text-sm text-slate-400">
            Ta collection est vide. Ajoute une carte (nom + numéro suffisent).
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((c) => (
              <div key={c.id} className="card relative p-3">
                <button
                  onClick={() => remove(c.id)}
                  className="absolute right-2 top-2 z-10 rounded bg-white/70 px-1 text-slate-400 hover:text-rose-500 dark:bg-black/40"
                  aria-label="Supprimer"
                >
                  ✕
                </button>
                <div className="flex aspect-[63/88] items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                  {c.image ? (
                    <img src={c.image} alt={c.name} className="h-full w-full object-contain" loading="lazy" />
                  ) : (
                    <span className="text-3xl">🃏</span>
                  )}
                </div>
                <p className="mt-2 truncate text-sm font-medium" title={c.name}>
                  {c.name}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {c.set} {c.number && `· ${c.number}`}
                </p>

                {/* État (grading) */}
                <select
                  className="input mt-2 py-1 text-xs"
                  value={c.condition ?? 'NM'}
                  onChange={(e) => patch(c.id, { condition: e.target.value })}
                >
                  {CONDITIONS.map((cond) => (
                    <option key={cond.key} value={cond.key}>
                      {cond.label} (×{cond.factor})
                    </option>
                  ))}
                </select>

                <div className="mt-2 flex items-baseline justify-between">
                  <span className="font-semibold">{formatEur(adjusted(c))}</span>
                  {c.price > 0 && c.condition !== 'NM' && (
                    <span className="text-xs text-slate-400">réf. {formatEur(c.price)}</span>
                  )}
                </div>
                {c.source && (
                  <p className="text-[10px] text-slate-400">via {c.source}</p>
                )}

                {!c.price && (
                  <input
                    className="input mt-2 py-1 text-right text-xs"
                    type="number"
                    step="any"
                    placeholder="valeur € (réf. NM)"
                    onChange={(e) => patch(c.id, { price: parseFloat(e.target.value) || 0 })}
                  />
                )}
                {c.url && (
                  <a href={c.url} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-brand hover:underline">
                    Voir sur Cardmarket ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="mt-4 text-center text-xs text-slate-400">
          Recherche FR/EN et prix Cardmarket via TCGdex. La valeur est ajustée selon
          l'état (Mint → Poor). La courbe reprend les moyennes 30 j / 7 j / 1 j / tendance.
        </p>
      </div>
    </div>
  );
}
