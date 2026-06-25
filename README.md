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

### Minimizing downloads from foundryvtt.com

Felddy involves **two** downloads. Only one is the Foundry **application** from Foundry’s site.

| Layer | What | From | Cached how |
|-------|------|------|------------|
| **Felddy image** | `felddy/foundryvtt:14` — container entrypoint, Node, install scripts | Docker Hub | Runner Docker layer cache (automatic; not counted by repo badges) |
| **Foundry distribution** | Versioned zip (e.g. 14.364) + extracted app under `resources/` | **foundryvtt.com** (via `FOUNDRY_USERNAME` / `FOUNDRY_PASSWORD`) | **This repo optimizes this layer** |

**Local dev:** Compose sets `CONTAINER_CACHE=/container_cache`, bind-mounted to [`docker/container_cache`](docker/docker-compose.yml). After first successful boot, felddy keeps the zip there; later `startDevEnv` runs reuse it and skip the site download unless you delete that folder or change `FOUNDRY_VERSION`.

**CI:** Before Docker starts, [`actions/cache/restore`](.github/workflows/ci.yml) restores `docker/container_cache` and `foundrydata/resources`. After first boot, a verify step checks zip and/or `resources/app`, then [`actions/cache/save`](.github/workflows/ci.yml) uploads the same paths to GitHub’s cache. Key: `foundry-dist-<FOUNDRY_CACHE_VERSION>-<compose hash>`. Exact cache hit → felddy uses restored zip/resources → **no site pull**. Cache miss (new key, first run, or evicted entry) → **one** site pull that run, then save repopulates cache.

**When you must pull from the site again**

- Bump **`FOUNDRY_CACHE_VERSION`** in [`.github/workflows/ci.yml`](.github/workflows/ci.yml) and **`FOUNDRY_VERSION`** in [`docker/docker-compose.yml`](docker/docker-compose.yml) together when you intentionally move to a new Foundry patch.
- Delete `docker/container_cache` locally, or change the cache key (compose layout change is already in the key via `hashFiles('docker/docker-compose.yml')`).

**Not cached here (separate GHA cache):** Quench and Delta Green under `foundrydata/Data/…` — see `e2e-deps` in CI. Module/webpack output is rebuilt every run.

Badges at the top track **site pulls** (`FOUNDRY_PULLS`) and **CI runs that used the GHA distribution cache without a site pull** (`FOUNDRY_USED_FROM_CACHE`). Use only those two repo variables (do not add `FOUNDRY_GHA_CACHE_HIT` — that name is only the workflow env from `actions/cache/restore`). **Every CI e2e run** (push and pull_request) bumps counters after first boot; Cypress pass/fail does not skip cache save or stats. Proof each run: job **Step summary** → “Foundry distribution cache”. Canonical values: **Settings → Actions → Variables**. CI needs **Settings → Actions → General → Workflow permissions → Read and write** to update variables. [`stats/foundry-badges.json`](stats/foundry-badges.json) on `main` is synced when badge commit runs on default branch. Local: `RECORD_FOUNDRY_STATS=1` on `startDevEnv` when using `gh` auth to bump `FOUNDRY_PULLS` after a real site pull.

| Batch ID | Topic |
|----------|--------|
| `modern-names.api` | Module API surface |
| `modern-names.compendiums` | Roll table and macro packs |
| `modern-names.rolls` | Draw from name tables |

## License

GPL-3.0
