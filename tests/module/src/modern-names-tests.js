/* global Hooks */
import registerApi from './quench/batches/api.js'
import registerCompendiums from './quench/batches/compendiums.js'
import registerRolls from './quench/batches/rolls.js'

const BATCH_REGISTRARS = [
  registerApi,
  registerCompendiums,
  registerRolls
]

Hooks.on('quenchReady', (quench) => {
  for (const register of BATCH_REGISTRARS) {
    register(quench)
  }
})
