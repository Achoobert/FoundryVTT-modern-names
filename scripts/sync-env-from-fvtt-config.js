/**
 * Keep .env FOUNDRY_USERDATA_HOST aligned with fvtt.config.js userDataPath for Docker bind mount.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import developmentOptions from '../fvtt.config.js'
import { loadRepoEnv } from '../cypress/load-repo-env.js'
import { REPO_ROOT, resolveUserDataPath } from './fvtt-paths.js'

const root = REPO_ROOT
process.chdir(root)

const userDataPath = resolveUserDataPath(developmentOptions)
if (!userDataPath) {
  console.error('fvtt.config.js: userDataPath is required')
  process.exit(1)
}

fs.mkdirSync(userDataPath, { recursive: true })

const envPath = path.join(root, '.env')
const existing = loadRepoEnv()
const lines = []

if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, 'utf8')
  let replaced = false
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      lines.push(line)
      continue
    }
    const eq = trimmed.indexOf('=')
    if (eq === -1) {
      lines.push(line)
      continue
    }
    const key = trimmed.slice(0, eq).trim()
    if (key === 'FOUNDRY_USERDATA_HOST') {
      lines.push(`FOUNDRY_USERDATA_HOST=${userDataPath}`)
      replaced = true
    } else {
      lines.push(line)
    }
  }
  if (!replaced) {
    lines.push(`FOUNDRY_USERDATA_HOST=${userDataPath}`)
  }
} else {
  lines.push('# Synced from fvtt.config.js — edit secrets here')
  lines.push(`FOUNDRY_USERDATA_HOST=${userDataPath}`)
  lines.push(`FOUNDRY_WORLD=${existing.FOUNDRY_WORLD || developmentOptions.testWorldName || 'modern-names-test'}`)
  lines.push('FOUNDRY_USERNAME=')
  lines.push('FOUNDRY_PASSWORD=')
  lines.push('FOUNDRY_ADMIN_KEY=')
}

fs.writeFileSync(envPath, lines.filter((l, i, a) => !(i === a.length - 1 && l === '')).join('\n') + '\n', 'utf8')
console.log('Wrote .env FOUNDRY_USERDATA_HOST=', userDataPath)

const prev = existing.FOUNDRY_USERDATA_HOST ? path.resolve(existing.FOUNDRY_USERDATA_HOST) : null
if (prev && prev !== userDataPath) {
  console.warn(
    'Note: Docker was using a different userdata folder before. Restart the container after startDevEnv.'
  )
}
