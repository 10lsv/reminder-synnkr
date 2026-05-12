# BRIEF — Echo

> Lire intégralement ce document avant de proposer du code. Ne dévier de la DA et de la stack qu'avec validation explicite.

---

## 1. Vision produit

### Pitch
Les rappels iPhone natifs échouent parce qu'ils sont **dissociés de l'intention initiale de l'utilisateur**. Echo transforme chaque rappel en **message de l'utilisateur passé à l'utilisateur présent**, créant une connexion émotionnelle qui rend l'ignorance coûteuse.

### Différenciation
- À la création, l'utilisateur écrit un message **en s'adressant à lui-même** (pas un titre + description générique)
- La notification push système n'affiche que `Echo · {heure}` — **aucun aperçu du contenu**. Cela force l'ouverture de l'app pour découvrir le message.
- L'action "Plus tard" exige une **raison textuelle saisie au clavier** (min 10 caractères). Ces raisons sont archivées et présentées dans le dashboard.
- Le dashboard reprend la structure visuelle de Sub Synnkr : compteur principal, sections labellisées en uppercase, accent violet en touche.

### Audience cible
Usage personnel et cercle proche (étudiants, amis). Pas de commercial grand public en v1.

### Scope MVP (v1.0)
- Authentification simple (email + password)
- Création de rappels texte avec date/heure
- Envoi de push notifications web à l'heure programmée
- Écran de rappel actif avec actions "Fait" / "Plus tard"
- Saisie obligatoire d'une raison sur snooze
- Dashboard avec liste des rappels actifs + journal des raisons de snooze
- PWA installable sur iOS et Android

### Hors scope v1.0 (reportés en v1.1+)
- Enregistrement audio
- Streaks et statistiques avancées
- Catégorisation des rappels
- Récurrence des rappels (sera dans v1.1)
- Partage entre utilisateurs

---

## 2. Direction artistique

La DA est **non-négociable**. Elle est issue d'un projet de référence appelé Sub Synnkr.

### Principes fondamentaux
- **Anti-skeuomorphisme radical** : aucune métaphore physique (lettre, papier, enveloppe, bouton 3D, ombre portée).
- **Whitespace dominant** : minimum 60% de blanc sur tout écran.
- **Flat absolu** : aucune ombre, aucun gradient, aucune texture.
- **Typographie comme héros** : les nombres et messages clés sont en très grand, le reste s'efface.

### Tokens de design

#### Couleurs

```css
:root {
  /* Fond et surfaces */
  --bg: #FFFFFF;
  --surface: #FFFFFF;
  --border: #EDEDED;
  --border-strong: #D4D4D4;

  /* Texte */
  --fg: #0A0A0A;
  --fg-secondary: #6B6B6B;
  --fg-tertiary: #A0A0A0;

  /* CTA principal */
  --cta-bg: #0A0A0A;
  --cta-fg: #FFFFFF;

  /* Accent (utilisé en touche uniquement, jamais en surface dominante) */
  --accent: #B8B0E0;
  --accent-strong: #9A8FD4;
  --accent-bg: #F2F0FA;

  /* États */
  --danger: #D32F2F;
  --success: #2E7D32;
}
```

#### Typographie

Police : **Inter** (variable, importée via `next/font`).

```css
--font-sans: 'Inter', system-ui, sans-serif;

/* Échelle */
--text-xs: 11px;     /* labels uppercase */
--text-sm: 13px;     /* secondaires */
--text-base: 15px;   /* body */
--text-lg: 17px;     /* titres de carte */
--text-xl: 22px;     /* titre de page */
--text-2xl: 28px;    /* titre principal */
--text-hero: 48px;   /* chiffre dashboard */
--text-message: 36px; /* message rappel actif */

/* Poids */
--weight-regular: 400;
--weight-medium: 500;
--weight-semibold: 600;

/* Letter spacing */
--tracking-label: 0.08em;   /* pour labels uppercase */
--tracking-normal: 0em;
--tracking-tight: -0.02em;  /* pour grands chiffres */
```

#### Espacement et rayons

```css
/* Espacement (base 4) */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;

/* Rayons */
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;   /* cartes */
--radius-pill: 999px; /* boutons */
```

### Composants de base

