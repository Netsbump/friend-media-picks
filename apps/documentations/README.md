# Notes d'apprentissage : FP + Effect TS

Ce document sert de prise de notes pour comprendre les bases de la programmation fonctionnelle (FP) et leur application avec Effect TS.

## 1) Bases de la FP

- **Immutabilite**: on evite de modifier des objets en place.
- **Fonctions pures**: meme entree => meme sortie, sans effet de bord.
- **Composition**: on prefere assembler de petites fonctions simples.
- **Donnees explicites**: on modelise le domaine avec des types clairs.
- **Erreurs explicites**: on evite le throw implicite dans la logique metier.

## 2) Le type Effect

`Effect<A, E, R>` se lit comme:

- `A`: type de succes
- `E`: type d'erreur attendue
- `R`: dependances requises (services)

Exemple mental:

- `Effect<Serie, DomainError, never>`
  - produit une `Serie`
  - peut echouer avec `DomainError`
  - ne depend d'aucun service externe

## 3) Deux types d'erreurs (doc officielle)

- **Expected errors**: erreurs attendues, typees dans `E`.
- **Unexpected errors (defects)**: erreurs non prevues, hors du type `E`.

Dans l'API:

- `ValidationError`, `DomainError`, `SerieRepositoryError` = expected errors.
- bug runtime inattendu = defect.

## 4) Context.Tag et Layer

- `Context.Tag`: le contrat d'un service (ce que je veux).
- `Layer`: la construction d'un service (comment je le fournis).
- `Effect.provide(...)`: j'injecte les implementations.

Exemple actuel:

- `DbClient` est un service (Tag).
- `DbClientLive` construit ce service.
- `SerieRepoLive` depend de `DbClient`.

## 5) Clean Architecture sans lourdeur OOP

Objectif: garder des frontieres claires sans classes/factories partout.

- **Domain**: types + regles metier.
- **Application**: orchestration des use cases.
- **Infrastructure**: DB, repository concret.
- **Interface**: HTTP, validation d'entree, mapping d'erreurs API.

Le point cle: on garde la structure, mais on remplace beaucoup de boilerplate OOP par `types + fonctions + effects + layers`.

## 6) Flux actuel de la route create serie

1. `POST /series`
2. Controller: parse Zod (`ValidationError` si invalide)
3. Use case: validation domaine (`DomainError`) + repository
4. Repository: insertion DB (`SerieRepositoryError`)
5. Interface error handler: mapping vers `ApiError` (400/422/500)

## 7) Pourquoi mapper les erreurs DB

Kysely/pg remontent des erreurs techniques (message/code SQLSTATE).

On mappe vers des erreurs applicatives stables pour:

- ne pas exposer les details internes au client,
- garder un contrat d'erreurs clair,
- faciliter les tests et l'evolution.

## 8) Mini glossaire

- `Effect.fail`: produire une erreur attendue
- `Effect.catchTags`: gerer des erreurs par `_tag`
- `Layer.effect`: construire un service depuis un effect
- `Layer.succeed`: fournir une valeur deja disponible
- `yield* ServiceTag`: recuperer un service du contexte

## 9) Ressources

- Two error types: https://effect.website/docs/error-management/two-error-types/
- Expected errors: https://effect.website/docs/error-management/expected-errors/
- Layers: https://effect.website/docs/requirements-management/layers/
