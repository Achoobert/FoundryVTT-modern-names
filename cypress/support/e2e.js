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
      cy.visit('/join')
    }
  })

  cy.get('select[name="userid"]', { timeout: 120000 }).should('exist')
  cy.get('select[name="userid"] option').then((options) => {
    const opts = options.toArray()
    expect(opts.length, 'join page users').to.be.greaterThan(0)
    const gm =
      opts.find((o) => /gamemaster|\[gm\]/i.test(o.text)) ?? opts[opts.length > 1 ? 1 : 0]
    cy.get('select[name="userid"]').select(gm.value, { force: true })
  })

  cy.get('button[name="join"]', { timeout: 10000 }).should('be.visible').click({ force: true })

  // cypress hates redirects I guess?
  cy.visit('/game')

  cy.get('#interface, #ui-top, #sidebar', { timeout: 1200 }).should('exist')
  cy.closeTourOverlay()
  cy.turnOffWarningsIfTheyExist()

  cy.window({ timeout: 120000 }).should((win) => {
    expect(win.game, 'Foundry client after Join — is the world running?').to.exist
    expect(win.game.ready, 'game.ready').to.eq(true)
  })
})

Cypress.Commands.add('loginAsAdmin', () => {
  cy.log('Logging in as Admin, to access setup')

  cy.closeTourOverlay()

  cy.get(`[data-package-id="${Cypress.env('FOUNDRY_WORLD') || 'modern-names-test'}"]`, { timeout: 10000 })
    .should('exist')
    .click({ force: true })

  cy.get('button[name="join"]', { timeout: 10000 }).should('exist').click({ force: true })

  cy.loginAsGM()
})

Cypress.Commands.add('disableIntercepts', () => {
  cy.intercept({ resourceType: /xhr|fetch/ }, (req) => {
    req.continue()
  })
})

Cypress.Commands.add('waitForQuench', () => {
  const script = `game.settings.set('core','moduleConfiguration',{'modern-names':true,'modern-names-tests':true,'quench':true})`
  cy.window({ timeout: 120000 }).should((win) => {
    expect(win.game?.ready, 'game.ready before Quench').to.eq(true)
  })

  cy.log('Quench button is NOT visible, activating modules')


  // data-slot="10", left click
  // cy.get('[data-slot="10"]', { timeout: 30000 }).should('be.visible').click({ force: true })
  // option value="script", dropdown select
  // cy.get('select[name="type"]', { timeout: 30000 }).select('script', { force: true })
  // class="cm-line cm-activeLine", enter script
  // cy.get('.cm-line.cm-activeLine', { timeout: 30000 }).should('be.visible').type(script, { parseSpecialCharSequences: false })
  // cy.get('.cm-line.cm-activeLine', { timeout: 30000 }).should('be.visible').type(script)
  // cy.window({ timeout: 120000 }).then(async (win) => {
  //   // const modules = {
  //   //   ...(win.game.settings.get('core', 'moduleConfiguration') ?? {}),
  //   //   'modern-names': true,
  //   //   'modern-names-tests': true,
  //   //   'quench': true
  //   // }
  //   const modules = {
  //     'modern-names': true,
  //     'modern-names-tests': true,
  //     'quench': true
  //   }

  //   await win.game.settings.set('core', 'moduleConfiguration', modules)
  // })
  cy.window().then(async (win) => {
    // const Macro = win.game.macros.documentClass
    const command = `const mods={...(game.settings.get('core','moduleConfiguration')??{}),'modern-names':true,'modern-names-tests':true,quench:true};await game.settings.set('core','moduleConfiguration',mods);location.reload()`

    // const macro = new Macro({
    //   name: 'cypress-enable-quench',
    //   type: 'script',
    //   scope: 'global',
    //   command,
    // })
    // await macro.execute()
    await win.Macro.implementation.createDocuments([{
      name: 'cypress-enable-quench',
      type: 'script',
      scope: 'global',
      command,
    }])
    // win.game.macros.get('cypress-enable-quench').execute()s
  })
  cy.wait(100000)

  // data-action="execute", click
  // cy.get('[data-action="execute"]', { timeout: 30000 }).click({ force: true })
  // cy.visit('/game')
  cy.get('.quench-button, [data-tooltip="QUENCH.Title"]', { timeout: 30000 }).should('be.visible')
})