#### Bouton primaire (CTA)
- Fond noir `--cta-bg`, texte blanc `--cta-fg`
- `border-radius: var(--radius-pill)` (forme pilule très arrondie)
- Padding `14px 24px`
- Font weight `500`, font size `15px`
- Pleine largeur par défaut sur mobile
- État hover : opacité 0.9, pas d'ombre

#### Bouton secondaire
- Fond transparent, texte `--fg-secondary`
- Pas de bordure, juste du texte cliquable
- Underline au hover

#### Input texte
- Bordure 1px `--border`
- `border-radius: var(--radius-pill)` (forme pilule)
- Padding `12px 16px`
- Placeholder `--fg-tertiary`
- Focus : bordure `--fg`, pas de glow

#### Carte
- Bordure 1px `--border`
- `border-radius: var(--radius-lg)` (16px)
- Padding interne `24px`
- Fond blanc
- **Aucune ombre**

#### Label de section
- Texte en MAJUSCULES
- `font-size: 11px`
- `letter-spacing: 0.08em`
- Couleur `--fg-tertiary`
- Souvent précédé d'un point coloré `●` en accent violet

#### Navigation bottom
- 5 items : Accueil, Calendrier, Liste, Stats, Réglages
- Icône Lucide (line-art, 24px) + label `12px`
- Item actif : icône dans un cercle violet pâle (`--accent-bg`)
- Pas de bordure top, juste une `border-top: 1px solid var(--border)`

### Icônes
Bibliothèque **Lucide React** (`lucide-react`). Style line-art uniformément. Stroke width par défaut.

### Animations
Minimalistes. Transitions de 150-200ms en `ease-out` sur les états (hover, focus, route change). Aucune animation flashy.

---

## 3. Stack technique

### Choix verrouillés

| Couche | Choix | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) | TypeScript strict |
| Style | Tailwind CSS v4 | Configurer les tokens en `@theme` |
| Composants | Custom (pas de shadcn) | La DA est trop spécifique pour shadcn out-of-the-box |
| Police | Inter via `next/font/google` | |
| Icônes | `lucide-react` | |
| Backend | Supabase | Auth + Postgres + Row Level Security |
| Push | Web Push API + VAPID | Service worker custom |
| Cron | Vercel Cron Jobs | Pour déclencher les notifications |
| Déploiement | Vercel | |
| Package manager | pnpm | |

### Variables d'environnement

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # Pour les routes serveur uniquement
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:contact@example.com
CRON_SECRET=                    # Bearer token pour authentifier Vercel Cron
```

---

## 4. Architecture

### Structure des dossiers

```
echo-app/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (app)/
│   │   ├── layout.tsx           # Layout avec nav bottom
│   │   ├── page.tsx             # Dashboard (Accueil)
│   │   ├── rappels/
│   │   │   ├── page.tsx         # Liste des rappels
│   │   │   ├── nouveau/
│   │   │   │   └── page.tsx     # Création
│   │   │   └── [id]/
│   │   │       └── page.tsx     # Détail/édition
│   │   ├── actif/
│   │   │   └── [id]/
│   │   │       └── page.tsx     # Écran rappel actif (Fait/Plus tard)
│   │   └── reglages/
│   │       └── page.tsx
│   ├── api/
│   │   ├── push/
│   │   │   ├── subscribe/route.ts
│   │   │   └── send/route.ts
│   │   └── cron/
│   │       └── dispatch/route.ts  # Appelé par Vercel Cron toutes les minutes
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # Composants DA (Button, Input, Card, Label...)
│   └── features/                 # Composants métier
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Client côté browser
│   │   └── server.ts             # Client côté serveur
│   ├── push/
│   │   ├── vapid.ts
│   │   └── send.ts
│   └── utils.ts
├── public/
│   ├── sw.js                     # Service worker
│   └── manifest.json
└── types/
    └── db.ts                     # Types générés depuis Supabase
```

---

## 5. Schéma de base de données

À exécuter dans Supabase SQL Editor.

```sql
-- Table profils utilisateurs (lié à auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

-- Table rappels
create table reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,                  -- Le message à toi-même
  scheduled_at timestamptz not null,      -- Heure de déclenchement
  status text not null default 'pending', -- 'pending' | 'done' | 'snoozed' | 'expired'
  done_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_reminders_user_status on reminders(user_id, status);
create index idx_reminders_scheduled on reminders(scheduled_at) where status = 'pending';

-- Table raisons de snooze (historique)
create table snooze_reasons (
  id uuid primary key default gen_random_uuid(),
  reminder_id uuid not null references reminders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  created_at timestamptz default now()
);
create index idx_snooze_user on snooze_reasons(user_id, created_at desc);

-- Table abonnements push
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  last_seen_at timestamptz default now(),
  created_at timestamptz default now()
);
create index idx_push_user on push_subscriptions(user_id);

