import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { useFiatOnRampButtonEnabled } from 'featureFlags/flags/fiatOnRampButton'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { RowBetween, RowFixed } from '../Row'
import SettingsTab from '../Settings'
import SwapBuyFiatButton from './SwapBuyFiatButton'

const StyledSwapHeader = styled(RowBetween)`
  margin-bottom: 8px;
  color: ${({ theme }) => theme.textSecondary};
`

const HeaderButtonContainer = styled(RowFixed)`
  padding: 0 12px;
`

export default function SwapHeader({ autoSlippage }: { autoSlippage: Percent }) {
  const fiatOnRampButtonEnabled = useFiatOnRampButtonEnabled()

  return (
    <StyledSwapHeader>
      <HeaderButtonContainer gap="lg">
        <ThemedText.SubHeader>
          <Trans>Swap</Trans>
        </ThemedText.SubHeader>
        {fiatOnRampButtonEnabled && <SwapBuyFiatButton />}
      </HeaderButtonContainer>
      <RowFixed>
        <SettingsTab autoSlippage={autoSlippage} />
      </RowFixed>
    </StyledSwapHeader>
  )
}
