# Notes d'apprentissage : FP + Effect TS

Ce document sert de prise de notes pour comprendre les bases de la programmation fonctionnelle (FP) et leur
application avec Effect TS.

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

Important: `Effect` gere les traitements **synchrones et asynchrones**.

- Synchrone: validation, parsing, transformations deterministes.
- Asynchrone: HTTP, DB, filesystem, timers.

La regle "eviter `Effect` pour une fonction purement synchrone" n'est pas une contrainte technique, c'est un
choix d'architecture:

- si une fonction est strictement metier et pure, on prefere une fonction normale pour garder le core simple;
- on utilise `Effect` quand on a besoin d'orchestration, de dependances (`R`), de policies (retry/timeout), ou
  d'I/O.

Heuristique rapide:

- `A -> B` pure et deterministe => fonction normale.
- enchainement avec services externes ou gestion avancee d'execution => `Effect`.

## 3) Deux types d'erreurs

- **Expected errors**: erreurs attendues, typees dans `E`.
- **Unexpected errors (defects)**: erreurs non prevues, hors du type `E`.

Dans l'API:

- `ValidationError`, `DomainError`, `SerieRepositoryError` = expected errors.
- bug runtime inattendu = defect. => à préciser 

## 4) Context.Tag et Layer

- `Context.Tag`: le contrat d'un service (ce que je veux).
- `Layer`: la construction d'un service (comment je le fournis).
- `Effect.provide(...)`: j'injecte les implementations.

Exemple actuel:

- `DbClient` est un service (Tag).
- `DbClientLive` construit ce service.
- `SerieRepositoryLive` depend de `DbClient`. => du coup c'est pas plutot de `DbClientLive` dont il devrait dépendre ?

## 5) Clean Architecture adaptee en FP pragmatique

Objectif: conserver des frontieres claires, mais reduire les abstractions sans valeur immediate.

- **Domain (core)**: types + regles metier pures, sans `Effect`.
- **Application (shell)**: orchestration des cas d'usage avec `Effect`.
- **Infrastructure (shell)**: DB, services techniques, mapping erreurs infra.
- **Interface (shell)**: HTTP, validation d'entree, mapping d'erreurs API.

Le point cle: `Effect` reste un outil d'orchestration d'effets, pas une obligation pour toute fonction.

## 5.1) Qu'est-ce que le "Shell" ici

Ici, "shell" ne veut pas dire terminal Unix. C'est la **coquille imperative** autour du metier:

- lit/parse des entrees externes (HTTP, env, queue),
- appelle le core fonctionnel,
- execute les effets (DB, logs, appels reseau),
- traduit les erreurs techniques vers des erreurs de contrat (API).

Autrement dit: le shell relie ton application au monde exterieur.

## 5.2) FP et organisation des dossiers

La FP n'impose pas d'arborescence unique. `domain/application/infrastructure/interface` est acceptable en FP
si:

- les frontieres sont utiles,
- la complexite reste proportionnelle,
- on evite les couches miroir sans valeur.

Bonnes pratiques usuelles:

- organiser par **responsabilite** (core vs shell), ou
- organiser par **feature** (ex: `series/`) avec sous-dossiers (`domain`, `http`, `repository`).