-- Row Level Security
alter table profiles enable row level security;
alter table reminders enable row level security;
alter table snooze_reasons enable row level security;
alter table push_subscriptions enable row level security;

create policy "users read own profile" on profiles for select using (auth.uid() = id);
create policy "users update own profile" on profiles for update using (auth.uid() = id);

create policy "users crud own reminders" on reminders for all using (auth.uid() = user_id);
create policy "users crud own snooze reasons" on snooze_reasons for all using (auth.uid() = user_id);
create policy "users crud own push subs" on push_subscriptions for all using (auth.uid() = user_id);

-- Trigger pour créer un profil à la création de l'utilisateur
create function handle_new_user() returns trigger as $$
begin
  insert into profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

---

## 6. Écrans à construire

### 6.1 Login (`/login`)
- Logo centré (placeholder simple en SVG pour le moment)
- Titre "Echo" en grand
- Champ email (input pilule)
- Champ password (input pilule)
- Bouton "Se connecter" (CTA noir pilule)
- Lien discret "Créer un compte" en dessous

### 6.2 Dashboard / Accueil (`/`)
- En-tête : titre `Bonjour {prénom}`, sous-titre `{N} rappels en attente`
- Carte principale : compteur en hero size du nombre de rappels actifs du jour
- Section `PROCHAINS RAPPELS` (label uppercase + point violet) : liste des 3-5 prochains avec heure relative
- Section `TES EXCUSES` : 3 dernières raisons de snooze, listées en italique gris
- Nav bottom toujours visible

