import {
  PACK_ROLL_TABLES,
  TABLE_AMERICAN_LAST,
  TABLE_AMERICAN_MALE,
  getTableDoc
} from '../helpers.js'

export default function register (quench) {
  quench.registerBatch(
    'modern-names.rolls',
    (context) => {
      const { describe, it, assert } = context

      describe('Roll table draws', function () {
        it('draws first and last names from american tables', async function () {
          const male = await getTableDoc(PACK_ROLL_TABLES, TABLE_AMERICAN_MALE)
          const last = await getTableDoc(PACK_ROLL_TABLES, TABLE_AMERICAN_LAST)
          const firstDraw = await male.draw({ displayChat: false })
          const lastDraw = await last.draw({ displayChat: false })
          assert.isAtLeast(firstDraw.results.length, 1)
          assert.isAtLeast(lastDraw.results.length, 1)
          assert.isString(firstDraw.results[0].name)
          assert.isString(lastDraw.results[0].name)
          assert.isAbove(firstDraw.results[0].name.length, 0)
          assert.isAbove(lastDraw.results[0].name.length, 0)
        })
      })
    },
    { displayName: 'Roll draws' }
  )
}
