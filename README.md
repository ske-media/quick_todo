# Quick Todo — To-Do List / Time Tracker

Une WebApp mobile-first de gestion de tâches et de suivi du temps, pensée comme un
outil de productivité premium en **Dark Mode** avec accent orange.

Construite avec **React + Vite + TypeScript**, **Tailwind CSS v4**, **Zustand**
(state + persistance LocalStorage), **Framer Motion** (animations) et
**lucide-react** (icônes).

## Fonctionnalités

- **Missions (dossiers)** : créez des missions et suivez leur progression.
- **Gestion de mission** : ajoutez des tâches avec un temps alloué (minutes),
  réordonnez-les (flèches haut/bas), puis lancez la mission.
- **Focus Mode** : interface plein écran ultra-épurée avec un timer massif.
  - Compte à rebours selon le temps alloué.
  - Au dépassement : **alarme sonore** (générée via `AudioContext`) puis bascule
    automatique en **chronomètre** qui mesure le dépassement.
  - **Pause** : modale avec motifs obligatoires (clope, pipi, souhaitée) +
    « Arrêt et reprise plus tard » qui sauvegarde l'état et revient à l'accueil.
  - Transition **« Space Travelling »** (warp/zoom/fondu) entre chaque tâche.
- **Logs / Rapports** : historique complet, temps alloué vs réel (avec
  dépassement) et détail des pauses (motif + durée).
- **Persistance** : données stockées dans une base **Supabase** (Postgres),
  partagée et **sans compte**, avec le LocalStorage en cache hors-ligne.

## Persistance des données (Supabase)

L'application persiste missions et tâches dans une base Postgres Supabase.

- Modèle **sans authentification** : un unique jeu de données partagé. L'accès
  est régi par des policies RLS permissives (rôle `anon`). C'est un compromis
  assumé : toute personne disposant de la clé publishable peut lire/écrire.
- Le **LocalStorage** sert de cache local et de repli hors-ligne. Au démarrage,
  l'app se réconcilie avec la base (la base est la source de vérité ; si elle est
  vide au premier lancement, le cache local est poussé vers la base).
- Écritures **best-effort** : une erreur réseau ne bloque jamais l'UI. Le temps
  écoulé (mis à jour chaque seconde) est envoyé en base de façon throttlée
  (toutes les ~10 s), et immédiatement aux moments clés (pause, validation, arrêt).

### Configuration

Les variables sont dans `.env` (voir `.env.example`) :

```bash
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxx
```

Le schéma SQL est versionné dans
[`supabase/migrations/`](supabase/migrations/). Si les variables sont absentes,
l'app fonctionne en mode LocalStorage uniquement.

## Démarrage

Prérequis : **Node.js 18+** et npm.

```bash
npm install
npm run dev
```

Ouvrez ensuite l'URL affichée (par défaut `http://localhost:5173`).

### Build de production

```bash
npm run build
npm run preview
```

## Structure

```
src/
  App.tsx                  # Layout + routing par état (Zustand)
  main.tsx                 # Point d'entrée React
  index.css                # Thème dark + utilitaires Tailwind v4
  types.ts                 # Types Mission / Task / Pause
  store/useStore.ts        # Store Zustand (persist LocalStorage)
  hooks/
    useTimer.ts            # Timer robuste (countdown -> chrono, sans fuite)
    useFullscreen.ts       # Wrapper Fullscreen API
  lib/
    audio.ts               # Alarme / beep via AudioContext
    format.ts              # Formatage durées & dates
  components/
    ui.tsx                 # Button, IconButton, Card, Modal, Toast
    MissionsPage.tsx       # Accueil (liste des missions)
    MissionPage.tsx        # Gestion d'une mission (tâches)
    FocusPage.tsx          # Focus Mode + timer + contrôles
    PauseModal.tsx         # Modale de pause (motifs)
    SpaceTravelTransition.tsx  # Animation de transition
    LogsPage.tsx           # Logs / rapports
```
