/* global Hooks */
import registerApi from './quench/batches/api.js'
import registerCompendiums from './quench/batches/compendiums.js'
import registerRolls from './quench/batches/rolls.js'
import registerStatusEffects from './quench/batches/status-effects.js'

const BATCH_REGISTRARS = [
  registerApi,
  registerCompendiums,
  registerRolls,
  registerStatusEffects
]

Hooks.on('quenchReady', (quench) => {
  for (const register of BATCH_REGISTRARS) {
    register(quench)
  }
})
