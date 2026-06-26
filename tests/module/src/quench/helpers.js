/* global game, fromUuid */

export const MODULE_ID = 'modern-names'
export const PACK_ROLL_TABLES = `${MODULE_ID}.en-roll-tables`
export const PACK_MACROS = `${MODULE_ID}.en-macros`

/** American male first name table (stable _id from compendium YAML). */
export const TABLE_AMERICAN_MALE = 'yvXk3GTSA9adwv1z'
export const TABLE_AMERICAN_LAST = 'QwGXBkSLea1sJEvK'

export function requirePack (collection) {
  const pack = game.packs.get(collection)
  if (!pack) {
    throw new Error('Missing compendium pack: ' + collection)
  }
  return pack
}

/**
 * Compendium RollTables store result ids in pack data; the live `results` collection
 * may be unset until the document is fully resolved (use fromUuid when possible).
 */
export function tableResultCount(table) {
  const collection = table.results
  if (collection != null) {
    if (typeof collection.size === 'number') return collection.size
    if (typeof collection.length === 'number') return collection.length
  }
  const sourceResults = table._source?.results
  if (Array.isArray(sourceResults)) return sourceResults.length
  const formula = table.formula ?? table._source?.formula
  const m = typeof formula === 'string' && formula.match(/^1d(\d+)$/i)
  if (m) return Number(m[1], 10)
  return 0
}

export async function getTableDoc (packCollection, tableId) {
  const uuid = `Compendium.${packCollection}.RollTable.${tableId}`
  if (typeof fromUuid === 'function') {
    const doc = await fromUuid(uuid)
    if (doc) return doc
  }
  const pack = requirePack(packCollection)
  const table = await pack.getDocument(tableId)
  if (table.results == null && typeof table.prepareEmbeddedDocuments === 'function') {
    await table.prepareEmbeddedDocuments()
  }
  return table
}
