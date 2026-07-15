import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  /** Connexion email + mot de passe. */
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  /** Création du compte (une seule fois). */
  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    // Si la confirmation email est désactivée dans Supabase, la session est immédiate.
    return { needsConfirmation: !data.session };
  };

  const signOut = () => supabase.auth.signOut();

  return {
    session,
    user: session?.user ?? null,
    userId: session?.user?.id ?? null,
    loading,
    signIn,
    signUp,
    signOut,
  };
}
