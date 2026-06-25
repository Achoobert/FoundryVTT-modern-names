# Modern Names

![Foundry pulls](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/Achoobert/FoundryVTT-modern-names/main/stats/foundry-badges.json&label=Foundry%20pulls&query=$.pulls&color=orange)
![Foundry from GHA cache](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/Achoobert/FoundryVTT-modern-names/main/stats/foundry-badges.json&label=GHA%20cache%20hits&query=$.ghaCacheHits&color=green)

Roll tables and macros for random modern NPC names (American, Egyptian, French, German, Hispanic, Kenyan). Does not require Call of Cthulhu.

Requires Foundry **v14+**.

Been working on these roll tables for a while, I'm sure there are oddities I have missed: if a name isn't 'quite right' I tend to just roll for another name.
These are a huge crutch for my keeper style, as I cannot invent names on the fly.

I made these macros because I want to put names directly on tokens. It keeps the chat from getting cluttered up and saves me from needing to copy-paste.

Also it helps reduce player bloodthirstyness when it looks like they are killing people with names.

https://github.com/user-attachments/assets/8ca4f94c-9d2e-4f4d-98bc-4bb39ec908a7

I gotta be 100% honest this is the most basic module I could possibly imagine. While also being something I care about and use.
The real goal is tack on the most ridiculous dev experience features I could possibly dream of to make the DX as nice as possible. 
The best way to tinker with something complicated is to Make everything around it very simple. 

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

1. Copy `fvtt.config.example.js` to `fvtt.config.js`. Set `userDataPath` to your Foundry user data folder.
2. `npm install`
3. `npm run compendiums-build` — runs `macros-generate` first, then builds LevelDB packs from `compendiums/*.yaml`
4. `npm run build` or `npm run watch` — bundle `scripts/init.js` into `fvtt.config.js` `userDataPath` → `Data/modules/modern-names` (webpack logs the path; without `userDataPath` it falls back to repo `build/`, which Foundry will not see)
5. `npm run build:tests` or `npm run watch:tests` — build Quench test module into `Data/modules/modern-names-tests`

### Adding or changing name macros

- Edit [`compendiums/macro-manifest.yaml`](compendiums/macro-manifest.yaml) and [`compendiums/template.yaml`](compendiums/template.yaml)
- Edit roll table IDs in [`scripts/table-ids.js`](scripts/table-ids.js) when tables change
- Logic lives in [`scripts/namer.js`](scripts/namer.js)
- Run `npm run macros-generate` (or `compendiums-build`) — do not hand-edit `compendiums/en-macros.yaml`

## Quench and Cypress tests

1. Set `testWorldName` and `testSystemManifestUrl` in `fvtt.config.js` (see example).
2. `npm run build:all` (or `build` + `build:tests`). **`build:tests` runs `install-quench` first**, which:
   - installs [Quench](https://foundryvtt.com/packages/quench) into `Data/modules/quench`
   - installs the test game system (default: your Delta Green fork) into `Data/systems/deltagreen`
   - **creates** the test world if no world with `testWorldName` exists, then enables **Quench**, **Modern Names**, and **Modern Names Tests**
3. Launch the test world — modules should already be on.
4. In-world: Quench sidebar → batches `modern-names.api`, `modern-names.compendiums`, `modern-names.rolls`.
5. With Foundry running: `npm run tests` (interactive) or `npm run tests:ci` (headless).

If Cypress says the binary is missing, from repo root run `npm run cypress:install` (or `npx cypress install`) and wait for the download (~1–2 min). Use project `npx`/`npm run`, not a global `cypress` command. `pretests:ci` runs install before headless runs; `postinstall` runs on `npm install` unless scripts were skipped (`npm install --ignore-scripts`).

Optional: `npm run install-quench` alone to refresh Quench and re-patch the world.

### Docker (Foundry 14)

1. `cp .env.example .env` — `npm run startDevEnv` runs `sync-env-from-fvtt-config.js` so `FOUNDRY_USERDATA_HOST` matches `userDataPath` in `fvtt.config.js`. Compose binds that folder into the container; auth uses `FOUNDRY_USERNAME`, `FOUNDRY_PASSWORD`, and `FOUNDRY_ADMIN_KEY` (no license key in compose). The felddy image runs as uid **1000**; on Linux, if the host populated userdata first, run `node scripts/chown-foundrydata-for-docker.js` (or `sudo chown -R 1000:1000` on that path, `docker/secret`, and `docker/container_cache`) before `docker compose up`.
2. `npm run build:all` on the host so `Data/modules/*` exists under that folder.
3. `npm run startDevEnv` — `install-quench`, then `docker compose` with repo root `.env` → http://localhost:30000 (`stopDevEnv` to tear down).

GitHub Actions caches `docker/container_cache` and `foundrydata/resources` between runs (keyed by `FOUNDRY_CACHE_VERSION` in [`.github/workflows/ci.yml`](.github/workflows/ci.yml), aligned with `FOUNDRY_VERSION` in compose). Bump that version when you upgrade the Foundry patch you test against. CI also caches Quench (`Data/modules/quench`) and Delta Green (`Data/systems/deltagreen`) from the manifest URLs in [`fvtt.config.example.js`](fvtt.config.example.js).

**Foundry download counters:** canonical totals live in repo **Actions → Variables** (`FOUNDRY_PULLS`, `FOUNDRY_USED_FROM_CACHE`). Badges above read [`stats/foundry-badges.json`](stats/foundry-badges.json) on `main` (synced on default-branch CI after first Docker boot). If you still have the typo variable `FOUNDRY_USED_FROM_CASHE`, rename it to `FOUNDRY_USED_FROM_CACHE` in settings (scripts accept the legacy name until renamed). `FOUNDRY_PULLS` increments when felddy downloads from Foundry’s servers; `FOUNDRY_USED_FROM_CACHE` increments on CI when the GHA distribution cache hits and no site download occurred. Local `npm run startDevEnv` snapshots `docker/container_cache`, waits for Foundry, then runs `record-foundry-download.js` with `RECORD_FOUNDRY_STATS=1` (bumps `FOUNDRY_PULLS` via `gh` or `GITHUB_TOKEN` when a site pull is detected; local felddy zip cache does not count as GHA cache).

| Batch ID | Topic |
|----------|--------|
| `modern-names.api` | Module API surface |
| `modern-names.compendiums` | Roll table and macro packs |
| `modern-names.rolls` | Draw from name tables |

## License

GPL-3.0
