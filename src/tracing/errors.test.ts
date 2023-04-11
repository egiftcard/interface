import { ErrorEvent } from '@sentry/types'

import { filterKnownErrors } from './errors'

describe('filterKnownErrors', () => {
  const ERROR = {} as ErrorEvent
  it('propagates an error', () => {
    expect(filterKnownErrors(ERROR, {})).toBe(ERROR)
  })

  it('filters block number polling errors', () => {
    const originalException = new (class extends Error {
      requestBody = JSON.stringify({ method: 'eth_blockNumber' })
    })()
    expect(filterKnownErrors(ERROR, { originalException })).toBe(null)
  })

  it('filters network change errors', () => {
    const originalException = new Error('underlying network changed')
    expect(filterKnownErrors(ERROR, { originalException })).toBe(null)
  })

  it('filters call revert errors', () => {
    const originalException = new Error(
      'call revert exception [ See: https://links.ethers.org/v5-errors-CALL_EXCEPTION ]'
    )
    expect(filterKnownErrors(ERROR, { originalException })).toBe(null)
  })
})
