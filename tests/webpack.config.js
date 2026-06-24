import { fileURLToPath } from 'url'
import * as fs from 'fs'
import * as path from 'path'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import developmentOptions from '../fvtt.config.js'

const rootFolder = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.dirname(rootFolder)

const buildMode = process.argv.includes('production') ? 'production' : 'development'

function buildDestination () {
  try {
    const { userDataPath } = developmentOptions
    const manifestPath = path.join(rootFolder, 'module/module.json')
    if (fs.existsSync(manifestPath)) {
      const json = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
      if (json.id && fs.existsSync(userDataPath)) {
        return path.join(userDataPath, 'Data', 'modules', json.id)
      }
    }
  } catch {
    //
  }
  return path.join(rootFolder, 'build')
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
