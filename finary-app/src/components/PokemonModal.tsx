import { useState } from 'react';
import { formatEur, uid } from '../lib/format';
import { searchPokemonCard } from '../lib/pokemon';
import type { PokemonCard } from '../types';
import { Sparkline } from './Sparkline';

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
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setNote(null);
    try {
      const match = await searchPokemonCard(name, number, set);
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
          },
        ]);
      } else {
        onChange([
          ...items,
          { id: uid(), name: name.trim(), set: set.trim(), number: number.trim(), price: 0 },
        ]);
        setNote('Carte non trouvée sur Cardmarket — ajoutée sans prix (saisis-le à la main si besoin).');
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
  const setPriceFor = (id: string, v: number) =>
    onChange(items.map((c) => (c.id === id ? { ...c, price: v } : c)));

  const total = items.reduce((s, c) => s + (c.price || 0) * 1, 0);

  const serie = (c: PokemonCard) =>
    [c.prices?.avg30, c.prices?.avg7, c.prices?.avg1, c.prices?.trend].filter(
      (v): v is number => typeof v === 'number',
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-5xl rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-2xl dark:border-slate-700 dark:bg-[#0d1017]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">🃏 Ma collection Pokémon</h2>
            <p className="text-xs text-slate-400">
              Valeur totale : {formatEur(total)} · {items.length} carte(s)
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost">
            Fermer ✕
          </button>
        </div>

        <form onSubmit={add} className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:items-end">
          <label className="text-sm">
            <span className="mb-1 block text-slate-500 dark:text-slate-400">Nom de la carte</span>
            <input className="input" placeholder="Charizard" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-500 dark:text-slate-400">Extension</span>
            <input className="input" placeholder="Base Set" value={set} onChange={(e) => setSet(e.target.value)} />
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
            {items.map((c) => {
              const s = serie(c);
              return (
                <div key={c.id} className="card relative p-3">
                  <button
                    onClick={() => remove(c.id)}
                    className="absolute right-2 top-2 z-10 text-slate-400 hover:text-rose-500"
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
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-semibold">{formatEur(c.price || 0)}</span>
                    {s.length >= 2 && <Sparkline data={s} width={70} height={26} />}
                  </div>
                  {!c.price && (
                    <input
                      className="input mt-2 py-1 text-right text-xs"
                      type="number"
                      step="any"
                      placeholder="valeur €"
                      onChange={(e) => setPriceFor(c.id, parseFloat(e.target.value) || 0)}
                    />
                  )}
                  {c.url && (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block text-xs text-brand hover:underline"
                    >
                      Voir sur Cardmarket ↗
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-4 text-center text-xs text-slate-400">
          Prix Cardmarket via l'API pokemontcg.io. La courbe reprend les moyennes 30 j / 7 j / 1 j / tendance.
        </p>
      </div>
    </div>
  );
}
