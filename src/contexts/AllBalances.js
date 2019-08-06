import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react'
import { getTokenReserves, getMarketDetails, formatFixed, FIXED_UNDERFLOW_BEHAVIOR } from '@uniswap/sdk'
import { useWeb3Context } from 'web3-react'

import { safeAccess, isAddress, getEtherBalance, getTokenBalance, amountFormatter, getTokenDecimals } from '../utils'
import { useAllTokenDetails } from './Tokens'
import { useUSDPrice } from './Application'

const UPDATE = 'UPDATE'

const AllBalancesContext = createContext()

const format = { decimalSeparator: '.', groupSeparator: ',', groupSize: 3 }

function useAllBalancesContext() {
  return useContext(AllBalancesContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { allBalanceData, networkId, address, ethPrice } = payload
      return {
        ...state,
        [networkId]: {
          ...(safeAccess(state, [networkId]) || {}),
          [address]: {
            ...(safeAccess(state, [networkId, address]) || {}),
            allBalanceData,
            ethPrice
          }
        }
      }
    }
    default: {
      throw Error(`Unexpected action type in BalancesContext reducer: '${type}'.`)
    }
  }
}

export default function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, {})

  const update = useCallback((allBalanceData, networkId, address, ethPrice) => {
    dispatch({ type: UPDATE, payload: { allBalanceData, networkId, address, ethPrice } })
  }, [])

  return (
    <AllBalancesContext.Provider value={useMemo(() => [state, { update }], [state, update])}>
      {children}
    </AllBalancesContext.Provider>
  )
}

export function useFetchAllBalances() {
  const { account, networkId, library } = useWeb3Context()

  const _ethPrice = useUSDPrice()
  const ethPrice = _ethPrice && _ethPrice.toString()

  const allTokens = useAllTokenDetails()

  const [state, { update }] = useAllBalancesContext()

  const { allBalanceData } = safeAccess(state, [networkId, account]) || {}

  const getData = async () => {
    if (account !== undefined && !!ethPrice) {
      console.log('updating')
      let mounted = true
      const newBalances = {}
      await Promise.all(
        Object.keys(allTokens).map(async k => {
          let balanceFormatted = 0
          let usdPriceOfToken = 0
          if (isAddress(k) || k === 'ETH') {
            let balance = 0
            if (k === 'ETH') {
              balance = await getEtherBalance(account, library)
              balanceFormatted = amountFormatter(balance)
              usdPriceOfToken = formatFixed(ethPrice, {
                decimalPlaces: 2,
                dropTrailingZeros: false,
                format
              })
            } else {
              balance = await getTokenBalance(k, account, library).catch(() => null)
              let decimal = await getTokenDecimals(k, library).catch(() => null)
              balanceFormatted = !!(balance && Number.isInteger(decimal))
                ? amountFormatter(balance, decimal, Math.min(4, decimal))
                : 0
              if (library && balanceFormatted > 0) {
                let tokenReserves = await getTokenReserves(k).catch(() => undefined)
                if (tokenReserves) {
                  let marketDetails = await getMarketDetails(tokenReserves)
                  if (marketDetails) {
                    try {
                      usdPriceOfToken = formatFixed(marketDetails.marketRate.rate.multipliedBy(ethPrice), {
                        decimalPlaces: 2,
                        dropTrailingZeros: false,
                        underflowBehavior: FIXED_UNDERFLOW_BEHAVIOR.LESS_THAN,
                        format
                      })
                    } catch (error) {}
                  }
                }
              }
            }
            return (newBalances[k] = {
              balance: balanceFormatted,
              usd: usdPriceOfToken
            })
          }
        })
      )
      if (mounted) {
        update(newBalances, networkId, account, ethPrice)
      }
      const cleanup = () => {
        mounted = false
      }
      return cleanup
    }
  }

  useMemo(getData, [ethPrice])

  return allBalanceData
}
