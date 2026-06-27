# Notes d'apprentissage : FP + Effect TS

Documents complémentaires :

- [Effect, Drizzle et transactions](./effect-drizzle-transactions.md)

Ce document sert de prise de notes pour comprendre les bases de la programmation fonctionnelle (FP) et leur
application avec Effect TS.

## 1) Bases de la FP

- **Immutabilite**: on evite de modifier des objets en place.
- **Fonctions pures**: meme entree => meme sortie, sans effet de bord.
- **Composition**: on prefere assembler de petites fonctions simples.
- **Donnees explicites**: on modelise le domaine avec des types clairs.
- **Erreurs explicites**: on evite le throw implicite dans la logique metier.

## 2) C'est quoi Effect TS ?

Effect TS est a la fois:

- une **stdlib fonctionnelle** : types et modules pour modeliser un programme (ex: Effect, Layer, Context, Schedule, Queue, Schema, etc.),
- un **runtime** qui execute ces programmes de maniere controlee (fibers, interruption, retry, timeouts, supervision, traces).

En pratique, on ecrit des valeurs `Effect<A, E, R>` avec la stdlib, puis on les lance via le runtime
(`Effect.runPromise`, `runSync`, etc.).

Difference avec le runtime JS (Node/Bun/Deno):

- le runtime JS execute du JavaScript (event loop, Promise, I/O),
- le runtime Effect execute des descriptions `Effect` au-dessus du runtime JS.

Donc Effect ajoute une couche applicative pour mieux controler l'execution
(erreurs attendues typees, interruption, retry, timeout, supervision).

### Fibers

Les **fibers** sont des unites d'execution legeres gerees par le runtime Effect.

- intuition: similaire a des "goroutines" (Go) ou des taches legeres cooperatives,
- elles permettent de lancer/composer/interrompre des workflows sans gerer des threads manuellement,
- elles sont la base de la concurrence structuree dans Effect.

## 2.1) Le type Effect

`Effect<A, E, R>` se lit comme:

- `A`: type de succes
- `E`: type d'erreur attendue
- `R`: dependances requises

Exemple mental:

- `Effect<TvShow, DomainError, never>`
  - produit un `TvShow`
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

- `ValidationError`, `DomainError`, `RepositoryError` = expected errors.
- bug runtime inattendu = defect. => à préciser

## 4) Context.Tag et Layer

- `Context.Tag`: le contrat d'un service, c'est l'equivalent de ce qu'on fait en OOP avec les interfaces.
- `Layer`: la construction d'un service (comment je le fournis), c'est l'implémentation concrète du service.
- `Effect.provide(...)`: j'injecte les implementations.

Exemple actuel:

- `DbClient` est un service (Tag).
- `DbClientLive` construit ce service.
- `TvShowRepositoryLive` depend du service `DbClient` (abstraction), et au runtime on lui fournit `DbClientLive` (implementation).

## 5) Clean Architecture adaptee en FP pragmatique

Objectif: conserver des frontieres claires, mais reduire les abstractions sans valeur immediate.

- **Domain (core)**: types + regles metier pures, sans `Effect`.
- **Application (shell)**: orchestration des cas d'usage avec `Effect`.
- **Infrastructure (shell)**: DB, services techniques, mapping erreurs infra.
- **Http (shell)**: HTTP, validation d'entree, mapping d'erreurs API.

## 5.1) Qu'est-ce que le "Shell" ici

Ici, "shell" ne veut pas dire terminal Unix. C'est la **coquille imperative** autour du metier:

- lit/parse des entrees externes (HTTP, env, queue),
- appelle le core fonctionnel,
- execute les effets (DB, logs, appels reseau),
- traduit les erreurs techniques vers des erreurs de contrat (API).

Autrement dit: le shell relie ton application au monde exterieur.

## 6) Flux cible de la route create tvshow

1. `POST /tvshows`
2. Controller: parse Zod (`ValidationError` si invalide)
3. Use case: validation domaine pure (`DomainError`) + appel repository
4. Repository: insertion DB (erreur infra typee)
5. Interface error handler: mapping vers `ApiError` (400/422/500)

