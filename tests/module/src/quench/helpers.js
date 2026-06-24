/* global game */

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

export async function getTableDoc (packCollection, tableId) {
  const pack = requirePack(packCollection)
  return pack.getDocument(tableId)
}
