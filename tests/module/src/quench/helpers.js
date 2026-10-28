

export const MODULE_ID = 'modern-names'
export const PACK_ROLL_TABLES = `${MODULE_ID}.en-roll-tables`
export const PACK_MACROS = `${MODULE_ID}.en-macros`


export const TABLE_AMERICAN_MALE = 'yvXk3GTSA9adwv1z'
export const TABLE_AMERICAN_LAST = 'QwGXBkSLea1sJEvK'


export const TRAIT_TABLES = {
  negative: '5Bl9rIcDVYK6GhIp',
  neutral: 'dahuMEmAVTq9uVeX',
  positive: '9mdeofNXuBKWd2sV'
}

export const CHARACTER_TABLES = {
  Look: '54l3EWfQe0lyXwH9',
  Style: 'Qr62AKxmnjbWaUus',
  Goal: 'jxmdtbzo5flZFS2Y',
  Method: 'uEhjEaUCxreG3UGk'
}

export function requirePack (collection) {
  const pack = game.packs.get(collection)
  if (!pack) {
    throw new Error('Missing compendium pack: ' + collection)
  }
  return pack
}


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
