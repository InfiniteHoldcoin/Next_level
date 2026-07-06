# Rapport d'audit — Organisation des agents UpFlow
> Préparé le 2026-07-06 pour Edouard & Philip.
> Session Claude (mobile) — lecture complète de `infiniteholdcoin/next_level`
> et `infiniteholdcoin/nextlevel-workspace`.

---

## TL;DR

1. **Le système pyramidal que vous cherchez existe déjà en grande partie** dans
   `nextlevel-workspace` — et il est bon. ~13 loops actifs, mémoire partagée,
   journaux, skills, hook git. Le problème n'est pas l'absence de structure.
2. **Le vrai problème n° 1 : le repo `next_level` est un fork mort** (dernier
   vrai commit : 22 mai). Tout le code réel vit dans
   `nextlevel-workspace/nextlevel/`, mis à jour aujourd'hui même. Avoir deux
   copies divergentes du produit est la source principale de confusion.
3. **Le vrai problème n° 2 (corrigé après retour d'Edouard, 2026-07-06) : les
   Routines cloud tournent, mais la chaîne de livraison est à l'arrêt.**
   Les loops DEV-A/B/C tournent depuis le terminal local d'Edouard — sans
   crédits terminal, aucune livraison depuis 5 jours. Sans livraison, rien ne
   déclenche l'Inspecteur QA (fire par le dev loop), donc QUALITY-LOG reste
   vide, donc la Rétrospective n'a rien à analyser. Le silence du CEO-JOURNAL
   s'explique aussi par la règle n° 6 (« écrire seulement si changement
   réel »). S'ajoutent : `RESEND_API_KEY` introuvable (4 jours d'échecs
   d'email Standup — bien réel, commits à l'appui) et la Rétrospective qui
   n'a jamais réussi un run (cause probable identifiée, voir §2-C).
4. **Le vrai problème n° 3 : structure d'agents incohérente** — 3 agents ont
   une définition formelle (`.claude/agents/*.yaml`), les ~10 autres ne sont
   que des prompts planifiés. C'est ÇA qui rend « ajouter/retirer un agent »
   pénible, pas la forme de la pyramide.

---

## 1. Inventaire — ce qui existe réellement

### Repo `infiniteholdcoin/nextlevel-workspace` (LE repo vivant — dernier commit : aujourd'hui)

**L'équipe d'agents (voir `EQUIPE.md`, document fondateur) :**

| Agent | Rôle | Cadence | Définition formelle ? |
|---|---|---|---|
| DEV-A | Dev principal (Build→Test→Ship) | `/loop` terminal | Non — `LOOP-AUTONOME.md` |
| DEV-B | Dev parallèle | `/loop` terminal | Non — `LOOP-AUTONOME-B.md` |
| DEV-C | Design/UX-UI | `/loop` terminal | Non — `LOOP-AUTONOME-C.md` |
| CEO Queue Optimizer | PM, optimise la queue | Chaque heure | Non — `CEO-LOOP.md` |
| CEO Market Intel | Veille stratégique | Quotidien 04h UTC | Non — `CEO-LOOP.md` |
| Co-CEO | Santé technique, légal, croissance | Hebdo vendredi | **Oui** — `co_ceo.yaml` |
| Design Director | Génère les tâches design | Quotidien 06h | **Oui** — `design_director.yaml` |
| Sentinelle | Veille concurrentielle élargie | Hebdo dimanche | **Oui** — `sentinelle_crm_ia.yaml` |
| Archiviste | Snapshot `CONTEXT.md` | Nuit 01h | Non — `ARCHIVISTE-LOOP.md` |
| Inspecteur QA | Re-teste après chaque livraison | Fire par dev loop | Non — `QA-LOOP.md` |
| Standup | Email matinal à Edouard | Quotidien 08h EST | Non — `STANDUP-LOOP.md` |
| Rétrospective | Leçons hebdo, met à jour EQUIPE.md | Hebdo lundi | Non — `RETROSPECTIVE-LOOP.md` |
| Scalable Expert | Conseiller croissance | Hebdo samedi | Non — `SCALABLE-EXPERT-LOOP.md` |
| Watchdog | Gardien de prod | Chaque heure | Non — `WATCHDOG-LOOP.md` |

**Mémoire partagée :** `TASKS.md` (queue bornée à 8), `CONTEXT.md` (snapshot
nocturne), `CEO-JOURNAL.md`, `CO-CEO-JOURNAL.md`, `LESSONS-LEARNED.md`,
`DESIGN-LOG.md`, `QUALITY-LOG.md`, `VEILLE-CONCURRENTS.md` + **mémoire
vectorielle pgvector** (ingestion nocturne, recherche sémantique).

