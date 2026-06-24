// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
// ***********************************************************

import './commands.js'
import 'cypress-if'

Cypress.Commands.add('loginAsGM', () => {
  cy.log('Logging in as GM')

  cy.url().then((url) => {
    if (!url.includes('/join') && !url.includes('/game')) {
      cy.log('Visiting /join')
      cy.visit('/join')
    } else {
      cy.visit('/')
    }
  })

  cy.log('Getting select[name="userid"]')
  cy.get('select[name="userid"]', { timeout: 120000 }).should('be.visible')
  cy.log('Getting select[name="userid"] options')
  cy.get('select[name="userid"] option').then((options) => {
    const opts = options.toArray()
    expect(opts.length, 'join page users').to.be.greaterThan(0)
    const gm =
      opts.find((o) => /gamemaster|\[gm\]/i.test(o.text)) ?? opts[opts.length > 1 ? 1 : 0]
    cy.get('select[name="userid"]').select(gm.value, { force: true })
  })

  cy.get('button[name="join"]', { timeout: 10000 }).should('be.visible').click({ force: true })

  cy.visit('/game')

  cy.log('Getting #interface, #ui-top, #sidebar')

  cy.get('#interface, #ui-top, #sidebar', { timeout: 120000 }).should('exist')
  cy.window({ timeout: 120000 }).should((win) => {
    expect(win.game, 'Foundry client after Join — is the world running?').to.exist
    expect(win.game.ready, 'game.ready').to.eq(true)
  })
  cy.waitForQuench()
})

Cypress.Commands.add('disableIntercepts', () => {
  // Pass-through only — never stub responses (stubbing breaks Foundry asset loads).
  cy.intercept({ resourceType: /xhr|fetch/ }, (req) => {
    req.continue()
  })
})

Cypress.Commands.add('waitForQuench', () => {
  cy.window({ timeout: 120000 }).should((win) => {
    expect(win.game?.ready, 'game.ready before Quench').to.eq(true)
  })
  cy.window()
    .its('game.modules')
    .invoke('get', 'quench')
    .should('exist', 'Quench not in game.modules — run install-quench and restart Foundry (world must relaunch to load modules from world.json)')
    .its('active')
    .should('eq', true)
  cy.get('.quench-button, [data-tooltip="QUENCH.Title"]', { timeout: 30000 }).should('be.visible')
})
