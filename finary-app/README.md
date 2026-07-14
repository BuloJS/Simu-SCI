# Patrimoine — Tableau de bord type Finary

Application web (from scratch) qui met en valeur vos actifs financiers, avec des
onglets **Livrets / CTO / Crypto**, l'ajout manuel de lignes, et le calcul des
rendements.

## Stack

Techno standard pour ce type de dashboard (celle utilisée par Finary) :

- **React 19 + TypeScript** (via **Vite**)
- **Tailwind CSS** (dark mode natif)
- **Recharts** (donut de répartition)
- Persistance locale via **localStorage** (branchable sur un backend + PostgreSQL plus tard)
- Cours crypto en temps réel via l'API publique **CoinGecko** (gratuite, sans clé)

## Fonctionnalités

- **Synthèse** : patrimoine total, revenus passifs annuels, plus-value latente, taux moyen pondéré
- **Répartition** en donut (Livrets / CTO / Crypto)
- **Onglet Livrets** : taux réglementés français pré-remplis et modifiables
  (Livret A 1,5 %, LDDS 1,5 %, LEP 2,5 %, CEL 1 %, PEL 2 %…), en vigueur au
  1er février 2026 — source [economie.gouv.fr](https://www.economie.gouv.fr/actualites/epargne-reglementee-de-nouveaux-taux-pour-le-livret-et-le-lep-au-1er-fevrier-2026)
- **Onglet CTO** : actions/ETF avec quantité, PRU, cours, valeur et +/- value
- **Onglet Crypto** : quantité + PRU, cours récupérés en direct (bouton « Cours live »)
- Ajout manuel sur chaque onglet, suppression de lignes
- Thème clair / sombre

## Démarrer

```bash
cd finary-app
npm install
npm run dev      # http://localhost:5173
npm run build    # build de production dans dist/
npm run preview  # prévisualise le build
```

## Structure

```
src/
  App.tsx                 layout, onglets, synthèse
  types.ts                modèles (Livret, CtoLine, CryptoLine)
  data/rates.ts           taux réglementés + presets crypto (ids CoinGecko)
  lib/
    format.ts             formats € et %
    compute.ts            calculs de totaux et rendements
    crypto.ts             récupération des cours CoinGecko
  hooks/
    usePortfolio.ts       état + persistance localStorage
    useDarkMode.ts        thème clair/sombre
  components/
    SummaryCards.tsx  AllocationDonut.tsx
    LivretTab.tsx  CtoTab.tsx  CryptoTab.tsx
```

## Prochaines étapes possibles

- Backend (Node/NestJS ou Python) + base PostgreSQL pour multi-appareils
- Cours des actions/ETF en direct (API type Twelve Data / Yahoo Finance)
- Historique et courbe d'évolution du patrimoine
- Intégration du simulateur SCI existant (`../index.html`)
