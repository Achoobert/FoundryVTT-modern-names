import * as fs from 'fs'
import * as path from 'path'
import { loadAll } from 'js-yaml'
import {
  createBinaryPack,
  copyPackToPacks,
  getRoot,
  processDocument
} from './pack-helpers.js'

const root = getRoot()

function loadManifest() {
  return JSON.parse(fs.readFileSync(path.join(root, 'module.json'), 'utf8'))
}

function packYamlPath(packName) {
  const match = packName.match(/^en-(.+)$/)
  if (!match) return null
  const yamlPath = path.join(root, 'compendiums', `en-${match[1]}.yaml`)
  return fs.existsSync(yamlPath) ? yamlPath : null
}

async function buildPack(pack) {
  const match = pack.path.match(/^packs\/(.+)$/)
  if (!match) {
    console.warn('Skipping pack (unexpected path):', pack.name)
    return
  }
  const folder = match[1]
  const yamlPath = packYamlPath(folder)
  if (!yamlPath) {
    console.warn('Skipping pack (no YAML):', folder)
    return
  }

  const yaml = fs.readFileSync(yamlPath, 'utf8')
  const yamlObject = loadAll(yaml)
  const collisions = {}
  const documents = yamlObject.filter(doc => doc).reduce((c, doc) => {
    const entity = processDocument(doc, pack.type, collisions)
    c[entity.id] = entity.value
    return c
  }, {})

  await createBinaryPack(folder, documents)
  const dest = path.join(root, 'packs', folder)
  copyPackToPacks(folder, dest)
  console.log('Generated:', dest, Object.keys(documents).length, 'documents')
}

async function main() {
  const manifest = loadManifest()
  if (!manifest.packs?.length) {
    throw new Error('No packs in module.json')
  }
  const packsDir = path.join(root, 'packs')
  if (!fs.existsSync(packsDir)) {
    fs.mkdirSync(packsDir)
  }
  for (const pack of manifest.packs) {
    await buildPack(pack)
  }
}

try {
  await main()
} catch (e) {
  console.error(e)
  process.exit(1)
}
