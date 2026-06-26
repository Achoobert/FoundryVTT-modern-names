/**
 * Fail fast if Quench / Delta Green / test world / module builds are missing on disk.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { pathToFileURL } from 'node:url'
import developmentOptions from '../fvtt.config.js'
import { loadRepoEnv } from '../cypress/load-repo-env.js'
import { REPO_ROOT, resolveUserDataPath } from './fvtt-paths.js'

function worldIdFromTitle(title) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'test-world'
}

function resolveWorldJsonPath(worldsRoot, testWorldName) {
  const candidates = [
    path.join(worldsRoot, testWorldName, 'world.json'),
    path.join(worldsRoot, worldIdFromTitle(testWorldName), 'world.json')
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p
    }
  }
  if (!fs.existsSync(worldsRoot)) {
    return candidates[0]
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
  return candidates[0]
}

export function requiredE2ePaths(userDataRoot, testWorldName) {
  const dataRoot = path.join(userDataRoot, 'Data')
  return [
    path.join(dataRoot, 'systems', 'deltagreen', 'system.json'),
    resolveWorldJsonPath(path.join(dataRoot, 'worlds'), testWorldName),
    path.join(dataRoot, 'modules', 'quench', 'module.json'),
    path.join(dataRoot, 'modules', 'modern-names', 'module.json'),
    path.join(dataRoot, 'modules', 'modern-names-tests', 'module.json')
  ]
}

export function verifyE2eUserdata({ userDataRoot, testWorldName }) {
  const missing = []
  const checked = []
  for (const p of requiredE2ePaths(userDataRoot, testWorldName)) {
    checked.push(p)
    if (!fs.existsSync(p)) {
      missing.push(p)
    }
  }
  return { missing, checked }
}

function main() {
  const testWorldName = developmentOptions.testWorldName
  if (!testWorldName) {
    console.error('fvtt.config.js: testWorldName is required')
    process.exit(1)
  }

  const resolvedUserData = resolveUserDataPath(developmentOptions)
  if (!resolvedUserData) {
    console.error('fvtt.config.js: userDataPath missing or invalid')
    process.exit(1)
  }

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

  const { missing, checked } = verifyE2eUserdata({
    userDataRoot: resolvedUserData,
    testWorldName
  })

  for (const p of checked) {
    const rel = path.relative(REPO_ROOT, p)
    const ok = !missing.includes(p)
    console.log(ok ? 'OK' : 'MISSING', rel || p)
  }

  if (missing.length > 0) {
    console.error('\nE2E userdata incomplete under', resolvedUserData)
    console.error('Run: npm run install-quench')
    console.error('Run: npm run build:all  (modern-names + modern-names-tests modules)')
    process.exit(1)
  }

  console.log('E2E userdata OK')
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href

if (isMain) {
  main()
}
