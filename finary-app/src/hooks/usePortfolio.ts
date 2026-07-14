import { useCallback, useEffect, useRef, useState } from 'react';
import { PORTFOLIO_TABLE, supabase } from '../lib/supabase';
import { emptyPortfolio, type Portfolio } from '../types';

const KEY = 'finary-portfolio-v1';

function loadLocal(): Portfolio {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyPortfolio;
    return { ...emptyPortfolio, ...(JSON.parse(raw) as Portfolio) };
  } catch {
    return emptyPortfolio;
  }
}

const hasData = (p: Portfolio) =>
  p.livrets.length > 0 || p.cto.length > 0 || p.crypto.length > 0;

/**
 * Patrimoine avec persistance :
 * - non connecté  -> localStorage
 * - connecté      -> Supabase (avec cache localStorage), migration du local au 1er login
 */
export function usePortfolio(userId: string | null) {
  const [portfolio, setPortfolio] = useState<Portfolio>(loadLocal);
  const [syncing, setSyncing] = useState(false);
  const loadedFor = useRef<string | null>(null);

  // Chargement depuis Supabase quand on se connecte
  useEffect(() => {
    if (!userId) {
      loadedFor.current = null;
      return;
    }
    let cancelled = false;
    (async () => {
      setSyncing(true);
      const { data, error } = await supabase
        .from(PORTFOLIO_TABLE)
        .select('data')
        .eq('user_id', userId)
        .maybeSingle();
      if (cancelled) return;

      const remote = (data?.data as Portfolio | undefined) ?? undefined;
      const local = loadLocal();

      if (!error && remote && hasData({ ...emptyPortfolio, ...remote })) {
        setPortfolio({ ...emptyPortfolio, ...remote });
      } else if (hasData(local)) {
        // Pas de données distantes -> on pousse le local (migration)
        await supabase
          .from(PORTFOLIO_TABLE)
          .upsert({ user_id: userId, data: local, updated_at: new Date().toISOString() });
        setPortfolio(local);
      } else {
        setPortfolio(emptyPortfolio);
      }
      loadedFor.current = userId;
      setSyncing(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Sauvegarde : cache local systématique + Supabase si connecté (débounce)
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(portfolio));
    if (!userId || loadedFor.current !== userId) return;
    const t = setTimeout(() => {
      void supabase
        .from(PORTFOLIO_TABLE)
        .upsert({ user_id: userId, data: portfolio, updated_at: new Date().toISOString() });
    }, 600);
    return () => clearTimeout(t);
  }, [portfolio, userId]);

  const update = useCallback(
    <K extends keyof Portfolio>(key: K, value: Portfolio[K]) =>
      setPortfolio((p) => ({ ...p, [key]: value })),
    [],
  );

  return { portfolio, setPortfolio, update, syncing };
}
