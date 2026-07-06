# TASKS — à vérifier avant de continuer

Note laissée le 2026-07-03. Pas un backlog complet, juste l'état des lieux du moment pour le prochain dev (humain ou agent) qui reprend le projet.

## Où on en est

- Le chatbot widget (Phase 6 — `apps/widget`, route `POST /widget/chat`) a été construit et mergé sur `claude/workplace-repo-review-owicsn`.
- En le construisant, on a découvert que **la base de données de prod (Supabase, projet `Next Level - CAN`) est désynchronisée du repo** : la prod a 18 migrations appliquées via Supabase CLI directement (jamais commitées ici), alors que ce repo n'avait qu'une seule migration Drizzle (`0000_previous_maggott.sql`) avant qu'on en ajoute une deuxième (`0001_unusual_valkyrie.sql`, générée pour `widget_messages`).
- Réconciliation en cours (sur le poste local d'Edouard, pas dans cet environnement) : Docker + WSL2 installés, Supabase CLI lié au projet, historique de migrations réparé (`migration repair`), et un premier `supabase db pull` a réussi à générer un fichier `20260703012929_remote_schema.sql` qui reflète l'état réel de la prod.
- **Ce fichier n'est pas encore dans le repo GitHub** — il est resté sur l'ordi local (mauvais dossier, hors du clone du projet). Rien n'a été poussé depuis cette étape.

## ⚠️ Ce qui va probablement crasher tel quel

- **`POST /widget/chat` va planter en prod** dès qu'un visiteur écrit un message : la route fait `tx.insert(schema.widgetMessages)`, mais la table `widget_messages` n'existe presque certainement pas dans la vraie base Supabase (elle n'existe que dans la migration `0001` du repo, jamais appliquée à la prod réelle).
- **Ne pas rouler `pnpm db:migrate` ou `db:push` contre la prod** sans avoir d'abord fini la réconciliation ci-dessus — le repo et la prod n'ont pas la même notion de "quelles migrations sont déjà appliquées", donc ça peut échouer ou dupliquer des choses.

## À faire (à évaluer — corriger ou non selon priorité)

1. Finir de ramener `20260703012929_remote_schema.sql` dans le repo (dans un dossier `supabase/migrations/`), pour que `packages/db/src/schema/*.ts` puisse être corrigé pour matcher la vraie structure de prod (elle a des tables absentes du schéma actuel : `calendar_events`, `user_events`, `admin_notes`, etc.).
2. Une fois réconcilié, créer et appliquer une migration ciblée et minimale pour ajouter `widget_messages` à la vraie base de prod (à la main via SQL Editor ou via Supabase CLI — pas via Drizzle tant que la réconciliation n'est pas faite).
3. Décider d'une seule source de vérité pour les migrations futures (recommandé : Supabase CLI, puisque la prod l'utilise déjà depuis 18 migrations) pour ne pas répéter ce problème.
