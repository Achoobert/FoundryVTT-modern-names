import {
  PACK_ROLL_TABLES,
  PACK_MACROS,
  TABLE_AMERICAN_MALE,
  getTableDoc,
  requirePack
} from '../helpers.js'

export default function register (quench) {
  quench.registerBatch(
    'modern-names.compendiums',
    (context) => {
      const { describe, it, assert } = context

      describe('Compendium packs', function () {
        it('roll table and macro packs exist and are indexed', async function () {
          const tables = requirePack(PACK_ROLL_TABLES)
          const macros = requirePack(PACK_MACROS)
          assert.equal(tables.documentName, 'RollTable')
          assert.equal(macros.documentName, 'Macro')
          await tables.getIndex()
          await macros.getIndex()
          assert.isAtLeast(tables.index.size, 1)
          assert.isAtLeast(macros.index.size, 1)
        })

        it('american male table has results', async function () {
          const table = await getTableDoc(PACK_ROLL_TABLES, TABLE_AMERICAN_MALE)
          assert.equal(table.name, 'Male first name, american')
          assert.isAtLeast(table.results.length, 100)
        })
      })
    },
    { displayName: 'Compendiums' }
  )
}
