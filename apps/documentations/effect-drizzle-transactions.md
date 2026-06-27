# Effect, Drizzle et transactions

Cette note explique avec des mots simples comment lire le code Drizzle + Effect du projet, surtout autour de `db`, `tx`, `makeTvShowQueries` et des transactions.

## Le problème à résoudre

Quand on sauvegarde un TV show, on ne fait pas une seule requête SQL.

On fait plusieurs écritures :

- créer le TV show
- créer ou récupérer les personnes
- créer ou récupérer les genres
- créer les relations entre le TV show et les personnes
- créer les relations entre le TV show et les genres

Si une écriture échoue au milieu, on ne veut pas garder une moitié de TV show en base.

Exemple problématique sans transaction :

```txt
1. insert tv_show -> succès
2. insert genres -> succès
3. insert tv_show_genres -> échec
```

Sans transaction, les étapes 1 et 2 peuvent rester en base même si l'étape 3 échoue.

Avec une transaction, Postgres fait un rollback : il annule les écritures faites dans la transaction.

## C'est quoi `db` ?

`db` est le client Drizzle principal.

On l'utilise pour les requêtes normales :

```ts
yield* db.select().from(tvShows);
yield* db.insert(tvShows).values(input);
```

Dans le projet, `db` vient du service Effect `DbClient`.

## C'est quoi `tx` ?

`tx` est le client Drizzle temporaire donné par une transaction :

```ts
yield* db.transaction((tx) =>
  Effect.gen(function* () {
    yield* tx.insert(tvShows).values(input);
  }),
);
```

`tx` ressemble à `db`, mais il est branché sur la transaction SQL en cours.

Règle simple : dans un bloc `db.transaction`, les requêtes qui font partie de l'opération atomique doivent utiliser `tx`.

## Pourquoi `tx` n'est pas exactement `db` ?

`db` est le client Drizzle complet.

Il sait faire des choses comme :

```ts
db.select(...);
db.insert(...);
db.transaction(...);
```

Il expose aussi des détails internes comme `$client`, qui pointe vers le client Postgres Effect sous-jacent.

Dans notre code métier, on n'utilise pas `$client`.

`tx`, lui, est un client transactionnel. Il sait faire les requêtes dont on a besoin dans la transaction, comme `select` et `insert`, mais il n'a pas forcément toutes les propriétés du client complet `db`.

Donc TypeScript peut refuser ce code :

```ts
makeTvShowQueries(tx);
```

si `makeTvShowQueries` demande un `Database` complet.

## Pourquoi `Pick<Database, "insert" | "select">` ?

Nos queries TV show n'ont pas besoin de tout le client Drizzle.

Elles ont seulement besoin de :

```ts
insert
select
```

Donc on type leur dépendance comme ça :

```ts
type TvShowQueryExecutor = Pick<Database, "insert" | "select">;
```

Traduction :

```txt
Donne-moi un objet qui sait faire insert et select.
Je n'ai pas besoin de savoir si c'est le db complet ou un tx transactionnel.
```

Ainsi, les deux appels sont valides :

```ts
makeTvShowQueries(db);
makeTvShowQueries(tx);
```

## C'est quoi `makeTvShowQueries(db)` ?

`makeTvShowQueries` fabrique un objet de fonctions de requête branchées sur le client donné.

Avec le client normal :

```ts
const queries = makeTvShowQueries(db);
```

Les queries utilisent `db`.

Avec le client transactionnel :

```ts
const txQueries = makeTvShowQueries(tx);
```

Les queries utilisent `tx`, donc elles participent à la transaction.

Important : appeler `makeTvShowQueries(db)` ne lance aucune requête SQL. Ça crée seulement des fonctions JavaScript.

La requête part seulement quand on appelle une fonction de query et qu'on `yield*` son `Effect` :

```ts
const rows = yield* queries.selectTvShowById(tvShowId);
```

## Pourquoi utiliser `txQueries` dans `save` ?

Dans `save`, les écritures doivent être atomiques.

Donc on fait :

```ts
yield* db.transaction((tx) =>
  Effect.gen(function* () {
    const txQueries = makeTvShowQueries(tx);

    const insertedTvShows = yield* txQueries.insertTvShow(input);
    const insertedTvShow = insertedTvShows[0];

    if (insertedTvShow === undefined) {
      return [];
    }

    const directorRows = yield* txQueries.insertPersons(tvShow.directors);
    const genreRows = yield* txQueries.insertGenres(tvShow.genres);

    yield* txQueries.insertTvShowDirectors(insertedTvShow.id, directorRows);
    yield* txQueries.insertTvShowGenres(insertedTvShow.id, genreRows);

    return [insertedTvShow];
  }),
);
```

Si une ligne échoue dans ce bloc, la transaction échoue et Postgres rollback les écritures déjà faites dans ce bloc.

## Est-ce qu'un `select` dans une transaction est "pollué" ?

Non.

Dans une transaction, Postgres donne une vue cohérente de la base :

```txt
état commit de la DB + changements faits par ma transaction en cours
```

Exemple :

```txt
Transaction A:
1. insert tv_show id=123
2. select tv_show id=123 -> le voit

Autre requête hors transaction:
1. select tv_show id=123 -> ne le voit pas encore

Transaction A:
1. commit

Autre requête hors transaction:
1. select tv_show id=123 -> le voit maintenant
```

Donc un `tx.select` voit les données non commit de sa propre transaction, mais les autres connexions ne les voient pas avant le commit.

Ce n'est pas une pollution. C'est ce qui permet d'écrire une logique atomique.

## Quand utiliser `tx.select` ?

Utiliser `tx.select` quand la lecture fait partie de la logique transactionnelle.

Exemples :

- lire une ligne que la transaction vient d'insérer
- vérifier une contrainte métier avant de continuer
- décider quelles écritures faire ensuite
- lire un état intermédiaire qui doit être cohérent avec les écritures en cours

## Quand utiliser `db.select` ?

Utiliser `db.select` pour une lecture normale hors transaction.

On peut aussi utiliser `db.select` après la transaction, une fois que tout est commit.

Dans notre cas, l'hydratation finale du TV show est faite après la transaction :

```ts
const insertedTvShows = yield* db.transaction((tx) => ...);

return [yield* hydrateTvShow(insertedTvShow)];
```

C'est volontaire :

- la transaction protège les écritures
- l'hydratation finale sert seulement à construire la réponse API
- cette lecture peut donc se faire après le commit

## Règles pratiques

- Une écriture qui fait partie d'un workflow atomique doit utiliser `tx`.
- Une lecture qui sert à décider la suite de la transaction doit utiliser `tx`.
- Une lecture finale pour retourner une réponse peut être faite après la transaction avec `db`.
- `makeTvShowQueries(db)` crée des queries normales.
- `makeTvShowQueries(tx)` crée des queries transactionnelles.
- Une transaction ne rollback que les requêtes faites avec `tx` dans son bloc.
