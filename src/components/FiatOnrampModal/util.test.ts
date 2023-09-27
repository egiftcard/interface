import { ChainId, WETH9 } from '@uniswap/sdk-core'
import { MATIC, USDC_ARBITRUM, USDC_MAINNET, USDC_OPTIMISM, USDC_POLYGON, USDT, WBTC } from 'constants/tokens'

import { getDefaultCurrencyCode } from './util'

describe('getDefaultCurrencyCode', () => {
  it('NATIVE/arbitrum should return the correct currency code', () => {
    expect(getDefaultCurrencyCode('NATIVE', 'arbitrum')).toBe('eth_arbitrum')
  })
  it('NATIVE/optimism should return the correct currency code', () => {
    expect(getDefaultCurrencyCode('NATIVE', 'optimism')).toBe('eth_optimism')
  })
  it('WETH/polygon should return the correct currency code', () => {
    expect(getDefaultCurrencyCode('0x7ceb23fd6bc0add59e62ac25578270cff1b9f619', 'polygon')).toBe('eth_polygon')
  })
  it('WETH/ethereum should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(WETH9[ChainId.MAINNET].address, 'ethereum')).toBe('weth')
  })
  it('WBTC/ethereum should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(WBTC.address, 'ethereum')).toBe('wbtc')
  })
  it('NATIVE/polygon should return the correct currency code', () => {
    expect(getDefaultCurrencyCode('NATIVE', 'polygon')).toBe('matic_polygon')
  })
  it('MATIC/ethereum should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(MATIC.address, 'ethereum')).toBe('polygon')
  })
  it('USDC/arbitrum should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(USDC_ARBITRUM.address, 'arbitrum')).toBe('usdc_arbitrum')
  })
  it('USDC/optimism should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(USDC_OPTIMISM.address, 'optimism')).toBe('usdc_optimism')
  })
  it('USDC/polygon should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(USDC_POLYGON.address, 'polygon')).toBe('usdc_polygon')
  })
  it('native/ethereum should return the correct currency code', () => {
    expect(getDefaultCurrencyCode('NATIVE', 'ethereum')).toBe('eth')
  })
  it('usdc/ethereum should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(USDC_MAINNET.address, 'ethereum')).toBe('usdc')
  })
  it('usdt/ethereum should return the correct currency code', () => {
    expect(getDefaultCurrencyCode(USDT.address, 'ethereum')).toBe('usdt')
  })
  it('chain/token mismatch should default to eth', () => {
    expect(getDefaultCurrencyCode(USDC_ARBITRUM.address, 'ethereum')).toBe('eth')
    expect(getDefaultCurrencyCode(USDC_OPTIMISM.address, 'ethereum')).toBe('eth')
    expect(getDefaultCurrencyCode(USDC_POLYGON.address, 'ethereum')).toBe('eth')
    expect(getDefaultCurrencyCode(MATIC.address, 'arbitrum')).toBe('eth')
  })
})
