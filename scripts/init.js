import { MODULE_ID } from './table-ids.js'
import { applyRandomName, resetTokenNames } from './namer.js'
import { applyTraits } from './traits.js'
import { registerStatusEffects } from './status-effects.js'

Hooks.once('init', () => {
  game.modules.get(MODULE_ID).api = {
    applyRandomName,
    resetTokenNames,
    applyTraits
  }
})

Hooks.once('setup', registerStatusEffects)
