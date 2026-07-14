import { useEffect, useRef, useState } from 'react';
import { searchSymbols, type SymbolResult } from '../lib/stocks';

/**
 * Champ de recherche avec autocomplétion des vrais noms boursiers (Twelve Data).
 * Appelle onSelect quand l'utilisateur choisit une valeur.
 */
export function SymbolSearch({
  apiKey,
  onSelect,
}: {
  apiKey: string;
  onSelect: (r: SymbolResult) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SymbolResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Fermer le menu au clic extérieur
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Recherche débounced
  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    const t = setTimeout(async () => {
      try {
        const r = await searchSymbols(q, apiKey);
        setResults(r);
        setOpen(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur de recherche');
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query, apiKey]);

  const choose = (r: SymbolResult) => {
    onSelect(r);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative">
      <input
        className="input"
        placeholder="Rechercher une action / ETF (nom ou ticker)…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {loading && (
        <span className="absolute right-3 top-2.5 text-xs text-slate-400">…</span>
      )}

      {open && (results.length > 0 || error) && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {error && <li className="px-3 py-2 text-sm text-rose-500">{error}</li>}
          {results.map((r) => (
            <li key={`${r.symbol}-${r.exchange}-${r.country}`}>
              <button
                type="button"
                onClick={() => choose(r)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className="min-w-0">
                  <span className="font-medium">{r.symbol}</span>
                  <span className="ml-2 truncate text-slate-500">{r.name}</span>
                </span>
                <span className="shrink-0 text-xs text-slate-400">
                  {r.exchange} · {r.currency}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