Regle pratique: garder une couche seulement si elle apporte un benefice clair (testabilite, variation
d'implementation, clarte du contrat).

## 5.3) Mapping concret de ce repo (core vs shell)

Core (fonctionnel):

- `apps/api/src/domain/serie.ts` (apres migration: validation pure, types metier)

Shell (imperatif):

- `apps/api/src/interface/serie.controller.ts` (HTTP input + Zod + appel use case)
- `apps/api/src/application/create-serie.use-case.ts` (orchestration avec `Effect`)
- `apps/api/src/infrastructure/serie.repository.ts` (DB/Kysely + mapping erreurs infra)
- `apps/api/src/interface/errors/http-error-handler.ts` (catch et traduction en reponse HTTP)
- `apps/api/src/interface/errors/api-error.ts` (contrat d'erreurs API)
- `apps/api/src/main.ts` (wiring Layer + routes + runtime)

## 6) Flux cible de la route create serie

1. `POST /series`
2. Controller: parse Zod (`ValidationError` si invalide)
3. Use case: validation domaine pure (`DomainError`) + appel repository
4. Repository: insertion DB (erreur infra typee)
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

## 10) Composition, pipe, thunk, `gen` et `yield*`

### 10.1 Ce qui est pareil avec le code "classique"

Composer des fonctions en plusieurs etapes existe aussi hors FP.

Exemple classique:

```ts
const parsed = parseInput(input);
const validated = validate(parsed);
const result = enrich(validated);
return result;
```

Donc oui: "prendre de petites fonctions et les chainer" n'est pas reserve a la FP.

### 10.2 Ce qui change vraiment en FP

La difference n'est pas le chainage lui-meme, mais les garanties:

- les fonctions du core sont pures (pas de DB, pas de HTTP, pas d'etat cache),
- les erreurs metier sont explicites (types/valeurs),
- la composition reste uniforme et previsible,
- les tests sont simples (entree -> sortie, sans mocks infra).

### 10.3 "Mathematique" vs "pragmatique applicative"

- Mathematique: raisonnement sur des fonctions pures abstraites (`f`, `g`, `f ∘ g`).
- Pragmatique applicative: une vraie app doit aussi gerer I/O, retries, logs, auth, timeout, etc.

Le style Functional Core / Imperative Shell combine les deux:

- core pur pour la logique metier,
- shell imperatif pour le monde exterieur.

### 10.4 `pipe`

`pipe` rend la lecture lineaire (gauche -> droite):

```ts
pipe(value, f1, f2, f3);
// au lieu de:
f3(f2(f1(value)));
```

Pourquoi c'est utile: moins de parentheses, meilleure lisibilite quand la chaine grandit.

### 10.5 Thunk: pourquoi c'est utile avec Effect

Un thunk est une fonction sans argument qui retarde l'execution: `() => A`.

Avec Effect, c'est utile car un `Effect` est une description de programme. Le runtime Effect doit pouvoir
controler quand executer (et parfois re-executer):

- retry,
- timeout,
- capture d'erreurs,
- interruption.

Si on execute trop tot, Effect perd ce controle.

### 10.6 `Effect<A, E, R>` et composition d'effets

`Effect<A, E, R>`:

- `A`: succes,
- `E`: erreur attendue,
- `R`: dependances requises.

Operations de base:

- `map`: transformer la valeur de succes (`A -> B`) sans ajouter un nouvel effet.
- `flatMap`: enchainer une etape qui retourne elle-meme un `Effect`.
- `andThen`: variante pratique pour enchainements.
- `Effect.gen`: syntaxe lisible pour enchainer avec `yield*`.

Intuition:

- `map` = transformation simple,
- `flatMap`/`andThen` = enchainement d'etapes effectives.

### 10.7 `generator` + `yield*` vs `async/await`

`Effect.gen` reutilise la syntaxe JS/TS des generators pour ecrire un flux sequentiel lisible.

```ts
const program = Effect.gen(function* () {
  const input = yield* parseInputEffect(raw);
  const serie = yield* createSerieUseCase(input);
  return serie;
});
```

Ce n'est pas obligatoire: on peut tout ecrire en `flatMap`. `gen` est surtout une ergonomie de lecture et
d'inference.

`async/await` est proche dans l'idee (syntactic sugar de `.then`), mais cible `Promise`. Effect ajoute en plus
un modele type pour `E` et `R`, et des capacites runtime (retry, interruption, etc.).

### 10.8 Est-ce pareil dans tous les langages FP ?

Non. Les idees sont proches, la syntaxe et les outils changent selon le langage.

- Haskell: `do` notation
- Scala: `for` comprehensions
- Kotlin: coroutines
- Rust: `async/.await` + `Result`
- C#: `async/await` + `Task`/`Result`

## 11) Exemples hors JS/TS (Rust et C#)

### 11.1 Rust: `Result` + `async` (pas de `Effect<A, E, R>`)

```rust
#[derive(Debug)]
enum DomainError {
    EmptyTitle,
    InvalidSeasons,
}

struct NewSerie {
    title: String,
    seasons: i32,
}

fn validate_new_serie(input: NewSerie) -> Result<NewSerie, DomainError> {
    if input.title.trim().is_empty() {
        return Err(DomainError::EmptyTitle);
    }
    if input.seasons <= 0 {
        return Err(DomainError::InvalidSeasons);
    }
    Ok(input)
}

async fn create_serie_use_case(repo: &impl SerieRepository, input: NewSerie) -> Result<Serie, RepoError> {
    let valid = validate_new_serie(input).map_err(|_| RepoError::ValidationFailed)?;
    repo.save(valid).await
}
```

Idee: Rust combine types (`Result`) + `async/.await` + ownership pour controler effets et erreurs.

### 11.2 C#/.NET: `Task` + `Result` applicatif

```csharp
public record NewSerie(string Title, int Seasons);
public record Serie(Guid Id, string Title, int Seasons);

public abstract record DomainError;
public record EmptyTitle : DomainError;
public record InvalidSeasons : DomainError;

public static class Domain
{
    public static (bool Ok, NewSerie? Value, DomainError? Error) Validate(NewSerie input)
    {
        if (string.IsNullOrWhiteSpace(input.Title)) return (false, null, new EmptyTitle());
        if (input.Seasons <= 0) return (false, null, new InvalidSeasons());
        return (true, input, null);
    }
}

public interface ISerieRepository
{
    Task<Serie> Save(NewSerie input, CancellationToken ct);
}

public static async Task<Serie> CreateSerieUseCase(ISerieRepository repo, NewSerie input, CancellationToken ct)
{
    var validation = Domain.Validate(input);
    if (!validation.Ok) throw new Exception("Domain validation failed");
    return await repo.Save(validation.Value!, ct);
}
```

Idee: C# utilise surtout `Task`/`async` pour l'asynchrone; on modele souvent les erreurs metier via types
`Result` maison ou bibliotheques dediees.
