import * as fs from 'node:fs'
import * as path from 'node:path'
import { REPO_ROOT } from './fvtt-paths.js'
import {
  VAR_FOUNDRY_PULLS,
  BADGES_JSON
} from './foundry-stats-constants.js'
import {
  getRepoVariable,
  resolveGhaCacheVariableName
} from './bump-repo-variable.js'

export async function readBadgeCounts() {
  const pulls = Number(await getRepoVariable(VAR_FOUNDRY_PULLS)) || 0
  const cacheVar = await resolveGhaCacheVariableName()
  const ghaCacheHits = Number(await getRepoVariable(cacheVar)) || 0
  return { pulls, ghaCacheHits }
}

export async function writeBadgesJson(counts = null) {
  const { pulls, ghaCacheHits } = counts ?? (await readBadgeCounts())
  const outPath = path.join(REPO_ROOT, BADGES_JSON)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  const payload = { pulls, ghaCacheHits }
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`)
  console.log(`Wrote ${BADGES_JSON}:`, payload)
  return payload
}
