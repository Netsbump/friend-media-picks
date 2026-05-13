# AGENTS

## Vendored Repositories

This project vendors external repositories under `repos/`.

- Use vendored repositories as read-only reference material when working with related libraries.
- Prefer examples and patterns from vendored source code over generated guesses or web search results.
- Do not edit files under `repos/` unless explicitly asked.
- Do not import from `repos/` in application code. Continue importing from package dependencies.

### Effect guidance

When writing Effect code, inspect `repos/effect/` for examples of idiomatic usage, tests, module structure, and API design. Treat it as the source of truth for Effect patterns.
