import { fileURLToPath } from 'url'
import * as fs from 'fs'
import * as path from 'path'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import developmentOptions from '../fvtt.config.js'
import { ensureModuleOutputDir } from '../scripts/fvtt-paths.js'

const rootFolder = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.dirname(rootFolder)

const buildMode = process.argv.includes('production') ? 'production' : 'development'

function buildDestination() {
  const manifestPath = path.join(rootFolder, 'module/module.json')
  try {
    const json = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    if (json.id) {
      const dest = ensureModuleOutputDir(developmentOptions, json.id)
      if (dest) {
        console.log(`[webpack:tests] module output → ${dest}`)
        return dest
      }
    }
  } catch (err) {
    console.warn('[webpack:tests] could not read module.json for output path:', err.message)
  }
  const fallback = path.join(rootFolder, 'build')
  console.warn(
    `[webpack:tests] fvtt.config.js userDataPath not set — output → ${fallback}`
  )
  return fallback
}

export default {
  bail: buildMode === 'production',
  context: repoRoot,
  devtool: buildMode === 'development' ? 'inline-source-map' : false,
  entry: path.join(rootFolder, 'module/src/modern-names-tests.js'),
  mode: buildMode,
  output: {
    clean: true,
    path: buildDestination(),
    filename: 'module.js'
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: path.join(rootFolder, 'module/module.json'), to: 'module.json' },
        { from: path.join(rootFolder, 'module/LICENSE'), to: 'LICENSE', toType: 'file' }
      ]
    })
  ],
  resolve: {
    extensions: ['.js']
  },
  watch: buildMode === 'development'
}
