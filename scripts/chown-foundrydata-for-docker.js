/**
 * felddy/foundryvtt runs as uid 1000 — bind-mounted userdata must be owned 1000:1000
 * before Docker. After Foundry runs, use --for-host so install-quench (runner uid) can
 * replace cached modules under userdata.
 */
import { execFileSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadRepoEnv } from '../cypress/load-repo-env.js'

const FELDDY_UID = '1000'
const FELDDY_GID = '1000'
const forHost = process.argv.includes('--for-host')

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
process.chdir(root)

const env = loadRepoEnv()
const userDataPath = path.resolve(
  env.FOUNDRY_USERDATA_HOST || path.join(root, 'foundrydata')
)
const secretDir = path.join(root, 'docker', 'secret')
const containerCacheDir = path.join(root, 'docker', 'container_cache')

const ownerUid = forHost ? String(process.getuid()) : FELDDY_UID
const ownerGid = forHost ? String(process.getgid()) : FELDDY_GID

const mkdirDirs = forHost
  ? [userDataPath]
  : [userDataPath, secretDir, containerCacheDir]
const chownTargets = forHost
  ? [userDataPath]
  : [userDataPath, secretDir, containerCacheDir]

for (const dir of mkdirDirs) {
  fs.mkdirSync(dir, { recursive: true })
}

for (const target of chownTargets) {
  console.log(`chown -R ${ownerUid}:${ownerGid}`, target)
  execFileSync('sudo', ['chown', '-R', `${ownerUid}:${ownerGid}`, target], {
    stdio: 'inherit'
  })
}