## 7) Ressources

- Two error types: https://effect.website/docs/error-management/two-error-types/
- Expected errors: https://effect.website/docs/error-management/expected-errors/
- Layers: https://effect.website/docs/requirements-management/layers/

## 8) Composition, pipe, thunk, `gen` et `yield*`

### Ce qui est pareil avec le code "classique"

Composer des fonctions en plusieurs etapes existe aussi hors FP.

Exemple classique:

```ts
const parsed = parseInput(input);
const validated = validate(parsed);
const result = enrich(validated);
return result;
```

### FP vs OOP: differences concretes

La difference principale n'est pas "on chaine des fonctions" mais le modele de programmation.

#### 1) Dependances

En OOP, on injecte souvent les dependances via constructeur/interface.

```ts
interface TvShowRepository {
  // Dependency is injected via constructor.
  save(input: NewTvShow): Promise<TvShow>;
}

class CreateTvShowUseCase {
  constructor(private readonly repo: TvShowRepository) {}

  execute(input: NewTvShow): Promise<TvShow> {
    return this.repo.save(input);
  }
}
```

En FP + Effect, la dependance est dans `R` et fournie via `Layer`.

```ts
const createTvShowUseCase = (input: NewTvShow) =>
  Effect.gen(function* () {
    // Dependency is requested from Effect context.
    const repo = yield* TvShowRepository;
    return yield* repo.save(input);
  });
// Type: Effect<TvShow, RepositoryError, TvShowRepository>
```

#### 2) Erreurs

En OOP, le style courant reste l'exception (implicite dans la signature).

```ts
class DomainError extends Error {}

function validate(input: NewTvShow): NewTvShow {
  if (input.title.trim() === "") {
    throw new DomainError("title is empty");
  }
  return input;
}
```

En FP + Effect, l'erreur attendue est explicite dans `E` via des variantes taggees (ADT).

```ts
import { Data, Effect } from "effect";

// Tagged error variants = discriminated union building blocks.
export class EmptyTitleError extends Data.TaggedError("EmptyTitleError")<{
  message: string;
}> {}

export class InvalidSeasonsError extends Data.TaggedError(
  "InvalidSeasonsError",
)<{
  message: string;
}> {}

// ADT = union of tagged variants.
type DomainError = EmptyTitleError | InvalidSeasonsError;

const validate = (input: NewTvShow): Effect.Effect<NewTvShow, DomainError> => {
  if (input.title.trim() === "") {
    return Effect.fail(new EmptyTitleError({ message: "title is empty" }));
  }

  if (input.seasons <= 0) {
    return Effect.fail(
      new InvalidSeasonsError({ message: "seasons must be > 0" }),
    );
  }

  return Effect.succeed(input);
};
```

Pattern matching (via `_tag`) pour traiter chaque cas explicitement:

```ts
const toHttpStatus = (error: DomainError): number => {
  // Pattern matching in TypeScript usually means switching on `_tag`.
  switch (error._tag) {
    case "EmptyTitleError":
      return 422;
    case "InvalidSeasonsError":
      return 422;
  }
};
```

#### 3) Composition

En OOP, on compose souvent en sequence imperative.

```ts
async function createTvShow(
  input: unknown,
  repo: TvShowRepository,
): Promise<TvShow> {
  // Imperative sequence: each line executes now.
  const parsed = parseInput(input);
  const validated = validate(parsed);
  return repo.save(validated);
}
```

En FP + Effect, on compose avec des combinators (`map`, `flatMap`, `andThen`, `zip`, etc.).

```ts
const createTvShow = (input: unknown) =>
  pipe(
    parseInputEffect(input),
    Effect.flatMap(validateEffect),
    // Combinator style: compose effectful steps declaratively.
    Effect.flatMap((valid) =>
      Effect.gen(function* () {
        const repo = yield* TvShowRepository;
        return yield* repo.save(valid);
      }),
    ),
  );
```

