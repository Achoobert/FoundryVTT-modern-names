/* global game */

export default function register (quench) {
  quench.registerBatch(
    'modern-names.api',
    (context) => {
      const { describe, it, assert } = context

      describe('modern-names module API', function () {
        it('module is active and exposes api', function () {
          const mod = game.modules.get('modern-names')
          assert.isOk(mod?.active, 'modern-names should be enabled')
          assert.isObject(mod.api)
          assert.isFunction(mod.api.applyRandomName)
          assert.isFunction(mod.api.resetTokenNames)
        })
      })
    },
    { displayName: 'Module API' }
  )
}
