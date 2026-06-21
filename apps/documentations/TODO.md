# TODO Projet API (Effect TS)

## Features API

- [ ] Renommer le modele `serie` en `tvshow` dans tout le projet
- [ ] Renommer les routes `/series` en `/tvshows`
- [ ] Renommer les fichiers, services, repositories, handlers et tests lies a `serie` vers `tvshow`
- [ ] Implementer `GET /tvshows` (list all)
- [ ] Implementer `GET /tvshows/:id` (get by id)
- [ ] Gérer les cas `not found` avec une erreur metier/API claire
- [ ] Ajouter pagination simple sur `GET /tvshows`

## Tests (propre en Effect TS)

- [ ] Comprendre les tests en Effect et choisir ce qui est pertinant de tester :
  - unitaires sur domaine pur ?
  - integration sur use cases/repository ?
  - tests HTTP endpoint ?
  - tests db ?
  - tests du mapping d'error ?
  - documentation de comment mocker ?

## Erreurs et observabilite

- [ ] Ameliorer logs dev (eventuellement structurer en JSON) et comment on fait en Effect ? (bonnes pratiques)
- [ ] Utiliser la lib que j'ai mis de coté pour avoir les metrics ?

## Base de donnees

- [ ] Ajouter commande "reset dev DB" documentee
- [ ] Ajouter seed minimal de dev (tv shows de demo)

## Documentation

- [ ] Ajouter un chapitre sur tests Effect (patterns `provide`, `Layer`, `catchTags`)
