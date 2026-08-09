# Modern Names

Roll tables and macros for random 1920s-appropriate NPC names (American, Egyptian, French, German, Hispanic, Kenyan, Chinese, South Asian, Russian, Italian, Japanese, Australian, Arab). Does not require Call of Cthulhu.

Chinese names use the Wade-Giles transcription system and are drawn surname-first (e.g. "Wang Wei-kuo"); every other culture is drawn given-name-first.

Requires Foundry **v14+**.

Been working on these roll tables for a while, I'm sure there are oddities I have missed: if a name isn't 'quite right' I tend to just roll for another name.
These are a huge crutch for my keeper style, as I cannot invent names on the fly.

I made these macros because I want to put names directly on tokens. It keeps the chat from getting cluttered up and saves me from needing to copy-paste.

Also it helps reduce player bloodthirstyness when it looks like they are killing people with names.

https://github.com/user-attachments/assets/8ca4f94c-9d2e-4f4d-98bc-4bb39ec908a7

The module itself is tiny: roll tables, macros, one init hook. The repo around it exists for **GitHub CI** and **local DevX** so we can answer:

> Is it safe to upgrade to v14?

Docker + Quench + Cypress run the same checks locally and on every push. I run paid games on Start Playing; I need modules I use to stay reliable and current.

## Installation

In Foundry → **Install Module** → paste manifest URL:

```
https://github.com/Achoobert/FoundryVTT-modern-names/releases/latest/download/module.json
```

Use **`latest/download`**, not `download/latest`. Tags include a **`v`** prefix (e.g. `v0.1.0`, not `0.1.0`):

```
https://github.com/Achoobert/FoundryVTT-modern-names/releases/download/v0.1.0/module.json
```

## Development

1. Copy [`fvtt.config.example.js`](fvtt.config.example.js) → `fvtt.config.js`. Set `userDataPath` to your Foundry user data folder.
2. `npm install`
3. `npm run build:all` — `compendiums-build` (YAML → `packs/`, generated, not in git), then module + Quench test module into `Data/modules/…`

Day to day:

- `npm run watch` / `npm run watch:tests` — rebuild on change
- `npm run compendiums-build` — after editing compendium YAML or macro manifest

`packs/` is build output from [`compendiums/`](compendiums/). CI and release always run `compendiums-build` first.

### Adding or changing name macros

- Edit [`compendiums/macro-manifest.yaml`](compendiums/macro-manifest.yaml) and [`compendiums/template.yaml`](compendiums/template.yaml)
- Edit roll table IDs in [`scripts/table-ids.js`](scripts/table-ids.js) when tables change
- Logic lives in [`scripts/namer.js`](scripts/namer.js)
- Run `npm run macros-generate` (or `compendiums-build`) — do not hand-edit `compendiums/en-macros.yaml`

## Tests (Quench + Cypress)

1. Set `testWorldName` and `testSystemManifestUrl` in `fvtt.config.js` (see example).
2. `npm run build:all` on the host.
3. `npm run startDevEnv` — syncs `.env`, installs Quench + test system + world, starts Foundry 14 in Docker → http://localhost:30000 (`npm run stopDevEnv` to tear down).
4. In-world: Quench → batches `modern-names.api`, `modern-names.compendiums`, `modern-names.rolls`.
5. `npm run test` (interactive Cypress) or `npm run test:ci` (headless). Both expect a running Foundry: run `npm run startDevEnv` first (CI boots it in the workflow).

Missing Cypress binary: `npm run cypress:install`.

Refresh Quench/world without full boot: `node ci_scripts/install-quench.js`.

### Docker notes

- `cp .env.example .env` — `startDevEnv` runs `sync-env-from-fvtt-config.js` so **absolute** `FOUNDRY_USERDATA_HOST` matches `userDataPath` (relative paths break with `--project-directory docker`).
- Auth: `FOUNDRY_USERNAME`, `FOUNDRY_PASSWORD`, `FOUNDRY_ADMIN_KEY` in `.env`.
- Felddy runs as uid **1000**; on Linux before Docker: `sudo chown -R 1000:1000 foundrydata docker/secret docker/container_cache`.

**Empty Game Worlds / 0 systems:** wrong userdata mount. `startDevEnv` uses `docker compose … up -d --force-recreate`. Check mount: `docker inspect foundry-modern-names-test --format '{{range .Mounts}}{{if eq .Destination \"/data\"}}{{.Source}}{{end}}{{end}}'` — must equal `userDataPath`.

Harness: [`ci_scripts/install-quench.js`](ci_scripts/install-quench.js), [`wait-for-foundry.js`](ci_scripts/wait-for-foundry.js), [`write-ci-config.js`](ci_scripts/write-ci-config.js) (not in release zip; zip ships [`scripts/`](scripts/) + built `packs/`).

### Foundry download cache (CI + local)

| Layer | Source | Cached |
|-------|--------|--------|
| Felddy image | Docker Hub | Runner layer cache |
| Foundry app zip (`14.364`) | foundryvtt.com | `docker/container_cache` + `foundrydata/resources` (GHA cache key `foundry-dist-*`) |

Bump **`FOUNDRY_CACHE_VERSION`** in [`.github/workflows/ci.yml`](.github/workflows/ci.yml) and **`FOUNDRY_VERSION`** in [`docker/docker-compose.yml`](docker/docker-compose.yml) together for a new patch.

Quench + Delta Green: separate `e2e-deps` cache in CI.

| Batch ID | Topic |
|----------|--------|
| `modern-names.api` | Module API surface |
| `modern-names.compendiums` | Roll table and macro packs |
| `modern-names.rolls` | Draw from name tables |

## License

GPL-3.0
