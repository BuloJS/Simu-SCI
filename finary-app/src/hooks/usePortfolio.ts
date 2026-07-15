import { useCallback, useEffect, useRef, useState } from 'react';
import { PORTFOLIO_TABLE, supabase } from '../lib/supabase';
import { emptyPortfolio, type Portfolio } from '../types';

const LEGACY_KEY = 'finary-portfolio-v1';
const scopeKey = (scope: string) => `finary-portfolio-${scope}`;

function loadScope(scope: string): Portfolio {
  try {
    let raw = localStorage.getItem(scopeKey(scope));
    // Compat : ancienne clé unique récupérée dans l'espace anonyme
    if (!raw && scope === 'anon') raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return emptyPortfolio;
    return { ...emptyPortfolio, ...(JSON.parse(raw) as Portfolio) };
  } catch {
    return emptyPortfolio;
  }
}

const hasData = (p: Portfolio) =>
  p.livrets.length > 0 ||
  p.cto.length > 0 ||
  p.crypto.length > 0 ||
  p.budget.length > 0;

/**
 * Persistance strictement cloisonnée :
 * - déconnecté -> espace « anon » (localStorage)
 * - connecté   -> Supabase (source de vérité), cache local par utilisateur
 * Aucune migration croisée : changer d'utilisateur change réellement les données.
 */
export function usePortfolio(userId: string | null) {
  const [portfolio, setPortfolio] = useState<Portfolio>(() => loadScope('anon'));
  const [syncing, setSyncing] = useState(false);
  const loadedFor = useRef<string | null>(null);
  const prevUserId = useRef<string | null>(null);

  // Chargement du bon jeu de données quand l'utilisateur change
  useEffect(() => {
    const scope = userId ?? 'anon';
    const prev = prevUserId.current;
    prevUserId.current = userId;
    let cancelled = false;

    if (!userId) {
      // Déconnexion : on remet tout à zéro et on efface le cache local
      if (prev) {
        localStorage.removeItem(scopeKey('anon'));
        localStorage.removeItem(LEGACY_KEY);
        setPortfolio(emptyPortfolio);
      } else {
        setPortfolio(loadScope('anon'));
      }
      loadedFor.current = 'anon';
      return;
    }

    (async () => {
      setSyncing(true);
      const { data, error } = await supabase
        .from(PORTFOLIO_TABLE)
        .select('data')
        .eq('user_id', userId)
        .maybeSingle();
      if (cancelled) return;

      const remote = data?.data as Portfolio | undefined;
      if (!error && remote) {
        setPortfolio({ ...emptyPortfolio, ...remote });
      } else if (error) {
        // hors-ligne / erreur : on retombe sur le cache de CET utilisateur
        setPortfolio(loadScope(scope));
      } else {
        setPortfolio(emptyPortfolio); // pas encore de ligne distante
      }
      loadedFor.current = scope;
      setSyncing(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Sauvegarde : uniquement dans le périmètre déjà chargé (évite toute contamination)
  useEffect(() => {
    const scope = userId ?? 'anon';
    if (loadedFor.current !== scope) return;

    localStorage.setItem(scopeKey(scope), JSON.stringify(portfolio));

    if (userId) {
      const t = setTimeout(() => {
        void supabase.from(PORTFOLIO_TABLE).upsert({
          user_id: userId,
          data: portfolio,
          updated_at: new Date().toISOString(),
        });
      }, 600);
      return () => clearTimeout(t);
    }
  }, [portfolio, userId]);

  const update = useCallback(
    <K extends keyof Portfolio>(key: K, value: Portfolio[K]) =>
      setPortfolio((p) => ({ ...p, [key]: value })),
    [],
  );

  return { portfolio, setPortfolio, update, syncing, hasData };
}
