import { fileURLToPath } from 'url'
import * as fs from 'fs'
import * as path from 'path'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import developmentOptions from './fvtt.config.js'
import { ensureModuleOutputDir } from './scripts/fvtt-paths.js'

const rootFolder = path.dirname(fileURLToPath(import.meta.url))

/** `webpack --mode production` → argv[3] is `production` */
const buildMode = process.argv[3] === 'production' ? 'production' : 'development'

const NODE_ONLY_SCRIPTS = new Set([
  'compendiums-build.js',
  'pack-helpers.js',
  'generate-macros.js',
  'install-quench.js',
  'write-ci-config.js',
  'restart-foundry-container.js',
  'wait-for-foundry.js',
  'chown-foundrydata-for-docker.js',
  'sync-env-from-fvtt-config.js',
  'foundry-cache-snapshot.js',
  'record-foundry-download.js',
  'foundry-stats-constants.js',
  'bump-repo-variable.js',
  'sync-foundry-badges-json.js',
  'fvtt-paths.js',
  'namer.js',
  'table-ids.js'
])

function buildDestination() {
  const manifestPath = path.join(rootFolder, 'module.json')
  try {
    const json = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    if (json.id) {
      const dest = ensureModuleOutputDir(developmentOptions, json.id)
      if (dest) {
        console.log(`[webpack] module output → ${dest}`)
        return dest
      }
    }
  } catch (err) {
    console.warn('[webpack] could not read module.json for output path:', err.message)
  }
  const fallback = path.join(rootFolder, 'build')
  console.warn(
    `[webpack] fvtt.config.js userDataPath not set — output → ${fallback} (set userDataPath for Docker/Foundry)`
  )
  return fallback
}

function scriptEntries() {
  const scriptsDir = path.join(rootFolder, 'scripts')
  if (!fs.existsSync(scriptsDir)) {
    return {}
  }
  const entries = {}
  for (const name of fs.readdirSync(scriptsDir)) {
    if (!name.endsWith('.js') || NODE_ONLY_SCRIPTS.has(name)) continue
    const key = `scripts/${name.replace(/\.js$/, '')}`
    entries[key] = path.join(scriptsDir, name)
  }
  return entries
}

function copyList() {
  const list = [
    { from: 'module.json', to: 'module.json' },
    { from: 'LICENSE', to: 'LICENSE', toType: 'file' }
  ]
  if (fs.existsSync(path.join(rootFolder, 'packs'))) {
    list.push({ from: 'packs', to: 'packs' })
  }
  if (fs.existsSync(path.join(rootFolder, 'README.md'))) {
    list.push({ from: 'README.md', to: 'README.md', toType: 'file' })
  }
  return list
}

const entries = scriptEntries()

export default {
  bail: buildMode === 'production',
  context: rootFolder,
  devtool: buildMode === 'development' ? 'inline-source-map' : false,
  entry: entries,
  mode: buildMode,
  output: {
    clean: true,
    path: buildDestination(),
    filename: '[name].js'
  },
  plugins: [
    new CopyWebpackPlugin({ patterns: copyList() })
  ],
  resolve: {
    extensions: ['.js']
  },
  watch: buildMode === 'development'
}