#### 4) Execution des effets

En OOP, l'appel execute tout de suite.

```ts
const tvShow = await useCase.execute(input);
```

En FP + Effect, on construit d'abord, on execute ensuite.

```ts
const program = createTvShow(input); // Build a description only.
const result = await Effect.runPromise(program); // Execute the description.
```

Ce mode "build then run" se lit comme:

- `program` = blueprint / recette (description du flux),
- `runPromise(program)` = moment ou le runtime execute reellement ce flux.

Pourquoi c'est utile: le runtime Effect garde le controle de l'execution (retry, timeout, interruption,
supervision, traces) parce qu'il recoit une description et pas une execution deja lancee.

Comparaison rapide:

- `() => A`: retarde juste un calcul synchrone,
- `() => Promise<A>`: retarde un calcul async, mais sans modele explicite de `E` et `R`,
- `Effect<A, E, R>`: description d'un programme avec succes, erreurs attendues et dependances,
- `() => Effect<A, E, R>`: thunk qui retarde la creation/l'acces a cette description.

Note: une fonction classique s'execute aussi seulement quand on l'appelles. La difference en Effect n'est pas
juste le "retard", c'est surtout le fait que la valeur de retour est un programme type (`A`, `E`, `R`) que le
runtime peut interpreter proprement.

#### 5) Testabilite

En OOP, on mocke souvent les dependances.

```ts
const repoMock: SerieRepository = { save: async (s) => ({ id: "1", ...s }) };
const useCase = new CreateSerieUseCase(repoMock);
```

En FP + Effect, on remplace le service avec un layer de test.

```ts
const SerieRepositoryTest = Layer.succeed(SerieRepository, {
  // Test implementation that replaces the live dependency.
  save: (input: NewSerie) => Effect.succeed({ id: "1", ...input }),
});

const program = createSerieUseCase({ title: "Dark", seasons: 1 }).pipe(
  Effect.provide(SerieRepositoryTest),
);
```

Conclusion: OOP et FP peuvent toutes les deux faire du code propre. Avec Effect, les dependances (`R`) et les
erreurs attendues (`E`) sont encodees directement dans le type, ce qui force un style explicite par defaut.

### `pipe`

`pipe` rend la lecture lineaire et plus lisible (gauche -> droite):

```ts
pipe(value, f1, f2, f3);
// au lieu de:
f3(f2(f1(value)));
```

### Thunk: pourquoi c'est utile avec Effect

Un thunk est une fonction sans argument qui retarde l'execution: `() => A`.

Avec Effect, c'est utile car un `Effect` est une description de programme. Le runtime Effect doit pouvoir
controler quand executer (et parfois re-executer):

- retry,
- timeout,
- capture d'erreurs,
- interruption.

Si on execute trop tot, Effect perd ce controle.

### `Effect<A, E, R>` et composition d'effets

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

### `generator` + `yield*` vs `async/await`

`Effect.gen` reutilise la syntaxe JS/TS des generators pour ecrire un flux sequentiel lisible. C'est une syntaxe de confort.

```ts
const program = Effect.gen(function* () {
  const input = yield* parseInputEffect(raw);
  const tvShow = yield* createTvShowUseCase(input);
  return tvShow;
});
```

Ce n'est pas obligatoire: on peut tout ecrire en `flatMap`. `gen` est surtout une ergonomie de lecture et
d'inference. (ça s'appelle le style combinators)

Equivalent avec pipe + flatMap:

```ts
const program = pipe(
  parseInputEffect(raw),
  Effect.flatMap((input) => createTvShowUseCase(input)),
);
```

Equivalent avec andThen (quand on enchaine simplement):

```ts
const program = parseInputEffect(raw).pipe(Effect.andThen(createTvShowUseCase));
```

Avec gestion d'erreur ajoutee (sans gen):

```ts
const program = pipe(
  parseInputEffect(raw),
  Effect.flatMap(createTvShowUseCase),
  Effect.mapError((e) => new ApiError({ cause: e })),
);
```

Lecture rapide:

