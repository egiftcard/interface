import { useAllTokens } from 'hooks/Tokens'
import useTopTokens, { TimePeriod } from 'hooks/useTopTokens'
import { useAtomValue } from 'jotai'
import { ReactNode, useMemo } from 'react'
import { AlertTriangle } from 'react-feather'
import styled from 'styled-components/macro'

import { MAX_WIDTH_MEDIA_BREAKPOINT } from './constants'
import { favoritesAtom, filterStringAtom, showFavoritesAtom } from './state'
import LoadedRow, { HeaderRow, LoadingRow } from './TokenRow'

const GridContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  background-color: ${({ theme }) => theme.backgroundSurface};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  margin-left: auto;
  margin-right: auto;
  border-radius: 8px;
  justify-content: center;
  align-items: center;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
`
const NoTokenDisplay = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  height: 60px;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 16px;
  font-weight: 500;
  align-items: center;
  padding: 0px 28px;
  gap: 8px;
`
const TokenRowsContainer = styled.div`
  padding: 4px 0px;
`
const LOADING_ROWS = Array(10)
  .fill(0)
  .map((_item, index) => {
    return <LoadingRow key={`${index}`} />
  })

function useFilteredTokens(showFavorites: boolean, topTokenAddresses: string[]) {
  const filterString = useAtomValue(filterStringAtom)
  const favoriteTokens = useAtomValue(favoritesAtom)
  const shownTokens = showFavorites ? favoriteTokens : topTokenAddresses
  const allTokens = useAllTokens()

  return useMemo(() => {
    const filteredTokens = shownTokens.filter((tokenAddress) => {
      const token = allTokens[tokenAddress]
      const tokenName = token?.name ?? ''
      const tokenSymbol = token?.symbol ?? ''

      if (!filterString) {
        return true
      }
      const lowercaseFilterString = filterString.toLowerCase()
      const addressIncludesFilterString = tokenAddress.toLowerCase().includes(lowercaseFilterString)
      const nameIncludesFilterString = tokenName.toLowerCase().includes(lowercaseFilterString)
      const symbolIncludesFilterString = tokenSymbol.toLowerCase().includes(lowercaseFilterString)
      return nameIncludesFilterString || symbolIncludesFilterString || addressIncludesFilterString
    })
    return filteredTokens
  }, [allTokens, shownTokens, filterString])
}

function NoTokensState(message: ReactNode, timePeriod: TimePeriod) {
  return (
    <GridContainer>
      <HeaderRow timeframe={timePeriod} />
      <NoTokenDisplay>{message}</NoTokenDisplay>
    </GridContainer>
  )
}

export default function TokenTable() {
  const { data, error, loading } = useTopTokens()

  const showFavorites = useAtomValue(showFavoritesAtom)
  const timePeriod = TimePeriod.day
  const topTokenAddresses = Object.keys(data)
  const filteredTokens = useFilteredTokens(showFavorites, topTokenAddresses)

  /* loading and error state */
  if (loading) {
    return (
      <GridContainer>
        <HeaderRow timeframe={timePeriod} />
        <TokenRowsContainer>{LOADING_ROWS}</TokenRowsContainer>
      </GridContainer>
    )
  } else if (error || data === null) {
    return NoTokensState(
      <>
        <AlertTriangle size={16} />
        An error occured loading tokens. Please try again.
      </>,
      timePeriod
    )
  }
  /* if no favorites tokens */
  if (showFavorites && filteredTokens.length === 0) {
    return NoTokensState('You have no favorited tokens', timePeriod)
  }

  if (!showFavorites && filteredTokens.length === 0) {
    return NoTokensState('No tokens found', timePeriod)
  }

  const tokenRows = filteredTokens.map((tokenAddress, index) => {
    return (
      <LoadedRow
        key={tokenAddress}
        tokenAddress={tokenAddress}
        data={data}
        listNumber={index + 1}
        timePeriod={timePeriod}
      />
    )
  })
  return (
    <GridContainer>
      <HeaderRow timeframe={timePeriod} />
      <TokenRowsContainer>{tokenRows}</TokenRowsContainer>
    </GridContainer>
  )
}
