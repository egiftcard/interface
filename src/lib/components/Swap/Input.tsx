import { Trans } from '@lingui/macro'
import { useUSDCValue } from 'hooks/useUSDCPrice'
import { useAtomValue } from 'jotai/utils'
import { useSwapAmount, useSwapCurrency, useSwapInfo } from 'lib/hooks/swap'
import { usePrefetchCurrencyColor } from 'lib/hooks/useCurrencyColor'
import { Field, independentFieldAtom } from 'lib/state/swap'
import styled, { ThemedText } from 'lib/theme'
import { useMemo } from 'react'
import { TradeState } from 'state/routing/types'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

import Column from '../Column'
import { LoadingOpacityContainer } from '../Loader'
import Row from '../Row'
import TokenImg from '../TokenImg'
import TokenInput from './TokenInput'

const InputColumn = styled(Column)<{ approved?: boolean }>`
  margin: 0.75em;
  position: relative;

  ${TokenImg} {
    filter: ${({ approved }) => (approved ? undefined : 'saturate(0) opacity(0.4)')};
    transition: filter 0.25s;
  }
`

interface InputProps {
  disabled?: boolean
}

export default function Input({ disabled }: InputProps) {
  const {
    trade: { state: tradeState },
    currencyBalances: { [Field.INPUT]: balance },
    currencyAmounts: { [Field.INPUT]: inputCurrencyAmount },
  } = useSwapInfo()
  const inputUSDC = useUSDCValue(inputCurrencyAmount)

  const [swapInputAmount, updateSwapInputAmount] = useSwapAmount(Field.INPUT)
  const [swapInputCurrency, updateSwapInputCurrency] = useSwapCurrency(Field.INPUT)

  // extract eagerly in case of reversal
  usePrefetchCurrencyColor(swapInputCurrency)

  const isRouteLoading = useMemo(
    () => TradeState.LOADING === tradeState || TradeState.SYNCING === tradeState,
    [tradeState]
  )
  const independentField = useAtomValue(independentFieldAtom)
  const showLoading = independentField === Field.OUTPUT && isRouteLoading

  //TODO(ianlapham): mimic logic from app swap page
  const mockApproved = true

  const onMax = useMemo(() => {
    if (balance?.greaterThan(0)) {
      return () => updateSwapInputAmount(balance.toExact())
    }
    return
  }, [balance, updateSwapInputAmount])

  return (
    <InputColumn gap={0.5} approved={mockApproved}>
      <Row>
        <ThemedText.Subhead2 color="secondary">
          <Trans>Trading</Trans>
        </ThemedText.Subhead2>
      </Row>
      <TokenInput
        currency={swapInputCurrency}
        amount={(swapInputAmount !== undefined ? swapInputAmount : inputCurrencyAmount?.toSignificant(6)) ?? ''}
        disabled={disabled}
        onMax={onMax}
        onChangeInput={updateSwapInputAmount}
        onChangeCurrency={updateSwapInputCurrency}
        loading={showLoading}
      >
        <ThemedText.Body2 color="secondary">
          <Row>
            <LoadingOpacityContainer $loading={showLoading}>
              <span>{inputUSDC ? `$${inputUSDC.toFixed(2)}` : '-'}</span>
            </LoadingOpacityContainer>
            {balance && (
              <ThemedText.Body2 color={inputCurrencyAmount?.greaterThan(balance) ? 'error' : undefined}>
                Balance: <span style={{ userSelect: 'text' }}>{formatCurrencyAmount(balance, 4)}</span>
              </ThemedText.Body2>
            )}
          </Row>
        </ThemedText.Body2>
      </TokenInput>
      <Row />
    </InputColumn>
  )
}
