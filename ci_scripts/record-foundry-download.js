import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
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

function isDefaultBranch() {
  const ref = process.env.GITHUB_REF
  return ref === 'refs/heads/main' || ref === 'refs/heads/master'
}

function appendStepSummary(markdown) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY
  if (!summaryPath) {
    return
  }
  fs.appendFileSync(summaryPath, markdown)
}

function commitBadgesJson() {
  if (!isDefaultBranch()) {
    console.log('Skip badge commit (not default branch)')
    return
  }
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
  const ghaCacheHit = process.env.FOUNDRY_GHA_CACHE_HIT === 'true'
  const { sitePull, reason: classificationReason } = classifyFoundryBoot({
    logs,
    zipsBefore,
    zipsAfter,
    ghaCacheHit
  })

  const bump = shouldBumpRepoCounters()
  let bumpResult = 'none'
  let bumpError = ''

  console.log('Foundry stats:', {
    sitePull,
    classificationReason,
    ghaCacheHit,
    bump,
    zipsBefore: zipsBefore.length,
    zipsAfter,
    zipsAfterCount: zipsAfter.length
  })

  if (bump) {
    try {
      if (sitePull) {
        const next = await incrementRepoVariable(VAR_FOUNDRY_PULLS, 1)
        console.log(`${VAR_FOUNDRY_PULLS} → ${next}`)
        bumpResult = `${VAR_FOUNDRY_PULLS}=${next}`
      } else if (ghaCacheHit && process.env.GITHUB_ACTIONS === 'true') {
        const cacheVar = await resolveGhaCacheVariableName()
        const next = await incrementRepoVariable(cacheVar, 1)
        console.log(`${cacheVar} → ${next}`)
        bumpResult = `${cacheVar}=${next}`
      } else {
        console.log('No counter change (no site pull; GHA cache miss or not applicable).')
        bumpResult = 'no change'
      }
    } catch (e) {
      bumpError = e instanceof Error ? e.message : String(e)
      console.warn('Could not update repository variables:', bumpError)
      if (sitePull && process.env.RECORD_FOUNDRY_STATS === '1') {
        console.warn(
          'Local site pull: run `gh auth login` (repo admin) or set GITHUB_TOKEN, then `npm run record-foundry-stats`.'
        )
      }
    }
  } else if (sitePull) {
    console.log('Foundry site pull detected (stats bump skipped for this context).')
  }

  if (process.env.GITHUB_ACTIONS === 'true') {
    appendStepSummary(
      [
        '## Foundry distribution cache',
        '',
        `| Field | Value |`,
        `| --- | --- |`,
        `| GHA restore cache-hit | \`${process.env.FOUNDRY_GHA_CACHE_HIT || '(empty = miss)'}\` |`,
        `| Site pull this boot | ${sitePull} |`,
        `| Classification | \`${classificationReason}\` |`,
        `| Zips before boot | ${zipsBefore.length} |`,
        `| Zips after boot | ${zipsAfter.join(', ') || '(none)'} |`,
        `| Counter bump | ${bumpResult} |`,
        bumpError ? `| Variable API error | ${bumpError} |` : '',
        '',
        'Counters: `FOUNDRY_PULLS` (site download), `FOUNDRY_USED_FROM_CACHE` (GHA dist cache hit, no site pull).',
        ''
      ]
        .filter(Boolean)
        .join('\n')
    )
  }

  if (syncBadges || bump) {
    await writeBadgesJson()
  }

  if (commitBadges && bump && process.env.GITHUB_ACTIONS === 'true') {
    commitBadgesJson()
  }
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href

if (isMain) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
