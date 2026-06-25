/**
 * CI: after first Foundry boot, ensure GHA cache paths contain a real distribution.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { REPO_ROOT } from './fvtt-paths.js'
import { CONTAINER_CACHE_DIR } from './foundry-stats-constants.js'

const cacheDir = path.join(REPO_ROOT, CONTAINER_CACHE_DIR)
const resourcesDir = path.join(REPO_ROOT, 'foundrydata', 'resources')

function hasZipInCache() {
  if (!fs.existsSync(cacheDir)) {
    return false
  }
  return fs.readdirSync(cacheDir).some((f) => f.endsWith('.zip'))
}

function hasExtractedResources() {
  const appDir = path.join(resourcesDir, 'app')
  if (!fs.existsSync(appDir)) {
    return false
  }
  return (
    fs.existsSync(path.join(appDir, 'package.json')) ||
    fs.existsSync(path.join(appDir, 'main.js'))
  )
}

const zipOk = hasZipInCache()
const resourcesOk = hasExtractedResources()

if (!zipOk && !resourcesOk) {
  console.error(
    'Foundry distribution cache verify failed: no zip in',
    CONTAINER_CACHE_DIR,
    'and no extracted app under foundrydata/resources/app'
  )
  process.exit(1)
}

console.log('Foundry distribution cache OK:', {
  zipInContainerCache: zipOk,
  resourcesApp: resourcesOk
})
