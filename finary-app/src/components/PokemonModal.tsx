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
import {
  getCardDetails,
  searchPokemonList,
  type Lang,
  type PokemonBrief,
} from '../lib/pokemon';
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
  const [results, setResults] = useState<PokemonBrief[] | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  // Recherche : affiche la liste des cartes correspondantes pour que l'utilisateur choisisse
  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setNote(null);
    setResults(null);
    try {
      const list = await searchPokemonList(name, number, lang);
      if (list.length === 0) {
        setNote('Aucune carte trouvée. Vérifie le nom/numéro ou ajoute-la à la main.');
        setResults([]);
      } else {
        setResults(list);
      }
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Erreur de recherche');
    } finally {
      setBusy(false);
    }
  };

  // Choix d'une carte : récupère son détail (prix) et l'ajoute à la collection
  const choose = async (brief: PokemonBrief) => {
    setAdding(brief.id);
    try {
      const m = await getCardDetails(brief.id, lang);
      onChange([
        ...items,
        {
          id: uid(),
          cardId: m.cardId,
          name: m.name,
          set: m.set,
          number: m.number,
          image: m.image ?? (brief.image ? brief.image.replace('/low.', '/high.') : undefined),
          price: m.price ?? 0,
          prices: m.prices,
          url: m.url,
          tcgUrl: m.tcgUrl,
          condition: 'NM',
          source: m.source,
        },
      ]);
      setResults(null);
      setNote(null);
      setName('');
      setSet('');
      setNumber('');
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Erreur à l'ajout");
    } finally {
      setAdding(null);
    }
  };

  const addManual = () => {
    if (!name.trim()) return;
    onChange([
      ...items,
      { id: uid(), name: name.trim(), set: set.trim(), number: number.trim(), price: 0, condition: 'NM' },
    ]);
    setResults(null);
    setNote(null);
    setName('');
    setSet('');
    setNumber('');
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

        {/* Recherche */}
        <form onSubmit={search} className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:items-end">
          <label className="text-sm">
            <span className="mb-1 block text-slate-500 dark:text-slate-400">Nom de la carte</span>
            <input className="input" placeholder={lang === 'fr' ? 'Celebi' : 'Celebi'} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-500 dark:text-slate-400">Extension (option.)</span>
            <input className="input" placeholder="Set de Base" value={set} onChange={(e) => setSet(e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-500 dark:text-slate-400">Numéro (option.)</span>
            <input className="input" placeholder="4/102 ou 1 sur 104" value={number} onChange={(e) => setNumber(e.target.value)} />
          </label>
          <button type="submit" className="btn-primary h-[38px]" disabled={busy}>
            {busy ? 'Recherche…' : '🔎 Rechercher'}
          </button>
        </form>
        {note && (
          <p className="mt-2 flex items-center gap-2 text-xs text-amber-500">
            {note}
            <button onClick={addManual} className="underline">
              Ajouter « {name} » à la main
            </button>
          </p>
        )}

        {/* Résultats de recherche : on clique sur la bonne carte */}
        {results && results.length > 0 && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/40">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {results.length} résultat(s) — clique sur ta carte
              </p>
              <button onClick={() => setResults(null)} className="text-xs text-slate-400 hover:text-rose-500">
                Fermer
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => choose(r)}
                  disabled={adding !== null}
                  className="group rounded-lg p-1 text-left transition hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
                  title={`${r.name} (${r.setId} · ${r.localId ?? '?'})`}
                >
                  <div className="flex aspect-[63/88] items-center justify-center overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                    {r.image ? (
                      <img src={r.image} alt={r.name} className="h-full w-full object-contain" loading="lazy" />
                    ) : (
                      <span className="text-2xl">🃏</span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs font-medium">{r.name}</p>
                  <p className="truncate text-[10px] text-slate-400">
                    {r.setId} · n°{r.localId ?? '?'}
                  </p>
                  {adding === r.id && <p className="text-[10px] text-brand">Ajout…</p>}
                </button>
              ))}
            </div>
          </div>
        )}

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
                <div className="mt-1 flex gap-3 text-xs">
                  {c.url && (
                    <a href={c.url} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                      Cardmarket ↗
                    </a>
                  )}
                  {c.tcgUrl && (
                    <a href={c.tcgUrl} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                      TCGplayer ↗
                    </a>
                  )}
                </div>
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
