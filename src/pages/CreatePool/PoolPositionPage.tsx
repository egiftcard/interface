//import { BigNumber } from '@ethersproject/bignumber'
//import type { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
//import { Trace } from '@uniswap/analytics'
//import { PageName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount /*, Fraction, Percent, Price, Token*/ } from '@uniswap/sdk-core'
//import { NonfungiblePositionManager, Pool, Position } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
//import { sendEvent } from 'components/analytics'
//import Badge from 'components/Badge'
import { /*ButtonConfirmed, ButtonGray,*/ ButtonPrimary } from 'components/Button'
import { DarkCard, LightCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
//import Loader from 'components/Loader'
import Row, { RowBetween, RowFixed } from 'components/Row'
//import { Dots } from 'components/swap/styleds'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
//import Toggle from 'components/Toggle'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import { ZERO_ADDRESS } from 'constants/misc'
import { nativeOnChain } from 'constants/tokens'
import { useCurrency, useToken } from 'hooks/Tokens'
import { useSmartPoolFromAddress } from 'hooks/useSmartPools'
// TODO: this import is from node modules
import JSBI from 'jsbi'
//import { PoolState, usePool } from 'hooks/usePools'
//import useStablecoinPrice from 'hooks/useStablecoinPrice'
//import { useSingleCallResult } from 'lib/hooks/multicall'
//import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { /*useCallback, useMemo, useRef,*/ useState } from 'react'
import { Link, useParams } from 'react-router-dom'
//import { Bound } from 'state/mint/v3/actions'
//import { useIsTransactionPending, useTransactionAdder } from 'state/transactions/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { ExternalLink, /*HideExtraSmall,*/ ThemedText } from 'theme'
//import { currencyId } from 'utils/currencyId'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
//import { formatTickPrice } from 'utils/formatTickPrice'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'
//import { unwrappedToken } from 'utils/unwrappedToken'

//import RangeBadge from '../../components/Badge/RangeBadge'
//import RateToggle from '../../components/RateToggle'
//import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
//import { useSwapState } from '../../state/swap/hooks'
//import { TransactionType } from '../../state/transactions/types'
//import { calculateGasMargin } from '../../utils/calculateGasMargin'
//import { LoadingRows } from '../Pool/styleds'

const PageWrapper = styled.div`
  padding: 68px 8px 0px;

  min-width: 800px;
  max-width: 960px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding: 48px 8px 0px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: 20px;
  }

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    min-width: 680px;
    max-width: 680px;
  `};

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    min-width: 600px;
    max-width: 600px;
  `};

  @media only screen and (max-width: 620px) {
    min-width: 500px;
    max-width: 500px;
  }

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToExtraSmall`
    min-width: 340px;
    max-width: 340px;
  `};
`

/*
const BadgeText = styled.div`
  font-weight: 500;
  font-size: 14px;
`
*/

// responsive text
// disable the warning because we don't use the end prop, we just want to filter it out
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Label = styled(({ end, ...props }) => <ThemedText.DeprecatedLabel {...props} />)<{ end?: boolean }>`
  display: flex;
  font-size: 16px;
  justify-content: ${({ end }) => (end ? 'flex-end' : 'flex-start')};
  align-items: center;
`

/*
const ExtentsText = styled.span`
  color: ${({ theme }) => theme.deprecated_text2};
  font-size: 14px;
  text-align: center;
  margin-right: 4px;
  font-weight: 500;
`
*/

const HoverText = styled(ThemedText.DeprecatedMain)`
  text-decoration: none;
  color: ${({ theme }) => theme.deprecated_text3};
  :hover {
    color: ${({ theme }) => theme.deprecated_text1};
    text-decoration: none;
  }
`

/*
const DoubleArrow = styled.span`
  color: ${({ theme }) => theme.deprecated_text3};
  margin: 0 1rem;
`
*/

const ResponsiveRow = styled(RowBetween)`
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex-direction: column;
    align-items: flex-start;
    row-gap: 16px;
    width: 100%:
  `};
`

const ResponsiveButtonPrimary = styled(ButtonPrimary)`
  border-radius: 12px;
  padding: 6px 8px;
  width: fit-content;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex: 1 1 auto;
    width: 49%;
  `};
`

function getZapperLink(data: string): string {
  return `https://zapper.xyz/account/${data}`
}

