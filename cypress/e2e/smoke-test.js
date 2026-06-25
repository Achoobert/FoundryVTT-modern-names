describe('Smoke tests', () => {
  it('should visit the home page', () => {
    cy.visit('/')
    cy.get('body').should('exist', { timeout: 10000 })
  })
})