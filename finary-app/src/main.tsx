import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ensureAccess } from './lib/guard'

// L'accès est réservé au compte unique : sans session complète ouverte depuis
// la page d'accueil, l'application n'est pas rendue et le visiteur y est
// renvoyé. La page reste masquée par index.html jusqu'à cette vérification.
ensureAccess().then((autorise) => {
  if (!autorise) return

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