**Outillage Claude Code déjà en place :** 2 skills (`upflow-task`,
`agent-capability-card`), 1 hook (`pretooluse-git-push-gate.mjs`),
`settings.json`.

**Aussi dans ce repo :** `NextLevel-Vault/` (stratégie, roadmap, finance),
`nextlevel/` (le VRAI code produit), archive shopassist, configs, scripts.

### Repo `infiniteholdcoin/next_level` (fork mort)

Copie du monorepo produit figée au **22 mai 2026**. Il lui manque ~6 semaines
de travail : routes API (agents, billing, calendar, contacts, approvals,
automations, pipeline, gmail, integrations, memory…), des sections entières
du dashboard et de l'admin, le middleware, la mémoire pgvector, etc.

> Dans cette session, j'avais d'abord construit un échafaudage d'agents
> inventé (« chief-of-engineering », etc.) dans ce repo mort, avant d'avoir
> accès au vrai système. **Annulé (revert)** aujourd'hui — il ne correspondait
> à rien de réel.

---

## 2. Les actions urgentes (avant toute réorganisation)

> Mise à jour 2026-07-06 après retour d'Edouard : les Routines tournent bien
> — sauf deux. Inspecteur QA n'a encore jamais tourné (normal : il est
> déclenché par les livraisons du dev loop, et il n'y en a pas eu ; démarrage
> prévu ce soir 22h). Rétrospective n'a **jamais** réussi un run.

### 🔴 A. RESEND_API_KEY introuvable — 4 jours d'échecs d'email
Le Standup matinal échoue depuis 4 jours consécutifs (commits d'erreur dans
le repo). → **Action Edouard :** remettre la clé dans l'environnement
d'exécution des Routines (Settings → Environments → variables).

### 🔴 B. Chaîne de livraison à l'arrêt — dépend des crédits terminal
DEV-A/B/C tournent en local (`/loop` dans le terminal d'Edouard). Sans
crédits, pas de livraisons → pas de QA → pas de données pour la Rétro.
→ **Décision Edouard/Philip :** soit renouveler les crédits terminal, soit
migrer les dev loops vers des Routines cloud (même mécanique, mais il faudra
gérer la policy réseau du sandbox — voir TASK-017 ci-dessous).

### 🔴 C. Rétrospective — cause probable de l'échec permanent identifiée
`RETROSPECTIVE-LOOP.md` ÉTAPE 4 contient un bloc **PowerShell** (`$env:TEMP`,
`Get-Date -Format`, continuations avec backticks) écrit pour un environnement
**Windows** — mais les Routines s'exécutent dans un conteneur **Linux**. Un
agent qui suit ces instructions à la lettre échoue à l'étape d'écriture de
LESSONS-LEARNED.md. Incohérence secondaire : l'en-tête du fichier dit
« Lundi 03h UTC (cron 0 3 * * 1) » alors qu'EQUIPE.md dit « hebdo lundi
22h00 » — et Edouard indique qu'elle se déclenche par appel API. À aligner.
→ **Fix simple :** remplacer le bloc PowerShell par l'équivalent bash (ou
laisser l'agent utiliser git directement puisqu'il tourne dans un clone du
repo). Je peux préparer ce correctif — il touche `RETROSPECTIVE-LOOP.md`
dans `nextlevel-workspace`, donc je ne le pousse qu'avec votre accord.

### 🟡 D. TASK-017 gelée — décision requise
Bloquée 2 tentatives sur la validation des critères (politique réseau du
sandbox qui bloque *.vercel.app / *.up.railway.app, pas un bug produit).
→ **Action Edouard :** élargir la policy réseau de l'environnement, ou
valider manuellement AC1/AC3. Cette même policy réseau sera un prérequis si
les dev loops migrent en cloud (voir B).

---

## 3. Recommandations de réorganisation

### R1 — Régler le sort du repo `next_level` (le plus gros gain de clarté)

Options, de la plus simple à la plus propre :

- **a) Archiver `next_level`** (GitHub → Settings → Archive) avec un README
  « ⚠️ Déprécié — le code vit dans nextlevel-workspace/nextlevel/ ». Zéro
  risque, 5 minutes, élimine immédiatement la source de confusion.
- **b) (Plus tard, optionnel) Sortir le code produit du workspace** vers un
  repo produit dédié, et garder `nextlevel-workspace` purement « compagnie »
  (agents, loops, vault, journaux). C'est la séparation la plus propre
  — mais c'est un chantier (URLs de déploiement Railway/Vercel, chemins dans
  les loops, CI). À ne faire que quand le système tourne de façon stable.

**Recommandation : (a) maintenant, (b) un jour, pas les deux en même temps.**

