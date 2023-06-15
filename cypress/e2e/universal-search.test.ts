import { getTestSelector } from '../utils'

describe('Universal search bar', () => {
  function openSearch() {
    cy.get('body').type('/')
  }

  beforeEach(() => {
    cy.visit('/')
    openSearch()
  })

  it('should yield clickable result for regular token or nft collection search term', () => {
    // Search for uni token by name.
    cy.get('[data-cy="search-bar-input"]').last().clear().type('uni')
    cy.get('[data-cy="searchbar-token-row-UNI"]')
      .should('contain.text', 'Uniswap')
      .and('contain.text', 'UNI')
      .and('contain.text', '$')
      .and('contain.text', '%')
    cy.get('[data-cy="searchbar-token-row-UNI"]').first().click()

    cy.get('div').contains('Uniswap').should('exist')
    // Stats should have: TVL, 24H Volume, 52W low, 52W high.
    cy.get(getTestSelector('token-details-stats')).should('exist')
    cy.get(getTestSelector('token-details-stats')).within(() => {
      cy.get('[data-cy="tvl"]').should('include.text', '$')
      cy.get('[data-cy="volume-24h"]').should('include.text', '$')
      cy.get('[data-cy="52w-low"]').should('include.text', '$')
      cy.get('[data-cy="52w-high"]').should('include.text', '$')
    })

    // About section should have description of token.
    cy.get(getTestSelector('token-details-about-section')).should('exist')
    cy.contains('UNI is the governance token for Uniswap').should('exist')
  })

  it('should go to the selected result when recent results are shown', () => {
    // Search for uni token by name.
    cy.get('[data-cy="search-bar-input"]').last().type('uni')
    cy.get('[data-cy="searchbar-token-row-UNI"]')

    // Clear search
    cy.get('[data-cy="search-bar-input"]').last().clear()

    // Close search
    cy.get('[data-cy="search-bar-input"]').last().type('{esc}')

    openSearch()

    // Search a different token by name.
    cy.get('[data-cy="search-bar-input"]').last().type('eth')

    // Validate ETH result now exists.
    cy.get('[data-cy="searchbar-token-row-ETH"]')

    // Hit enter
    cy.get('[data-cy="search-bar-input"]').last().type('{enter}')

    // Validate we went to ethereum address
    cy.url().should('contain', 'tokens/ethereum/NATIVE')
  })

  it.skip('should show recent tokens and popular tokens with empty search term', () => {
    cy.get('[data-cy="magnifying-icon"]')
      .parent()
      .then(($navIcon) => {
        $navIcon.click()
      })
    // Recently searched UNI token should exist.
    cy.get('[data-cy="search-bar-input"]').last().clear()
    cy.get('[data-cy="searchbar-dropdown"]')
      .contains('[data-cy="searchbar-dropdown"]', 'Recent searches')
      .get('[data-cy="searchbar-token-row-UNI"]')

    // Most popular 3 tokens should be shown.
    cy.get('[data-cy="searchbar-dropdown"]')
      .contains('[data-cy="searchbar-dropdown"]', 'Popular tokens')
      .get('[data-cy^="searchbar-token-row"]')
      .its('length')
      .should('be.eq', 3)
  })

  it.skip('should show blocked badge when blocked token is searched for', () => {
    // Search for mTSLA, which is a blocked token.
    cy.get('[data-cy="search-bar-input"]').last().clear().type('mtsla')
    cy.get('[data-cy="searchbar-token-row-mTSLA"]').find('[data-cy="blocked-icon"]').should('exist')
  })
})
