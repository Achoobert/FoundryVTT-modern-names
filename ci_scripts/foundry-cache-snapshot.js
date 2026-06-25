import * as fs from 'node:fs'
import * as path from 'node:path'
import { REPO_ROOT } from './fvtt-paths.js'
import { CONTAINER_CACHE_DIR, SNAPSHOT_FILE } from './foundry-stats-constants.js'

const cacheDir = path.join(REPO_ROOT, CONTAINER_CACHE_DIR)

function listZipNames() {
  if (!fs.existsSync(cacheDir)) {
    return []
  }
  return fs
    .readdirSync(cacheDir)
    .filter((f) => f.endsWith('.zip'))
    .sort()
}

const snapshot = {
  zipsBefore: listZipNames(),
  recordedAt: new Date().toISOString()
}

const outPath = path.join(REPO_ROOT, SNAPSHOT_FILE)
fs.writeFileSync(outPath, `${JSON.stringify(snapshot, null, 2)}\n`)
console.log(`Wrote ${SNAPSHOT_FILE} (${snapshot.zipsBefore.length} zip(s) in ${CONTAINER_CACHE_DIR})`)
