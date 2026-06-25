/* global cy, describe, expect, it */
import developmentOptions from '../../fvtt.config.js'

const testWorldName = developmentOptions.testWorldName ?? 'modern-names-test'

describe('Quench tests', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.get('body').should('exist', { timeout: 10000 })
    cy.licenseAgreeAndClickAccept()
    cy.setupInputPasswordAndClickLogin()
    cy.closeTourOverlay()
    cy.openTestWorld()
    cy.enableModules()
    cy.wait(1000)

    cy.url().then((url) => {
      if (url.includes('/auth')) {
        const password = Cypress.env('ADMIN_PASSWORD')
        if (password) {
          cy.get('.password').should('be.visible').type(password)
          cy.get('body').contains('Log In').should('be.visible').click({ force: true })
        }
        cy.visit('/setup')
      }
    })

    cy.url().then((url) => {
      if (url.includes('/setup')) {
        cy.get('body').contains(testWorldName).should('be.visible').rightclick({ force: true })
        cy.get('body').contains('Launch').should('be.visible').click({ force: true })
        cy.get('select[name="userid"] option', { timeout: 120000 }).should('have.length.at.least', 1)
      }
    })

    cy.get('select[name="userid"] option', { timeout: 120000 }).should('be.visible')
    cy.loginAsGM()
  })

  it('run quench tests', () => {
    cy.get('.quench-button, [data-tooltip="QUENCH.Title"]').click()
    cy.get("[data-select='all']").should('exist').click({ force: true })
    cy.get('#quench-run').should('be.visible').click()
    cy.get('#quench-run').should('be.visible').click()

    cy.get('.stats', { timeout: 10000 }).should('be.visible')
    cy.get('.stats').then((stats) => {
      cy.log('Test report: ', stats.text())
    })

    cy.wait(1000)
    cy.get('.error').then((summary) => {
      cy.log('errors: ', summary.text())
    })

    cy.get('.stats').then(($stats) => {
      const summary = $stats.text()
      if (!summary.includes('failed')) return

      const errors = Cypress.$('.error-message')
        .map((_, el) => Cypress.$(el).text().trim())
        .get()
      const diffs = Cypress.$('.diff')
        .map((_, el) => Cypress.$(el).text().trim())
        .get()

      expect(
        summary,
        `Quench failures:\n${JSON.stringify({ summary, errors, diffs }, null, 2)}`
      ).to.not.include('failed')
    })
  })
})
