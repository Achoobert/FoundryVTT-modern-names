/**
 * Installs Quench + Delta Green test system into userDataPath/Data, enables modules on test world.
 * Override URLs in fvtt.config.js (quenchManifestUrl, testSystemManifestUrl, *DownloadUrl).
 */

import { execFileSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import developmentOptions from '../fvtt.config.js'
import { resolveUserDataPath } from './fvtt-paths.js'

const DEFAULT_QUENCH_MANIFEST =
  'https://github.com/Ethaks/FVTT-Quench/releases/download/v0.10.0/module.json'

const DEFAULT_TEST_SYSTEM_MANIFEST =
  'https://github.com/deltagreen-foundryvtt/delta-green-foundry-vtt-system/releases/download/v1.7.0/system.json'

const TEST_MODULE_IDS = ['quench', 'modern-names', 'modern-names-tests']

/** Match docker-compose FOUNDRY_VERSION / CI FOUNDRY_CACHE_VERSION to avoid migration prompts. */
const FOUNDRY_CORE_VERSION = process.env.FOUNDRY_CORE_VERSION || '14.364'

const WORLD_DATA_DIRS = [
  'actors',
  'cards',
  'combats',
  'effects',
  'folders',
  'fog',
  'items',
  'journal',
  'macros',
  'messages',
  'playlists',
  'scenes',
  'settings',
  'tables',
  'users'
]

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`)
  }
  return res.json()
}

async function downloadFile(url, destPath) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} downloading ${url}`)
  }
  const buf = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(destPath, buf)
}

function unzipInto(zipPath, extractDir) {
  fs.mkdirSync(extractDir, { recursive: true })
  execFileSync('unzip', ['-o', '-q', zipPath, '-d', extractDir], { stdio: 'inherit' })
}

/** Zip may contain manifest at root or under one folder (e.g. dist/). */
function findPackageRoot(extractDir, manifestFileName) {
  const direct = path.join(extractDir, manifestFileName)
  if (fs.existsSync(direct)) {
    return extractDir
  }
  for (const name of fs.readdirSync(extractDir)) {
    const sub = path.join(extractDir, name)
    if (fs.statSync(sub).isDirectory() && fs.existsSync(path.join(sub, manifestFileName))) {
      return sub
    }
  }
  throw new Error(`${manifestFileName} not found under ${extractDir} after unzip`)
}

function copyTree(srcDir, destDir) {
  clearDir(destDir)
  fs.cpSync(srcDir, destDir, { recursive: true })
}

function clearDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
  fs.mkdirSync(dir, { recursive: true })
}

