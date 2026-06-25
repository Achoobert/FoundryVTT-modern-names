import { execFileSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { REPO_ROOT } from './fvtt-paths.js'
import {
  CONTAINER,
  CONTAINER_CACHE_DIR,
  SNAPSHOT_FILE,
  VAR_FOUNDRY_PULLS
} from './foundry-stats-constants.js'
import {
  incrementRepoVariable,
  resolveGhaCacheVariableName,
  shouldBumpRepoCounters
} from './bump-repo-variable.js'
import { writeBadgesJson } from './sync-foundry-badges-json.js'

/** felddy/foundryvtt:14 — calibrate if image changes. */
const SITE_PULL_LOG =
  /(?:download(?:ing)?\s+(?:the\s+)?(?:Foundry|release|build)|Installing\s+Foundry\s+Virtual\s+Tabletop|\.zip\b.*download)/i
const CACHED_LOG =
  /(?:using\s+cached|already\s+(?:downloaded|cached)|found\s+in\s+cache|skipping\s+download)/i

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

export function classifyFoundryBoot({ logs, zipsBefore, zipsAfter }) {
  const hadZipBefore = zipsBefore.length > 0
  const newZips = zipsAfter.filter((z) => !zipsBefore.includes(z))
  const logSaysPull = SITE_PULL_LOG.test(logs)
  const logSaysCached = CACHED_LOG.test(logs)

  if (logSaysPull || newZips.length > 0) {
    return { sitePull: true, ghaCacheHit: false }
  }
  if (logSaysCached || (hadZipBefore && zipsAfter.length > 0)) {
    return { sitePull: false, ghaCacheHit: false }
  }
  return { sitePull: false, ghaCacheHit: false }
}

function commitBadgesJson() {
  const badgesPath = path.join(REPO_ROOT, 'stats/foundry-badges.json')
  try {
    execFileSync('git', ['add', badgesPath], { cwd: REPO_ROOT })
    execFileSync('git', ['diff', '--staged', '--quiet', '--', badgesPath], {
      cwd: REPO_ROOT,
      stdio: 'ignore'
    })
    console.log('stats/foundry-badges.json unchanged; skip commit')
    return
  } catch {
    /* staged diff exists */
  }
  execFileSync(
    'git',
    ['config', 'user.name', 'github-actions[bot]'],
    { cwd: REPO_ROOT }
  )
  execFileSync(
    'git',
    ['config', 'user.email', 'github-actions[bot]@users.noreply.github.com'],
    { cwd: REPO_ROOT }
  )
  execFileSync(
    'git',
    ['commit', '-m', 'chore: sync Foundry stats badges [skip ci]\n'],
    { cwd: REPO_ROOT, stdio: 'inherit' }
  )
  execFileSync('git', ['push'], { cwd: REPO_ROOT, stdio: 'inherit' })
}

async function main() {
  const args = new Set(process.argv.slice(2))
  const syncBadges = args.has('--sync-badges')
  const commitBadges = args.has('--commit-badges')

  const snapshot = readSnapshot()
  const zipsBefore = snapshot.zipsBefore ?? []
  const zipsAfter = listZipNames()
  const logs = dockerLogs()
  const { sitePull } = classifyFoundryBoot({ logs, zipsBefore, zipsAfter })

  const ghaCacheHit = process.env.FOUNDRY_GHA_CACHE_HIT === 'true'
  const bump = shouldBumpRepoCounters()

  console.log('Foundry stats:', {
    sitePull,
    ghaCacheHit,
    bump,
    zipsBefore: zipsBefore.length,
    zipsAfter: zipsAfter.length
  })

  if (bump) {
    try {
      if (sitePull) {
        const next = await incrementRepoVariable(VAR_FOUNDRY_PULLS, 1)
        console.log(`${VAR_FOUNDRY_PULLS} → ${next}`)
      } else if (ghaCacheHit && process.env.GITHUB_ACTIONS === 'true') {
        const cacheVar = await resolveGhaCacheVariableName()
        const next = await incrementRepoVariable(cacheVar, 1)
        console.log(`${cacheVar} → ${next}`)
      } else {
        console.log('No counter change (no site pull; GHA cache miss or not applicable).')
      }
    } catch (e) {
      console.warn('Could not update repository variables:', e.message)
      if (process.env.GITHUB_ACTIONS === 'true') {
        process.exit(1)
      }
      if (sitePull && process.env.RECORD_FOUNDRY_STATS === '1') {
        console.warn(
          'Local site pull: run `gh auth login` (repo admin) or set GITHUB_TOKEN, then `npm run record-foundry-stats`.'
        )
      }
    }
  } else if (sitePull) {
    console.log('Foundry site pull detected (stats bump skipped for this context).')
  }

  if (syncBadges || bump) {
    await writeBadgesJson()
  }

  if (commitBadges && bump && process.env.GITHUB_ACTIONS === 'true') {
    commitBadgesJson()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
