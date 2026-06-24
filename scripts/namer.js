import { COMPENDIUM_PACK, MODULE_ID, TABLE_IDS } from './table-ids.js'

function tableUuid (tableId) {
  return `Compendium.${MODULE_ID}.${COMPENDIUM_PACK}.RollTable.${tableId}`
}

/**
 * @param {string} culture
 * @param {'male'|'female'} gender
 * @returns {Promise<string|null>}
 */
export async function drawFullName (culture, gender) {
  const tables = TABLE_IDS[culture]
  if (!tables) {
    ui.notifications.error(`Unknown culture: ${culture}`)
    return null
  }
  const firstId = gender === 'female' ? tables.female : tables.male
  const table1 = await fromUuid(tableUuid(firstId))
  const table2 = await fromUuid(tableUuid(tables.last))
  if (!table1 || !table2) {
    ui.notifications.error('Compendium table not found!')
    return null
  }
  const firstNameResult = await table1.draw({ displayChat: false })
  const lastNameResult = await table2.draw({ displayChat: false })
  if (!firstNameResult.results.length || !lastNameResult.results.length) {
    return null
  }
  const firstName = firstNameResult.results[0].name
  const lastName = lastNameResult.results[0].name
  return `${firstName} ${lastName}`
}

/**
 * @param {string} culture
 * @param {'male'|'female'} gender
 */
export async function applyToTokens (culture, gender) {
  const tokens = canvas.tokens.controlled
  if (!tokens.length) {
    ui.notifications.warn('No tokens were selected')
    return
  }
  const updates = []
  for (const token of tokens) {
    const randomName = await drawFullName(culture, gender)
    if (randomName) {
      updates.push({ _id: token.id, name: randomName })
    }
  }
  if (updates.length) {
    await canvas.scene.updateEmbeddedDocuments('Token', updates)
    ui.notifications.info(`Updated ${updates.length} token names.`)
  }
}

/**
 * @param {string} culture
 * @param {'male'|'female'} gender
 */
export async function applyToActors (culture, gender) {
  const tokens = canvas.tokens.controlled
  if (!tokens.length) {
    ui.notifications.warn('No tokens were selected')
    return
  }
  const updaterActors = []
  const updaterTokens = []
  for (const token of tokens) {
    const randomName = await drawFullName(culture, gender)
    if (!randomName) continue
    updaterActors.push({
      _id: token.actor.id,
      name: randomName,
      prototypeToken: { name: randomName }
    })
    updaterTokens.push({ _id: token.id, name: randomName })
  }
  for (const update of updaterActors) {
    await Actor.implementation.updateDocuments([update])
  }
  if (updaterTokens.length) {
    await canvas.scene.updateEmbeddedDocuments('Token', updaterTokens)
    ui.notifications.info(`Updated ${updaterActors.length} actor names.`)
  }
}

export function resetTokenNames () {
  const tokens = canvas.tokens.controlled
  if (!tokens.length) {
    ui.notifications.warn('No tokens were selected')
    return
  }
  const updates = tokens.map(token => ({
    _id: token.id,
    name: token.actor.name
  }))
  canvas.scene.updateEmbeddedDocuments('Token', updates)
}

/**
 * @param {string} culture
 * @param {'male'|'female'} gender
 * @param {'token'|'actor'} target
 */
export async function applyRandomName (culture, gender, target) {
  if (target === 'actor') {
    await applyToActors(culture, gender)
  } else {
    await applyToTokens(culture, gender)
  }
}
