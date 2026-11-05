/* global CONFIG */

const EXPECTED = [
  'drinking',
  'inebriated',
  'high',
  'caffeinated',
  'hungover',
  'disguised',
  'smoking',
  'joint',
  'downers',
  'medicated',
  'cigar',
  'aroused'
]

export default function register (quench) {
  quench.registerBatch(
    'modern-names.status-effects',
    (context) => {
      const { describe, it, assert } = context

      describe('modern-names token status effects', function () {
        it('adds each effect once with a module icon', function () {
          for (const id of EXPECTED) {
            const matches = CONFIG.statusEffects.filter(effect => effect.id === id)
            assert.lengthOf(matches, 1, `${id} should be registered once`)
            assert.match(matches[0].img, /^modules\/modern-names\/assets\/icons\/.+\.svg$/)
          }
        })

        it('effect icons load from the server', async function () {
          for (const id of EXPECTED) {
            const { img } = CONFIG.statusEffects.find(effect => effect.id === id)
            const res = await fetch(img)
            assert.isTrue(res.ok, `${img} should load (got ${res.status})`)
          }
        })
      })
    },
    { displayName: 'Status Effects' }
  )
}