async function installFromZipManifest({
  manifestUrl,
  downloadUrlOverride,
  destDir,
  manifestFileName,
  label
}) {
  const manifest = await fetchJson(manifestUrl)
  const downloadUrl = downloadUrlOverride ?? manifest.download
  if (!downloadUrl) {
    throw new Error(`No download URL for ${label}`)
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `${label}-install-`))
  const zipPath = path.join(tmpDir, 'package.zip')
  const extractDir = path.join(tmpDir, 'extract')

  try {
    console.log(`Downloading ${label} from`, downloadUrl)
    await downloadFile(downloadUrl, zipPath)
    unzipInto(zipPath, extractDir)
    const packageRoot = findPackageRoot(extractDir, manifestFileName)
    copyTree(packageRoot, destDir)
    console.log(`Installed ${label} to`, destDir)
    return manifest
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

function readInstalledManifest(destDir, manifestFileName) {
  const p = path.join(destDir, manifestFileName)
  if (!fs.existsSync(p)) return null
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

async function ensureTestSystem(systemsRoot, options) {
  const manifestUrl = options.testSystemManifestUrl ?? DEFAULT_TEST_SYSTEM_MANIFEST

  let manifest
  try {
    manifest = await fetchJson(manifestUrl)
  } catch (err) {
    const fallbackDir = path.join(systemsRoot, 'deltagreen')
    const existing = readInstalledManifest(fallbackDir, 'system.json')
    if (existing) {
      console.warn(
        `Could not fetch test system manifest (${err.message}); using ${fallbackDir}`
      )
      return existing
    }
    throw err
  }

  const destDir = path.join(systemsRoot, manifest.id)

  try {
    await installFromZipManifest({
      manifestUrl,
      downloadUrlOverride: options.testSystemDownloadUrl,
      destDir,
      manifestFileName: 'system.json',
      label: 'test system'
    })
    return manifest
  } catch (err) {
    const existing = readInstalledManifest(destDir, 'system.json')
    if (existing) {
      console.warn(
        `Could not refresh test system (${err.message}); using existing ${destDir}`
      )
      return existing
    }
    throw err
  }
}

function worldIdFromTitle(title) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'test-world'
}

function syncWorldCoreVersion(world) {
  world.coreVersion = FOUNDRY_CORE_VERSION
  world.compatibility = {
    ...(world.compatibility ?? {}),
    minimum: '14',
    verified: '14'
  }
}

function enableModulesInWorld(worldJsonPath, moduleVersions) {
  const raw = fs.readFileSync(worldJsonPath, 'utf8')
  const world = JSON.parse(raw)
  syncWorldCoreVersion(world)
  world.modules = world.modules ?? {}
  for (const id of TEST_MODULE_IDS) {
    const version = moduleVersions[id]
    world.modules[id] = {
      ...(world.modules[id] ?? {}),
      id,
      type: 'module',
      enabled: true,
      ...(version ? { version } : {})
    }
    delete world.modules[id].disabled
  }
  fs.writeFileSync(worldJsonPath, JSON.stringify(world, null, 2) + '\n', 'utf8')
}

function findWorldJsonPath(worldsRoot, testWorldName) {
  if (!testWorldName || !fs.existsSync(worldsRoot)) {
    return null
  }

  const byFolder = path.join(worldsRoot, testWorldName, 'world.json')
  if (fs.existsSync(byFolder)) {
    return byFolder
  }

  const bySlug = path.join(worldsRoot, worldIdFromTitle(testWorldName), 'world.json')
  if (fs.existsSync(bySlug)) {
    return bySlug
  }

  for (const entry of fs.readdirSync(worldsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const worldJson = path.join(worldsRoot, entry.name, 'world.json')
    if (!fs.existsSync(worldJson)) continue
    try {
      const world = JSON.parse(fs.readFileSync(worldJson, 'utf8'))
      if (world.title === testWorldName || world.id === testWorldName) {
        return worldJson
      }
    } catch {
      //
    }
  }
  return null
}

function createTestWorld(worldsRoot, title, systemManifest) {
  const worldId = worldIdFromTitle(title)
  const worldDir = path.join(worldsRoot, worldId)
  const worldJsonPath = path.join(worldDir, 'world.json')

  if (fs.existsSync(worldJsonPath)) {
    return worldJsonPath
  }

  fs.mkdirSync(path.join(worldDir, 'data'), { recursive: true })
  for (const sub of WORLD_DATA_DIRS) {
    fs.mkdirSync(path.join(worldDir, 'data', sub), { recursive: true })
  }

  const world = {
    title,
    id: worldId,
    system: systemManifest.id,
    systemVersion: systemManifest.version,
    coreVersion: FOUNDRY_CORE_VERSION,
    compatibility: {
      minimum: '14',
      verified: '14'
    },
    playtime: 0,
    description: 'Auto-created for Modern Names Quench/Cypress tests',
    flags: {},
    modules: {}
  }

  fs.writeFileSync(worldJsonPath, JSON.stringify(world, null, 2) + '\n', 'utf8')
  console.log('Created test world:', worldDir)
  return worldJsonPath
}

function ensureTestWorld(worldsRoot, title, systemManifest, moduleVersions) {
  let worldJsonPath = findWorldJsonPath(worldsRoot, title)
  if (!worldJsonPath) {
    worldJsonPath = createTestWorld(worldsRoot, title, systemManifest)
  }
  enableModulesInWorld(worldJsonPath, moduleVersions)
  console.log('Enabled test modules in world:', title, worldJsonPath)
  return worldJsonPath
}

/** Quench 0.10.0 manifest targets v13; mark v14 so Foundry activates it on core 14 worlds. */
function patchQuenchForCore14(quenchDir) {
  const manifestPath = path.join(quenchDir, 'module.json')
  if (!fs.existsSync(manifestPath)) return
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  manifest.compatibility = {
    ...(manifest.compatibility ?? {}),
    minimum: '13.341',
    verified: '14'
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
}

async function main() {
  const {
    testWorldName,
    quenchManifestUrl,
    quenchDownloadUrl,
    testSystemManifestUrl,
    testSystemDownloadUrl
  } = developmentOptions

  const resolvedUserData = resolveUserDataPath(developmentOptions)
  if (!resolvedUserData) {
    console.error('fvtt.config.js: userDataPath missing or invalid')
    process.exit(1)
  }
  fs.mkdirSync(resolvedUserData, { recursive: true })

  if (!testWorldName) {
    console.error('fvtt.config.js: testWorldName is required')
    process.exit(1)
  }
  try {
    const { loadRepoEnv } = await import('../cypress/load-repo-env.js')
    const envHost = loadRepoEnv().FOUNDRY_USERDATA_HOST
    if (envHost && path.resolve(envHost) !== resolvedUserData) {
      console.error(
        'Mismatch: fvtt.config.js userDataPath !== .env FOUNDRY_USERDATA_HOST\n',
        '  fvtt.config.js:', resolvedUserData,
        '\n  .env:', path.resolve(envHost),
        '\nRun: node scripts/sync-env-from-fvtt-config.js'
      )
      process.exit(1)
    }
  } catch {
    //
  }

  const dataRoot = path.join(resolvedUserData, 'Data')
  const modulesDir = path.join(dataRoot, 'modules')
  const systemsRoot = path.join(dataRoot, 'systems')
  const worldsRoot = path.join(dataRoot, 'worlds')

  const quenchDir = path.join(modulesDir, 'quench')
  const quenchManifest = await installFromZipManifest({
    manifestUrl: quenchManifestUrl ?? DEFAULT_QUENCH_MANIFEST,
    downloadUrlOverride: quenchDownloadUrl,
    destDir: quenchDir,
    manifestFileName: 'module.json',
    label: 'Quench'
  })
  patchQuenchForCore14(quenchDir)

  const systemManifest = await ensureTestSystem(systemsRoot, {
    testSystemManifestUrl,
    testSystemDownloadUrl
  })

  const moduleVersions = {
    quench: quenchManifest.version,
    'modern-names': readLocalModuleVersion(path.join(modulesDir, 'modern-names', 'module.json')),
    'modern-names-tests': readLocalModuleVersion(
      path.join(modulesDir, 'modern-names-tests', 'module.json')
    )
  }

  ensureTestWorld(worldsRoot, testWorldName, systemManifest, moduleVersions)
}

function readLocalModuleVersion(moduleJsonPath) {
  try {
    if (!fs.existsSync(moduleJsonPath)) return undefined
    return JSON.parse(fs.readFileSync(moduleJsonPath, 'utf8')).version
  } catch {
    return undefined
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
