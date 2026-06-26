/**
 * Ensure Foundry container bind-mounts /data to FOUNDRY_USERDATA_HOST from .env.
 * Recreates container when mount is stale (e.g. old relative path → docker/foundrydata).
 */
import { execFileSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadRepoEnv } from '../cypress/load-repo-env.js'
import { REPO_ROOT } from './fvtt-paths.js'
import { CONTAINER } from './foundry-stats-constants.js'
import { runDockerCompose } from './docker-compose-run.js'

export function resolveExpectedUserdataHost() {
  const env = loadRepoEnv()
  return path.resolve(env.FOUNDRY_USERDATA_HOST || path.join(REPO_ROOT, 'foundrydata'))
}

/** @param {Array<{ Destination?: string; Source?: string }>} mounts */
export function findDataMountSource(mounts) {
  if (!Array.isArray(mounts)) {
    return null
  }
  const dataMount = mounts.find((m) => m.Destination === '/data')
  return dataMount?.Source ? path.resolve(dataMount.Source) : null
}

export function mountsMatchExpected(actualSource, expectedHost) {
  if (!actualSource) {
    return false
  }
  return path.resolve(actualSource) === path.resolve(expectedHost)
}

function containerExists(name) {
  try {
    execFileSync('docker', ['inspect', name], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function readContainerDataMountSource(containerName) {
  const out = execFileSync(
    'docker',
    ['inspect', containerName, '--format', '{{json .Mounts}}'],
    { encoding: 'utf8' }
  )
  const mounts = JSON.parse(out.trim())
  return findDataMountSource(mounts)
}

function forceRecreateContainer() {
  console.log('Recreating Foundry container with current .env bind mounts…')
  runDockerCompose(['up', '-d', '--force-recreate'])
}

function main() {
  const expected = resolveExpectedUserdataHost()
  fs.mkdirSync(expected, { recursive: true })

  if (!containerExists(CONTAINER)) {
    console.log(`Container ${CONTAINER} not running; compose up will create it.`)
    return
  }

  const actual = readContainerDataMountSource(CONTAINER)
  if (mountsMatchExpected(actual, expected)) {
    console.log(`Docker /data mount OK: ${expected}`)
    return
  }

  console.warn('Foundry container /data bind mount does not match .env FOUNDRY_USERDATA_HOST')
  console.warn('  expected:', expected)
  console.warn('  actual:  ', actual ?? '(no /data mount)')
  forceRecreateContainer()

  const after = readContainerDataMountSource(CONTAINER)
  if (!mountsMatchExpected(after, expected)) {
    console.error('After recreate, /data mount still wrong. Check .env and docker-compose.yml.')
    process.exit(1)
  }
  console.log(`Docker /data mount fixed: ${after}`)
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href

if (isMain) {
  main()
}
