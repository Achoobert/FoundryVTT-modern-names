import { MODULE_ID } from './table-ids.js'
import { applyRandomName, resetTokenNames } from './namer.js'

Hooks.once('init', () => {
  game.modules.get(MODULE_ID).api = {
    applyRandomName,
    resetTokenNames
  }
})
