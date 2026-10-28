import { TRAIT_TABLE_IDS } from './table-ids.js'
import { tableUuid } from './namer.js'

/** Actor field that holds free-text notes, by game.system.id. */
const NOTES_FIELD = {
  CoC7: { path: 'system.biography.personalDescription.value', html: true },
  'blades-in-the-dark': { path: 'system.notes', html: false },
  blades68: { path: 'system.notes', html: false }
}

/**
 * Draw one result from each table and join them.
 * @param {string[]} tableIds
 * @returns {Promise<string|null>}
 */
export async function drawTraits (tableIds = TRAIT_TABLE_IDS) {
  const tables = await Promise.all(tableIds.map(id => fromUuid(tableUuid(id))))
  if (tables.some(table => !table)) {
    ui.notifications.error('Compendium table not found!')
    return null
  }
  const traits = []
  for (const table of tables) {
    const draw = await table.draw({ displayChat: false })
    if (!draw.results.length) return null
    traits.push(draw.results[0].name)
  }
  return traits.join(', ')
}

/**
 * Prepend random traits to the notes of each selected token's actor.
 * @param {string[]} tableIds
 */
export async function applyTraits (tableIds = TRAIT_TABLE_IDS) {
  const field = NOTES_FIELD[game.system.id]
  if (!field) {
    ui.notifications.warn(`Traits are not supported for system: ${game.system.id}`)
    return
  }
  const tokens = canvas.tokens.controlled
  if (!tokens.length) {
    ui.notifications.warn('No tokens were selected')
    return
  }
  const updates = []
  for (const token of tokens) {
    const traits = await drawTraits(tableIds)
    if (!traits) continue
    const old = foundry.utils.getProperty(token.actor, field.path) ?? ''
    const value = field.html
      ? `<p>${traits}</p>${old}`
      : (old ? `${traits} ${old}` : traits)
    updates.push(token.actor.update({ [field.path]: value }))
  }
  await Promise.all(updates)
  if (updates.length) {
    ui.notifications.info(`Updated ${updates.length} actor traits.`)
  }
}
