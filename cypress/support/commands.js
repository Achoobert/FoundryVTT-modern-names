/* global Cypress, cy */

Cypress.Commands.add('loginViaUi', (user) => {
  cy.visit('/')

  cy.get('select[name=userid]')
    .select(user.name)

  cy.get('button[name=join]').if().click()
  cy.get('span').contains(user.name).should('be.visible')

  cy.window().then((win) => {
    cy.window().its('game').and('have.property', 'ready').and('be.true')
    if (typeof win.game.scenes.current !== 'undefined') {
      cy.window().its('game').should('have.property', 'canvas').and('have.property', 'ready').and('be.true')
    } else {
      cy.wait(1000)
    }
  })
})

Cypress.Commands.add('turnOffWarningsIfTheyExist', () => {
  cy.get('#notifications').then((notifications) => {
    const buttons = notifications.find('li.notification')
    if (buttons.length) {
      buttons.trigger('click')
    }
  })
})

// if http://localhost:30000/license, agree and click accept
Cypress.Commands.add('licenseAgreeAndClickAccept', () => {
  cy.visit('/')
  // if on license page, agree and click accept
  cy.url().then((url) => {
    if (url.includes('/license')) {
      // id="eula-agree"
      // id="sign"
      cy.get('#eula-agree').click()
      cy.get('#sign').click()
      cy.visit('/')
    }
  })
})
// if http://localhost:30000/auth, input password and click login
Cypress.Commands.add('setupInputPasswordAndClickLogin', () => {
  cy.url().then((url) => {
    if (url.includes('/auth')) {
      // id="key"
      cy.get('#key', { timeout: 10000 }).type(Cypress.env('ADMIN_PASSWORD') ?? '') // TODO this doen't show in log
      // this is fragile :(
      // cy.get('#submit').contains('Log In').should('be.visible').click()
      cy.get('.fa-unlock-keyhole', { timeout: 10000 }).parent().click()
      cy.visit('/')
    }
  })
})
// cy.get(...)
// @ts-ignore
// .if()
// data-action="exit"
Cypress.Commands.add('closeTourOverlay', () => {
  cy.log('Closing tour overlay')
  cy.get('[data-action="exit"]', { timeout: 10000 }).if().then(() => {
    cy.get('[data-action="exit"]').click()
  })
  cy.get('.tour .header-button.close, [data-action="closeTour"]', { timeout: 5000 }).if().click({
    force: true
  })
  // class="step-title noborder"
  //Backups Overview
  // class="tour-overlay"
  cy.get('.step-title.noborder', { timeout: 10000 }).should('not.exist')
  cy.get('.tour-overlay', { timeout: 10000 }).should('not.exist')
})

Cypress.Commands.add('confirmWorldMigrationIfShown', () => {
  cy.contains('button', 'Begin Migration', { timeout: 15000 }).if().click({ force: true })
})

Cypress.Commands.add('launchTestWorldFromSetup', (worldTitle) => {
  const name = worldTitle ?? Cypress.env('FOUNDRY_WORLD') ?? 'modern-names-test'
  cy.url().then((url) => {
    if (url.includes('/join')) {
      cy.log('World already running (join page) — skip setup launch')
      return
    }
    if (url.includes('/game')) {
      return
    }
    cy.get('body').contains(name).should('be.visible').rightclick({ force: true })
    cy.get('body').contains('Launch').should('be.visible').click({ force: true })
    cy.confirmWorldMigrationIfShown()
    cy.closeTourOverlay()
    cy.get('select[name="userid"] option', { timeout: 180000 }).should('have.length.at.least', 1)
  })
})
// class="world-select"
Cypress.Commands.add('openTestWorld', () => {
  // data-package-id is env world
  // todo use env var
  cy.get(`[data-package-id="${Cypress.env('FOUNDRY_WORLD') || 'modern-names-test'}"]`, { timeout: 10000 }).if().then(() => {
    // data-action="worldLaunch"
    cy.get(`[data-package-id="${Cypress.env('FOUNDRY_WORLD') || 'modern-names-test'}"]`, { timeout: 10000 }).if().click({ force: true }).then(() => {
      cy.get('[data-action="worldLaunch"]', { timeout: 10000 }).click({ force: true })
    })
    cy.get('[data-action="yes"]', { timeout: 10000 }).if().click({ force: true })
    cy.get('[data-action="ok"]', { timeout: 10000 }).if().click({ force: true })
    cy.confirmWorldMigrationIfShown()
    cy.closeTourOverlay()
  })

})
// enable modules
Cypress.Commands.add('enableModules', () => {
// if not already active
  // data-tab="settings"
  cy.get('[data-tab="settings"]', { timeout: 10000 }).if().then(() => {
    cy.get('[data-tab="settings"]').click()
  })
  // data-app="modules"
  cy.get('[data-app="modules"]', { timeout: 10000 }).if().then(() => {
    cy.get('[data-app="modules"]').click()
  })
  // type="checkbox"
  // name="modern-names"
  cy.get('input[type="checkbox"][name="modern-names"]', { timeout: 10000 }).if().then(() => {
    cy.get('input[type="checkbox"][name="modern-names"]').click()
  })
  // quench
  cy.get('input[type="checkbox"][name="quench"]', { timeout: 10000 }).if().then(() => {
    cy.get('input[type="checkbox"][name="quench"]').click()
  })
  // modern-names-tests
  cy.get('input[type="checkbox"][name="modern-names-tests"]', { timeout: 10000 }).if().then(() => {
    cy.get('input[type="checkbox"][name="modern-names-tests"]').click()
  })
  // type="submit"
  cy.get('input[type="submit"]', { timeout: 10000 }).if().then(() => {
    cy.get('input[type="submit"]').click()
  })
})