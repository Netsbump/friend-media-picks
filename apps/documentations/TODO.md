# TODO Projet API (Effect TS)

## Features API

- [ ] Implementer `GET /series` (list all)
- [ ] Implementer `GET /series/:id` (get by id)
- [ ] Gérer les cas `not found` avec une erreur metier/API claire
- [ ] Ajouter pagination simple sur `GET /series`

## Tests (propre en Effect TS)

- [ ] Choisir la strategie de tests:
  - unitaires sur domaine pur
  - integration sur use cases/repository
  - tests HTTP endpoint
- [ ] Ajouter tests domaine (`validateNewSerie`)
- [ ] Ajouter tests mapping erreurs (`toApiError`, `withHttpErrors`)
- [ ] Ajouter tests repository avec DB de test
- [ ] Documenter la facon de mocker/provide des services (`Layer` de test)

## Erreurs et observabilite

- [ ] Completer le mapping SQLSTATE Postgres (au-dela de `23505`, `42P01`)
- [ ] Standardiser les `ApiErrorCode` (pas de string libre)
- [ ] Ameliorer logs dev (eventuellement structurer en JSON)
- [ ] Ajouter des logs Effect propres au demarrage de l'API (port, env, dependances critiques)

## Base de donnees

- [ ] Ajouter commande "reset dev DB" documentee
- [ ] Ajouter seed minimal de dev (series de demo)

## Documentation

- [ ] Ajouter un chapitre sur tests Effect (patterns `provide`, `Layer`, `catchTags`)
- [ ] Ajouter une section sur la visualisation de l'architecture en Markdown
