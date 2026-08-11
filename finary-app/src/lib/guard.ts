/**
 * guard.ts — accès réservé au compte unique, via la page d'accueil.
 *
 * Les quatre sites (Home, Series, Simu-SCI, Finance) sont servis par la même
 * origine, https://bulojs.github.io, et partagent donc le même localStorage.
 * Comme ils visent le même projet Supabase, la session ouverte sur Home est
 * lue ici par le même client : aucune seconde connexion n'est demandée.
 *
 * Appelé au tout début de main.tsx, avant le rendu de l'application.
 *
 * LIMITE : un site statique reste téléchargeable. Cette garde empêche l'accès
 * direct par l'URL dans un navigateur, pas quelqu'un qui irait chercher les
 * fichiers à la main. Ce sont les règles RLS de la base qui protègent
 * réellement les données.
 */

import { supabase } from './supabase';

/** Page d'accueil, vers laquelle renvoyer si aucune session n'est trouvée. */
const HOME_PATH = '/Home/';

/**
 * Exiger que la double authentification ait été franchie (niveau « aal2 »).
 * Sans cela, une session arrêtée à l'étape du code à 6 chiffres sur Home —
 * donc ouverte avec le mot de passe seul — suffirait à entrer ici.
 * À passer à false uniquement si la 2FA est retirée du compte.
 */
const REQUIRE_AAL2 = true;

const BOUNCE_KEY = 'guard:bounces';
const MAX_BOUNCES = 3;

function reveal() {
  document.documentElement.style.visibility = '';
  sessionStorage.removeItem(BOUNCE_KEY);
}

/** Affiche un message plein écran plutôt que de boucler indéfiniment. */
function stop(text: string) {
  document.documentElement.style.visibility = '';
  document.body.innerHTML = '';
  const p = document.createElement('p');
  p.style.cssText =
    'max-width:34rem;margin:22vh auto;padding:0 1.5rem;text-align:center;' +
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;" +
    'font-size:1rem;line-height:1.5;color:#aeb0b6';
  p.textContent = text;
  document.body.appendChild(p);
}

function redirectToHome() {
  // Compteur anti-aller-retour : si Home nous renvoie ici alors que la session
  // est toujours refusée, on s'arrête au lieu de boucler.
  const bounces = Number(sessionStorage.getItem(BOUNCE_KEY) ?? 0) + 1;
  if (bounces > MAX_BOUNCES) {
    sessionStorage.removeItem(BOUNCE_KEY);
    stop("Connexion impossible. Ouvre la page d'accueil pour te connecter, puis reviens.");
    return;
  }
  sessionStorage.setItem(BOUNCE_KEY, String(bounces));

  const next = window.location.pathname + window.location.search + window.location.hash;
  window.location.replace(`${HOME_PATH}?next=${encodeURIComponent(next)}`);
}

/**
 * Vérifie la session. Renvoie true si l'application peut être rendue,
 * false si l'utilisateur a été redirigé ou si l'accès est refusé.
 */
export async function ensureAccess(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error(error.message);

    const session = data.session;
    if (!session) {
      redirectToHome();
      return false;
    }

    if (REQUIRE_AAL2) {
      const { data: aal, error: aalError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalError) throw new Error(aalError.message);
      if (aal.currentLevel !== 'aal2') {
        redirectToHome();
        return false;
      }
    }

    reveal();
    return true;
  } catch (error) {
    // Réseau coupé, projet en pause : on refuse l'accès plutôt que d'afficher
    // le contenu par accident.
    stop(`Vérification de la session impossible : ${(error as Error).message}`);
    return false;
  }
}