### R2 — Uniformiser la définition des agents (le vrai « pyramide facile à étendre »)

Aujourd'hui : 3 agents en `.claude/agents/*.yaml`, ~10 en simples fichiers
`*-LOOP.md`, et `EQUIPE.md` qui tient l'inventaire à la main. Pour qu'ajouter/
retirer/renommer un agent devienne mécanique :

- **Une fiche par agent** dans `.claude/agents/` (yaml ou md avec frontmatter),
  même les loops « prompt planifié » : rôle, cadence, modèle, fichiers lus/
  écrits, budget tokens, à qui il rapporte, ID de trigger.
- **`EQUIPE.md` devient un index généré/validé** à partir de ces fiches (le
  skill `agent-capability-card` existe déjà et fait la moitié du travail).
- **Documenter la procédure** « ajouter / retirer / renommer un agent » en 5
  étapes dans EQUIPE.md. C'est exactement le point douloureux mentionné.

### R3 — Formaliser la pyramide SANS casser ce qui marche

La vision (Edouard + Philip au-dessus, qui nourrissent ; AI CEO qui priorise
et redistribue ; managers ; spécialistes) se mappe presque 1:1 sur l'existant :

```
Edouard + Philip  (humains, hors pyramide — nourrissent le système)
      │  → déjà en place : Vault/80-Inspiration/ (dépôt manuel d'idées/liens)
      ▼
AI CEO = CEO Queue Optimizer + CEO Market Intel   (priorise, organise, redistribue)
      │        (+ Co-CEO comme contradicteur/consolidateur hebdo)
      ▼
┌────────────────┬──────────────────────┬───────────────────┐
│ Manager DEV    │ Manager MARKETING    │ Manager FINANCE   │
│ = Architecte*  │ = à nommer parmi     │ = à créer (Vault/ │
│ (TASK-013,     │   Sentinelle/Market  │   finance/ existe │
│  à implémenter)│   Intel/Content*     │   déjà comme base)│
├────────────────┼──────────────────────┼───────────────────┤
│ DEV-A DEV-B    │ Sentinelle (veille)  │ (futur : suivi    │
│ DEV-C + QA +   │ Content Creator*     │  dépenses, ROI,   │
│ Watchdog       │ Design Director      │  légal via Co-CEO)│
└────────────────┴──────────────────────┴───────────────────┘
             * = déjà planifié dans EQUIPE.md, pas encore construit
```

Autrement dit : **la pyramide est un ré-étiquetage + 2-3 créations ciblées**
(Architecte comme « manager dev », un manager marketing, un embryon finance),
pas une reconstruction. Le CEO-JOURNAL du 1er juillet le dit lui-même : *ne
pas construire de nouvel agent avant que la queue de base tourne fiablement.*

### R4 — Canal d'entrée pour Edouard ET Philip

`Vault/80-Inspiration/` existe déjà comme boîte de dépôt (idées, liens,
articles) lue par CEO Daily / Co-CEO / Sentinelle. À faire :
- vérifier que Philip a bien accès en écriture au repo et connaît ce dossier ;
- convenir d'un format minimal (1 fichier md par idée, ou 1 section datée) ;
- optionnel : un loop léger « Intake » qui transforme chaque dépôt en
  proposition de tâche pour le CEO au lieu d'attendre sa lecture quotidienne.

---

## 4. Ordre d'exécution proposé

1. **Aujourd'hui (Edouard, 15 min)** : RESEND_API_KEY + décision crédits
   terminal vs dev loops cloud + fix Rétrospective (§2). La chaîne de
   livraison doit d'abord recommencer à tourner.
2. **Cette semaine** : archiver `next_level` (R1a). Une phrase dans EQUIPE.md
   pour annoncer la décision.
3. **Semaine prochaine** : fiches d'agents uniformes + procédure
   ajouter/retirer (R2) — c'est du travail de documentation, faisable par un
   loop ou une session dédiée, sans toucher aux loops actifs.
4. **Ensuite seulement** : ré-étiquetage pyramide + Architecte-manager (R3)
   et canal Philip (R4).

---

## 5. Ce que cette session ne pouvait pas faire

- Modifier `LOOP-AUTONOME*.md` / `LOOP-CONFIG.md` — règle d'équipe n° 4 :
  Edouard seulement.
- Vérifier l'état des Routines ou des variables d'environnement — accessible
  uniquement depuis ton compte claude.ai / Railway / Vercel.
- Toucher au workspace vivant sans votre validation — ce rapport est le
  livrable ; les changements se font après votre lecture, idéalement depuis
  une session ouverte directement sur `nextlevel-workspace`.
