import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { ClassicLevel } from 'classic-level'

/**
 * @param {Record<string, true>} collisions
 * @param {string} idSource
 */
export function generateBuildConsistentID(collisions, idSource) {
  const id = crypto.createHash('md5').update(idSource).digest('base64').replace(/[\\+=/]/g, '').substring(0, 16)
  if (collisions[id]) {
    throw new Error('ID collision on ' + idSource)
  }
  collisions[id] = true
  return id
}

const rootFolder = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

export function getRoot() {
  return rootFolder
}

/**
 * @param {string} folder pack folder name e.g. en-roll-tables
 * @param {Record<string, object>} json
 */
export async function createBinaryPack(folder, json) {
  const binaryRoot = path.join(rootFolder, 'binary-packs')
  if (!fs.existsSync(binaryRoot)) {
    fs.mkdirSync(binaryRoot)
  }
  const packPath = path.join(binaryRoot, folder)
  if (fs.existsSync(packPath)) {
    await ClassicLevel.destroy(packPath)
  }

  const groups = {
    pages: /^!(journal)!([a-zA-Z0-9]{16})$/,
    results: /^!(tables)!([a-zA-Z0-9]{16})$/
  }

  const batch = Object.keys(json).reduce((c, i) => {
    const all = { [i]: JSON.parse(JSON.stringify(json[i])) }
    for (const key in groups) {
      const array = i.match(groups[key])
      if (array) {
        for (const offset in json[i][key]) {
          const arrayKey = '!' + array[1] + '.' + key + '!' + array[2] + '.' + json[i][key][offset]._id
          all[arrayKey] = json[i][key][offset]
          all[i][key][offset] = json[i][key][offset]._id
        }
      }
    }
    for (const key in all) {
      c.push({ type: 'put', key, value: all[key], valueEncoding: 'json' })
    }
    return c
  }, [])

  const db = new ClassicLevel(packPath, { keyEncoding: 'utf8', valueEncoding: 'json' })
  await db.batch(batch, { valueEncoding: 'utf8' })
  await db.close()
}

/**
 * @param {string} folder
 * @param {string} destFolder packs/<folder>
 */
export function copyPackToPacks(folder, destFolder) {
  const src = path.join(rootFolder, 'binary-packs', folder)
  if (fs.existsSync(destFolder)) {
    fs.rmSync(destFolder, { recursive: true, force: true })
  }
  fs.cpSync(src, destFolder, { recursive: true })
}

/**
 * @param {object} doc
 * @param {string} packType RollTable | Macro
 * @param {Record<string, true>} collisions
 */
export function processDocument(doc, packType, collisions = {}) {
  if (doc.type === 'folder') {
    if (!doc._id) {
      throw new Error(`Folder "${doc.name}" missing _id`)
    }
    const folderDoc = { ...doc, type: packType }
    return {
      id: '!folders!' + doc._id,
      value: folderDoc
    }
  }

  if (!doc._id) {
    throw new Error(`Document "${doc.name ?? '?'}" missing _id`)
  }

  let idKey = packType.toLowerCase() + 's'
  if (packType === 'RollTable') {
    idKey = 'tables'
    doc.type = 'RollTable'
    if (doc.results) {
      let range = 0
      for (const offset in doc.results) {
        const result = doc.results[offset]
        if (!result._id) {
          result._id = generateBuildConsistentID(
            collisions,
            `${doc._id}-result-${offset}-${result.name ?? ''}`
          )
        }
        if (!result.range) {
          range++
          result.range = [range, range]
        } else {
          range = result.range[1]
        }
        if (result.type === 'text') {
          const desc = result.description ?? ''
          result.text = desc
            ? '<strong>' + result.name + '</strong> ' + desc
            : (result.name ?? result.text ?? '')
        }
      }
      if (!doc.formula) {
        doc.formula = '1d' + range
      }
    }
  }

  if (packType === 'Macro') {
    doc.type = doc.type ?? 'script'
  }

  return {
    id: '!' + idKey + '!' + doc._id,
    value: doc
  }
}
