/**
 * felddy/foundryvtt runs as uid 1000 — bind-mounted userdata must be owned 1000:1000
 * after host steps (webpack, install-quench) write as the current user (e.g. GHA runner).
 */
import { execFileSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadRepoEnv } from '../cypress/load-repo-env.js'

const FELDDY_UID = '1000'
const FELDDY_GID = '1000'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
process.chdir(root)

const env = loadRepoEnv()
const userDataPath = path.resolve(
  env.FOUNDRY_USERDATA_HOST || path.join(root, 'foundrydata')
)
const secretDir = path.join(root, 'docker', 'secret')

for (const dir of [userDataPath, secretDir]) {
  fs.mkdirSync(dir, { recursive: true })
}

for (const target of [userDataPath, secretDir]) {
  console.log(`chown -R ${FELDDY_UID}:${FELDDY_GID}`, target)
  execFileSync('sudo', ['chown', '-R', `${FELDDY_UID}:${FELDDY_GID}`, target], {
    stdio: 'inherit'
  })
}
