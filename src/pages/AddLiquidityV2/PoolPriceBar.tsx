import { Trans } from '@lingui/macro'
import { Currency, Percent, Price } from '@uniswap/sdk-core'
import { useContext } from 'react'
import { Text as RebassText } from 'rebass'
import { ThemeContext } from 'styled-components/macro'

import { AutoColumn } from '../../components/Column'
import { AutoRow } from '../../components/Row'
import { ONE_BIPS } from '../../constants/misc'
import { Field } from '../../state/mint/actions'
import { TextPreset } from '../../theme'

export function PoolPriceBar({
  currencies,
  noLiquidity,
  poolTokenPercentage,
  price,
}: {
  currencies: { [field in Field]?: Currency }
  noLiquidity?: boolean
  poolTokenPercentage?: Percent
  price?: Price<Currency, Currency>
}) {
  const theme = useContext(ThemeContext)
  return (
    <AutoColumn gap="md">
      <AutoRow justify="space-around" gap="4px">
        <AutoColumn justify="center">
          <TextPreset.Black>{price?.toSignificant(6) ?? '-'}</TextPreset.Black>
          <RebassText fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
            <Trans>
              {currencies[Field.CURRENCY_B]?.symbol} per {currencies[Field.CURRENCY_A]?.symbol}
            </Trans>
          </RebassText>
        </AutoColumn>
        <AutoColumn justify="center">
          <TextPreset.Black>{price?.invert()?.toSignificant(6) ?? '-'}</TextPreset.Black>
          <RebassText fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
            <Trans>
              {currencies[Field.CURRENCY_A]?.symbol} per {currencies[Field.CURRENCY_B]?.symbol}
            </Trans>
          </RebassText>
        </AutoColumn>
        <AutoColumn justify="center">
          <TextPreset.Black>
            {noLiquidity && price
              ? '100'
              : (poolTokenPercentage?.lessThan(ONE_BIPS) ? '<0.01' : poolTokenPercentage?.toFixed(2)) ?? '0'}
            %
          </TextPreset.Black>
          <RebassText fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
            <Trans>Share of Pool</Trans>
          </RebassText>
        </AutoColumn>
      </AutoRow>
    </AutoColumn>
  )
}