export function PoolPositionPage() {
  const { poolAddress: poolAddressFromUrl } = useParams<{ poolAddress?: string }>()
  const { chainId /*, account , provider*/ } = useWeb3React()
  const theme = useTheme()

  const [showConfirm, setShowConfirm] = useState(false)
  // TODO: check how can reduce number of calls by limit update of poolStorage
  //  id is stored in registry so we could save rpc call by using storing in state?
  const poolStorage = useSmartPoolFromAddress(poolAddressFromUrl ?? undefined)

  const { name, symbol, decimals, /*operator,*/ baseToken } = poolStorage?.poolInitParams || {}
  const { /*delay,*/ spread } = poolStorage?.poolVariables || {}
  const { unitaryValue, totalSupply } = poolStorage?.poolTokensInfo || {}

  const token = useToken(poolAddressFromUrl ?? undefined) as Currency
  let base = useCurrency(baseToken !== ZERO_ADDRESS ? baseToken : undefined)

  const amount = JSBI.BigInt(unitaryValue ?? 0)
  const currencyBalance = CurrencyAmount.fromRawAmount(token ?? undefined, amount ?? undefined)

  if (baseToken === ZERO_ADDRESS) {
    base = nativeOnChain(chainId ?? 1)
  }
  // TODO: check results on altchains
  const baseTokenSymbol = base?.isNative ? 'ETH' : base?.symbol

  const poolValue = JSBI.divide(
    JSBI.multiply(JSBI.BigInt(unitaryValue ?? 0), JSBI.BigInt(totalSupply ?? 0)),
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals ?? 18))
  )

  //const addTransaction = useTransactionAdder()

  function modalHeader() {
    return (
      <AutoColumn gap="md" style={{ marginTop: '20px' }}>
        <ThemedText.DeprecatedItalic>
          <Trans>Let&apos;s check where this component goes.</Trans>
        </ThemedText.DeprecatedItalic>
      </AutoColumn>
    )
  }

  return (
    <>
      <PageWrapper>
        <TransactionConfirmationModal
          isOpen={showConfirm}
          onDismiss={() => setShowConfirm(false)}
          attemptingTxn={showConfirm}
          hash=""
          content={() => (
            <ConfirmationModalContent
              title={<Trans>Claim fees</Trans>}
              onDismiss={() => setShowConfirm(false)}
              topContent={modalHeader}
            />
          )}
          pendingText={<Trans>Collecting fees</Trans>}
        />
        <AutoColumn gap="md">
          <AutoColumn gap="sm">
            <Link
              data-cy="visit-pool"
              style={{ textDecoration: 'none', width: 'fit-content', marginBottom: '0.5rem' }}
              to="/mint"
            >
              <HoverText>
                <Trans>← Back to Pools</Trans>
              </HoverText>
            </Link>
            <ResponsiveRow>
              <RowFixed>
                {/* &nbsp;{poolName}&nbsp; */}
                <ThemedText.DeprecatedLabel fontSize="24px" mr="10px">
                  &nbsp;{name}&nbsp;|&nbsp;{symbol}&nbsp;
                </ThemedText.DeprecatedLabel>
              </RowFixed>
              {poolAddressFromUrl && (
                <ExternalLink href={getZapperLink(poolAddressFromUrl)}>
                  <RowFixed>
                    <ThemedText.DeprecatedMain>Pool Data ↗</ThemedText.DeprecatedMain>
                  </RowFixed>
                </ExternalLink>
              )}
              <RowFixed>
                <ResponsiveButtonPrimary
                  as={Link}
                  to={`/smart-pool/${poolAddressFromUrl}`}
                  width="fit-content"
                  padding="6px 8px"
                  $borderRadius="12px"
                  style={{ marginRight: '8px' }}
                >
                  <Trans>Buy</Trans>
                </ResponsiveButtonPrimary>
                <ResponsiveButtonPrimary
                  as={Link}
                  to={`/smart-pool/${poolAddressFromUrl}`}
                  width="fit-content"
                  padding="6px 8px"
                  $borderRadius="12px"
                >
                  <Trans>Sell</Trans>
                </ResponsiveButtonPrimary>
              </RowFixed>
            </ResponsiveRow>
          </AutoColumn>
          <ResponsiveRow align="flex-start">
            <AutoColumn gap="sm" style={{ width: '100%', height: '100%' }}>
              <DarkCard>
                <AutoColumn gap="md" style={{ width: '100%' }}>
                  <AutoColumn gap="md">
                    <Label>
                      {typeof chainId === 'number' && poolAddressFromUrl ? (
                        <ExternalLink href={getExplorerLink(chainId, poolAddressFromUrl, ExplorerDataType.ADDRESS)}>
                          <Trans>{poolAddressFromUrl}</Trans>
                        </ExternalLink>
                      ) : null}
                    </Label>
                    {!showConfirm && token && currencyBalance && baseTokenSymbol ? (
                      <ThemedText.DeprecatedLargeHeader fontSize="36px" fontWeight={500}>
                        {totalSupply && base && (
                          <Row>
                            <Trans>
                              Total Supply:&nbsp;
                              {formatCurrencyAmount(CurrencyAmount.fromRawAmount(base, JSBI.BigInt(totalSupply)), 4)}
                            </Trans>
                            &nbsp;{symbol}
                          </Row>
                        )}
                        {poolValue && base && (
                          <Row>
                            <Trans>
                              PoolValue:&nbsp;
                              {formatCurrencyAmount(CurrencyAmount.fromRawAmount(base, poolValue), 4)}&nbsp;
                              {baseTokenSymbol}
                            </Trans>
                          </Row>
                        )}
                        {baseTokenSymbol && (
                          <Row>
                            <Trans>
                              Price: {formatCurrencyAmount(currencyBalance, 4)}&nbsp;{baseTokenSymbol}
                            </Trans>
                          </Row>
                        )}
                      </ThemedText.DeprecatedLargeHeader>
                    ) : (
                      <ThemedText.DeprecatedLargeHeader color={theme.deprecated_text1} fontSize="36px" fontWeight={500}>
                        <Trans>$-</Trans>
                      </ThemedText.DeprecatedLargeHeader>
                    )}
                  </AutoColumn>
                  <LightCard padding="12px 16px">
                    <AutoColumn gap="md">
                      <RowBetween>
                        <RowFixed>
                          <ThemedText.DeprecatedMain>
                            <Trans>&nbsp;Decimals:&nbsp;{decimals}</Trans>
                          </ThemedText.DeprecatedMain>
                        </RowFixed>
                        <RowFixed>
                          <ThemedText.DeprecatedMain>
                            <Trans>&nbsp;Spread:&nbsp;{spread}&nbsp;</Trans>
                          </ThemedText.DeprecatedMain>
                        </RowFixed>
                      </RowBetween>
                    </AutoColumn>
                  </LightCard>
                </AutoColumn>
              </DarkCard>
            </AutoColumn>
          </ResponsiveRow>
        </AutoColumn>
      </PageWrapper>
      <SwitchLocaleLink />
    </>
  )
}