- gen/yield\*: tres lisible pour des flux longs et sequentiels.
- flatMap/pipe: plus declaratif, compact pour des chaines courtes.
- les deux styles sont equivalents en semantics.

`async/await` est proche dans l'idee (syntactic sugar de `.then`), mais cible `Promise`. Effect ajoute en plus
un modele type pour `E` et `R`, et des capacites runtime (retry, interruption, etc.).

### Est-ce pareil dans tous les langages FP ?

Non. Les idees sont proches, la syntaxe et les outils changent selon le langage.

- Haskell: `do` notation
- Scala: `for` comprehensions
- Kotlin: coroutines
- Rust: `async/.await` + `Result`
- C#: `async/await` + `Task`/`Result`

## Exemples hors JS/TS (Rust et C#)

### Rust: `Result` + `async` (pas de `Effect<A, E, R>`)

```rust
#[derive(Debug)]
enum DomainError {
    EmptyTitle,
    InvalidSeasons,
}

struct NewTvShow {
    title: String,
    seasons: i32,
}

fn validate_new_tvshow(input: NewTvShow) -> Result<NewTvShow, DomainError> {
    if input.title.trim().is_empty() {
        return Err(DomainError::EmptyTitle);
    }
    if input.seasons <= 0 {
        return Err(DomainError::InvalidSeasons);
    }
    Ok(input)
}

async fn create_tvshow_use_case(repo: &impl TvShowRepository, input: NewTvShow) -> Result<TvShow, RepoError> {
    let valid = validate_new_tvshow(input).map_err(|_| RepoError::ValidationFailed)?;
    repo.save(valid).await
}
```

Idee: Rust combine types (`Result`) + `async/.await` + ownership pour controler effets et erreurs.

### C#/.NET: `Task` + `Result` applicatif

```c
public record NewTvShow(string Title, int Seasons);
public record TvShow(Guid Id, string Title, int Seasons);

public abstract record DomainError;
public record EmptyTitle : DomainError;
public record InvalidSeasons : DomainError;

public static class Domain
{
    public static (bool Ok, NewTvShow? Value, DomainError? Error) Validate(NewTvShow input)
    {
        if (string.IsNullOrWhiteSpace(input.Title)) return (false, null, new EmptyTitle());
        if (input.Seasons <= 0) return (false, null, new InvalidSeasons());
        return (true, input, null);
    }
}

public interface ITvShowRepository
{
    Task<TvShow> Save(NewTvShow input, CancellationToken ct);
}

public static async Task<TvShow> CreateTvShowUseCase(ITvShowRepository repo, NewTvShow input, CancellationToken ct)
{
    var validation = Domain.Validate(input);
    if (!validation.Ok) throw new Exception("Domain validation failed");
    return await repo.Save(validation.Value!, ct);
}
```

Idee: C# utilise surtout `Task`/`async` pour l'asynchrone; on modele souvent les erreurs metier via types
`Result` maison ou bibliotheques dediees.

## 11) Memo rapide: OOP -> FP en TypeScript

- En OOP, on cree souvent une instance avec `new` et le constructeur protege les invariants.
- En FP/data-first, on manipule des objets litteraux, et les invariants sont proteges par des fonctions de creation/validation.
- Un objet litteral n'est pas "moins robuste" qu'une classe: il devient fiable si toute creation passe par une porte d'entree metier (`createX`, `validateX`).
- Sans cette discipline, TypeScript peut etre contourne (`as`, `Partial`, champs optionnels), donc il faut centraliser la creation.
- `Brand<T, B>` sert a distinguer des valeurs de meme base (`string`, `number`) mais de sens metier different.
- Les `as` sont acceptables dans les smart constructors, apres validation runtime; a eviter ailleurs.
- Dans ce projet: `NewTvShowInput` (brut) -> `validateNewTvShow` -> `ValidatedTvShow` (sur) -> repository -> `TvShow`.
- On pense "valeur valide" plutot que "instance de classe": le but est la surete metier, pas le mot-cle `new`.
