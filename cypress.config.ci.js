import { defineConfig } from 'cypress'
import { resolveAdminPassword, resolveFoundryWorld } from './cypress/load-repo-env.js'
import developmentOptions from './fvtt.config.js'

let { baseURL } = developmentOptions
const adminPassword = resolveAdminPassword(developmentOptions)
const foundryWorld = resolveFoundryWorld(developmentOptions)

if (!baseURL) {
  baseURL = 'http://localhost:30000'
}

export default defineConfig({
  e2e: {
    baseUrl: baseURL,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 120000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    pageLoadTimeout: 60000,
    retries: {
      runMode: 2,
      openMode: 0
    },
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome' || browser.name === 'chromium') {
          launchOptions.args.push('--window-size=1366,768')
        }
        return launchOptions
      })
      return config
    }
  },
  env: {
    ADMIN_PASSWORD: adminPassword,
    FOUNDRY_WORLD: foundryWorld
  },
  viewportWidth: 1366,
  viewportHeight: 768
})
