import {
  PACK_ROLL_TABLES,
  PACK_MACROS,
  TABLE_AMERICAN_MALE,
  CHARACTER_TABLES,
  TRAIT_TABLES,
  getTableDoc,
  requirePack,
  tableResultCount
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
          assert.isAbove(
            tableResultCount(table),
            10,
            'American male table has more than 10 results'
          )
        })

        for (const [kind, tableId] of Object.entries(TRAIT_TABLES)) {
          it(`${kind} trait table has results`, async function () {
            const table = await getTableDoc(PACK_ROLL_TABLES, tableId)
            assert.equal(table.name, `Personality trait, ${kind}`)
            assert.isAbove(tableResultCount(table), 50)
          })
        }

        for (const [name, tableId] of Object.entries(CHARACTER_TABLES)) {
          it(`${name} table has 100 results`, async function () {
            const table = await getTableDoc(PACK_ROLL_TABLES, tableId)
            assert.equal(table.name, name)
            assert.equal(tableResultCount(table), 100)
          })
        }
      })
    },
    { displayName: 'Compendiums' }
  )
}
