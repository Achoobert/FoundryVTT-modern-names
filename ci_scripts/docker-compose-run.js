/**
 * Run docker compose with FOUNDRY_USERDATA_HOST forced from repo .env (absolute).
 * Shell exports of ./foundrydata override --env-file and resolve under docker/.
 */
import { execFileSync } from 'node:child_process'
import * as path from 'node:path'
import { pathToFileURL } from 'node:url'
import { REPO_ROOT } from './fvtt-paths.js'
import { resolveExpectedUserdataHost } from './ensure-docker-userdata-mount.js'

export function dockerComposeEnv() {
  return {
    ...process.env,
    FOUNDRY_USERDATA_HOST: resolveExpectedUserdataHost()
  }
}

export function runDockerCompose(composeArgs, { stdio = 'inherit' } = {}) {
  const envFile = path.join(REPO_ROOT, '.env')
  execFileSync(
    'docker',
    ['compose', '--project-directory', 'docker', '--env-file', envFile, ...composeArgs],
    { cwd: REPO_ROOT, stdio, env: dockerComposeEnv() }
  )
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href

if (isMain) {
  runDockerCompose(process.argv.slice(2))
}
