import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { REPO_ROOT } from './fvtt-paths.js'
import {
  CONTAINER,
  CONTAINER_CACHE_DIR,
  SNAPSHOT_FILE
} from './foundry-stats-constants.js'

/** felddy/foundryvtt:14 — calibrate if image changes. Auth/install lines are not site pulls. */
const SITE_PULL_LOG =
  /download(?:ing)?\s+(?:the\s+)?(?:Foundry|release|build)/i

function readSnapshot() {
  const p = path.join(REPO_ROOT, SNAPSHOT_FILE)
  if (!fs.existsSync(p)) {
    return { zipsBefore: [] }
  }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    return { zipsBefore: [] }
  }
}

function listZipNames() {
  const cacheDir = path.join(REPO_ROOT, CONTAINER_CACHE_DIR)
  if (!fs.existsSync(cacheDir)) {
    return []
  }
  return fs
    .readdirSync(cacheDir)
    .filter((f) => f.endsWith('.zip'))
    .sort()
}

function dockerLogs(tail = 200) {
  try {
    return execFileSync('docker', ['logs', '--tail', String(tail), CONTAINER], {
      encoding: 'utf8'
    })
  } catch (e) {
    console.warn('Could not read docker logs:', e.message)
    return ''
  }
}

export function classifyFoundryBoot({ logs, zipsBefore, zipsAfter, ghaCacheHit }) {
  const newZips = zipsAfter.filter((z) => !zipsBefore.includes(z))

  if (newZips.length > 0) {
    return { sitePull: true, reason: 'new_zip' }
  }
  if (ghaCacheHit && newZips.length === 0) {
    return { sitePull: false, reason: 'gha_cache_hit' }
  }
  if (SITE_PULL_LOG.test(logs)) {
    return { sitePull: true, reason: 'log' }
  }
  return { sitePull: false, reason: 'none' }
}

export function foundryAccessVia({ sitePull, reason }) {
  if (reason === 'gha_cache_hit') {
    return 'github-actions-cache'
  }
  if (sitePull) {
    return 'foundry.com'
  }
  return 'local-container-cache'
}

function writeGithubOutput(name, value) {
  const outputPath = process.env.GITHUB_OUTPUT
  if (!outputPath) {
    return
  }
  fs.appendFileSync(outputPath, `${name}=${value}\n`)
}

function main() {
  const snapshot = readSnapshot()
  const zipsBefore = snapshot.zipsBefore ?? []
  const zipsAfter = listZipNames()
  const logs = dockerLogs()
  const ghaCacheHit = process.env.FOUNDRY_GHA_CACHE_HIT === 'true'
  const { sitePull, reason: classificationReason } = classifyFoundryBoot({
    logs,
    zipsBefore,
    zipsAfter,
    ghaCacheHit
  })
  const accessVia = foundryAccessVia({ sitePull, reason: classificationReason })

  console.log('Foundry stats:', {
    sitePull,
    classificationReason,
    ghaCacheHit,
    foundryAccessVia: accessVia,
    zipsBefore: zipsBefore.length,
    zipsAfter,
    zipsAfterCount: zipsAfter.length
  })

  writeGithubOutput('foundry-access-via', accessVia)
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href

if (isMain) {
  main()
}
