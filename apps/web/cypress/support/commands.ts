import 'cypress-hardhat/lib/browser'

import { Eip1193Bridge } from '@ethersproject/experimental/lib/eip1193-bridge'

import { FeatureFlagClient, FeatureFlags, getFeatureFlagName } from 'uniswap/src/features/experiments/flags'
import { UserState, initialState } from '../../src/state/user/reducer'
import { CONNECTED_WALLET_USER_STATE, setInitialUserState } from '../utils/user-state'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface ApplicationWindow {
      ethereum: Eip1193Bridge
    }
    interface Chainable<Subject> {
      /**
       * Wait for a specific event to be sent to amplitude. If the event is found, the subject will be the event.
       *
       * @param {string} eventName - The type of the event to search for e.g. SwapEventName.SWAP_TRANSACTION_COMPLETED
       * @param {number} timeout - The maximum amount of time (in ms) to wait for the event.
       * @returns {Chainable<Subject>}
       */
      waitForAmplitudeEvent(eventName: string, requiredProperties?: string[]): Chainable<Subject>
      /**
       * Intercepts a specific graphql operation and responds with the given fixture.
       * @param {string} operationName - The name of the graphql operation to intercept.
       * @param {string} fixturePath - The path to the fixture to respond with.
       */
      interceptGraphqlOperation(operationName: string, fixturePath: string): Chainable<Subject>
    }
    interface VisitOptions {
      serviceWorker?: true
      featureFlags?: Array<{ flag: FeatureFlags; value: boolean }>
      /**
       * Initial user state.
       * @default {@type import('../utils/user-state').CONNECTED_WALLET_USER_STATE}
       */
      userState?: Partial<UserState>
    }
  }
}

// sets up the injected provider to be a mock ethereum provider with the given mnemonic/index
// eslint-disable-next-line no-undef
Cypress.Commands.overwrite(
  'visit',
  (original, url: string | Partial<Cypress.VisitOptions>, options?: Partial<Cypress.VisitOptions>) => {
    if (typeof url !== 'string') throw new Error('Invalid arguments. The first argument to cy.visit must be the path.')

    // Parse overrides
    const flagsOn: FeatureFlags[] = []
    const flagsOff: FeatureFlags[] = []
    options?.featureFlags?.forEach((f) => {
      if (f.value) {
        flagsOn.push(f.flag)
      } else {
        flagsOff.push(f.flag)
      }
    })

    // Format into URL parameters
    const overrideParams = new URLSearchParams()
    if (flagsOn.length > 0) {
      overrideParams.append(
        'featureFlagOverride',
        flagsOn.map((flag) => getFeatureFlagName(flag, FeatureFlagClient.Web)).join(',')
      )
    }
    if (flagsOff.length > 0) {
      overrideParams.append(
        'featureFlagOverrideOff',
        flagsOn.map((flag) => getFeatureFlagName(flag, FeatureFlagClient.Web)).join(',')
      )
    }

    return cy
      .intercept('/service-worker.js', options?.serviceWorker ? undefined : { statusCode: 404 })
      .provider()
      .then((provider) =>
        original({
          ...options,
          url:
            [...overrideParams.entries()].length === 0
              ? url
              : url.includes('?')
              ? `${url}&${overrideParams.toString()}`
              : `${url}?${overrideParams.toString()}`,
          onBeforeLoad(win) {
            options?.onBeforeLoad?.(win)

            setInitialUserState(win, {
              ...initialState,
              ...CONNECTED_WALLET_USER_STATE,
              ...(options?.userState ?? {}),
            })

            // Inject the mock ethereum provider.
            win.ethereum = provider
          },
        })
      )
  }
)

Cypress.Commands.add('waitForAmplitudeEvent', (eventName, requiredProperties) => {
  function findAndDiscardEventsUpToTarget() {
    const events = Cypress.env('amplitudeEventCache')
    const targetEventIndex = events.findIndex((event) => {
      if (event.event_type !== eventName) return false
      if (requiredProperties) {
        return requiredProperties.every((prop) => event.event_properties[prop])
      }
      return true
    })

    if (targetEventIndex !== -1) {
      const event = events[targetEventIndex]
      Cypress.env('amplitudeEventCache', events.slice(targetEventIndex + 1))
      return cy.wrap(event)
    } else {
      // If not found, retry after waiting for more events to be sent.
      return cy.wait('@amplitude').then(findAndDiscardEventsUpToTarget)
    }
  }
  return findAndDiscardEventsUpToTarget()
})

Cypress.Commands.add('interceptGraphqlOperation', (operationName, fixturePath) => {
  return cy.intercept(/(?:interface|beta).gateway.uniswap.org\/v1\/graphql/, (req) => {
    if (req.body.operationName === operationName) {
      req.reply({ fixture: fixturePath })
    } else {
      req.continue()
    }
  })
})