### 6.3 Liste rappels (`/rappels`)
- Titre `Tes rappels`
- Filtres tabs simples : `En attente` / `Faits` / `Tous`
- Liste cartes : message tronqué, heure programmée, statut
- FAB ou bouton "Nouveau rappel" en bas (pilule noire pleine largeur si peu d'items)

### 6.4 Création rappel (`/rappels/nouveau`)
- Titre `Nouveau rappel`
- Sous-titre instructif : `Écris-toi un message. Ton toi du futur le lira.`
- Textarea grande, pleine largeur, sans bordure marquée, placeholder type `Léo, t'avais promis...`
- Date picker minimaliste
- Heure picker
- Bouton CTA `Programmer` en bas

### 6.5 Détail/édition rappel (`/rappels/[id]`)
- Affichage du message, possibilité d'éditer
- Heure programmée
- Bouton supprimer (texte rouge discret)

### 6.6 Rappel actif (`/actif/[id]`)
**C'est l'écran le plus important. Soigner la composition.**

- Fond blanc total, aucun chrome
- Petit label `ECHO · {heure}` en haut
- Le message s'affiche en très grand (`--text-message: 36px`), centré verticalement, font-weight 500
- En bas, deux actions :
  - Bouton principal `Fait` (CTA noir pilule pleine largeur)
  - Lien `Plus tard` en dessous, en texte gris
- Au clic sur `Plus tard` : un input apparaît avec placeholder `Pourquoi pas maintenant ?` et compteur 10 caractères minimum. Bouton `Confirmer` une fois rempli.

### 6.7 Réglages (`/reglages`)
- Section `Notifications` : statut activé/désactivé + bouton `Activer` qui déclenche la souscription push
- Liste des appareils enregistrés avec date dernière utilisation + icône supprimer
- Section `Compte` : email + déconnexion

---

## 7. Notifications push

### Service worker (`public/sw.js`)
Doit gérer :
- `push` event : afficher la notification avec `title: "Echo"`, `body: "{heure}"` (volontairement opaque, sans contenu du message), `data: { reminderId }`
- `notificationclick` event : ouvrir `/actif/{reminderId}`

### Flow de souscription
1. Utilisateur va dans Réglages → clique "Activer"
2. Le client appelle `Notification.requestPermission()`
3. Si accordé, `serviceWorker.register('/sw.js')` puis `pushManager.subscribe({ applicationServerKey: VAPID_PUBLIC_KEY })`
4. Envoi de l'objet subscription à `POST /api/push/subscribe` qui l'enregistre en DB

### Dispatch via Vercel Cron
- Vercel Cron configuré pour exécuter `GET /api/cron/dispatch` toutes les minutes
- La route :
  1. Vérifie le header `Authorization: Bearer ${CRON_SECRET}`
  2. Query Supabase pour tous les `reminders` avec `status = 'pending'` et `scheduled_at <= now()`
  3. Pour chaque rappel, récupère les `push_subscriptions` de l'utilisateur
  4. Envoie le push via `web-push` (lib npm)
  5. Met à jour le rappel : ne change PAS le statut (il reste `pending` jusqu'à action utilisateur)

**Note iOS** : la PWA doit être installée à l'écran d'accueil pour que le push fonctionne. Ajouter un onboarding qui explique ça après le premier login.

### Configuration `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/cron/dispatch",
      "schedule": "* * * * *"
    }
  ]
}
```

---

## 8. PWA

### `public/manifest.json`
```json
{
  "name": "Echo",
  "short_name": "Echo",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#0A0A0A",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Lien dans `<head>` du layout racine.

---

## 9. Phases de développement

Suivre cet ordre strictement. À chaque fin de phase, l'utilisateur teste avant de passer à la suivante.

### Phase 1 — Bootstrap
Initialiser Next.js 15 + TypeScript + Tailwind v4 + pnpm. Configurer Inter via `next/font`. Créer le layout racine avec le token CSS du design system. Ajouter Supabase client (browser + server). Créer une page d'accueil placeholder. `pnpm dev` doit afficher un écran blanc avec un titre Inter.

### Phase 2 — Design system
Construire les composants UI atomiques : `Button` (primary/secondary), `Input`, `Textarea`, `Card`, `SectionLabel`. Créer une page interne `/dev` qui affiche tous les composants pour validation visuelle. Aucun composant ne doit avoir d'ombre, de gradient ou de skeuo. Tester sur mobile (375px) et desktop.

### Phase 3 — Auth + Layout
Implémenter le login Supabase. Créer le layout app avec nav bottom (5 items). Middleware Next.js pour rediriger non-authentifié vers `/login`. Tester déconnexion. La nav bottom doit visuellement matcher la référence Sub Synnkr.

### Phase 4 — CRUD rappels
Exécuter le schéma SQL en Supabase. Générer les types TypeScript. Construire les pages liste, création, détail/édition. Server actions pour créer/modifier/supprimer. Test : créer 3 rappels, les voir dans la liste, en éditer un, en supprimer un.

### Phase 5 — PWA + Push
Créer manifest et service worker. Implémenter le flow de souscription dans Réglages. Implémenter `POST /api/push/subscribe`. Implémenter la route `/api/cron/dispatch` avec auth bearer. Configurer Vercel Cron. Test : installer la PWA sur iPhone, activer les notifications, créer un rappel dans 2 minutes, vérifier la réception.

### Phase 6 — Écran rappel actif
Construire `/actif/[id]` selon spec section 6.6. Le clic sur la notification doit ouvrir directement cet écran. Implémenter l'action `Fait` (update status). Implémenter l'action `Plus tard` avec validation 10 caractères et enregistrement en `snooze_reasons`. Mettre à jour le dashboard pour afficher les dernières raisons.

---

## 10. Règles de qualité

- TypeScript strict, aucun `any` non justifié
- Server Components par défaut, Client Components uniquement quand nécessaire (état, événements)
- Server Actions pour toutes les mutations
- Validation Zod sur les entrées utilisateur côté serveur
- Pas de bibliothèque UI lourde (pas de Material-UI, pas de Chakra)
- Tests manuels obligatoires sur iPhone Safari à chaque phase
- Commits atomiques avec messages clairs en français ou anglais

---

## 11. Hors périmètre, à proposer comme questions à l'utilisateur

Si pendant le développement une des situations suivantes survient, demander avant de procéder :
- Ajout d'une dépendance npm non listée en section 3
- Modification d'un token de design
- Ajout d'une route non listée en section 4
- Modification du schéma DB
- Implémentation d'une feature listée hors-scope (récurrence, audio, streaks, etc.)