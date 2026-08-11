import { createClient } from '@supabase/supabase-js';

/**
 * Configuration Supabase.
 * L'URL et la clé « anon » sont publiques par conception (embarquées côté
 * navigateur) : la sécurité repose sur les règles RLS de la base, pas sur le secret
 * de la clé. Il est donc normal qu'elles figurent dans le code.
 *
 * Projet partagé avec Home, Series et Finance depuis la mise en place du
 * compte unique : les quatre sites étant servis par la même origine et visant
 * le même projet, la session ouverte sur Home est reconnue ici sans nouvelle
 * connexion.
 */
const SUPABASE_URL = 'https://pyduueytagmzsdwtzltu.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5ZHV1ZXl0YWdtenNkd3R6bHR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NTU0ODcsImV4cCI6MjEwMjAzMTQ4N30.6Fl5gkIDF8Vie2o8IRKWSYCFVpTIRw5LSXVHW5TalQk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/** Table qui stocke tout le patrimoine d'un utilisateur dans une colonne JSONB. */
export const PORTFOLIO_TABLE = 'portfolios';
