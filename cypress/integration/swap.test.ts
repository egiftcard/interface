describe('Swap', () => {
  beforeEach(() => cy.visit('/swap'))
  it('can enter an amount into input', () => {
    cy.get('#swapInputField')
      .type('0.001')
      .should('have.value', '0.001')
  })

  it('zero swap amount', () => {
    cy.get('#swapInputField')
      .type('0.0')
      .should('have.value', '0.0')
  })

  it('cannot enter a non-amount into input', () => {
    cy.get('#swapInputField')
      .type('\\')
      .should('have.value', '')
  })

  it('can enter an amount into output', () => {
    cy.get('#swapOutputField')
      .type('0.001')
      .should('have.value', '0.001')
  })

  it('zero output amount', () => {
    cy.get('#swapOutputField')
      .type('0.0')
      .should('have.value', '0.0')
  })
})
