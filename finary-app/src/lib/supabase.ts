import { createClient } from '@supabase/supabase-js';

/**
 * Configuration Supabase.
 * L'URL et la clé « publishable » sont publiques par conception (embarquées côté
 * navigateur) : la sécurité repose sur les règles RLS de la base, pas sur le secret
 * de la clé. Il est donc normal qu'elles figurent dans le code.
 */
const SUPABASE_URL = 'https://auxgbubbtfvriysagnwr.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_I9zzHqoXOfNbBqw_mjZdnQ_4j3iNR4Z';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/** Table qui stocke tout le patrimoine d'un utilisateur dans une colonne JSONB. */
export const PORTFOLIO_TABLE = 'portfolios';
