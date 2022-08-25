import { PageName } from 'components/AmplitudeAnalytics/constants'
import { useAtom } from 'jotai'
import { getCurrentPageFromLocation } from 'pages/App'
import { useEffect, useState } from 'react'
import { X } from 'react-feather'
import { useLocation } from 'react-router-dom'
import styled, { useTheme } from 'styled-components/macro'
import { opacify } from 'theme/utils'

import tokensPromoDark from '../../assets/images/tokensPromoDark.png'
import tokensPromoLight from '../../assets/images/tokensPromoLight.png'
import { tokensBannerDismissedAtom } from './state'

const PopupContainer = styled.div<{ show: boolean }>`
  position: absolute;
  display: ${({ show }) => (show ? 'flex' : 'none')};
  flex-direction: column;
  padding: 12px 16px 12px 20px;
  gap: 8px;
  bottom: 48px;
  right: 16px;
  width: 320px;
  height: 88px;
  z-index: 5;
  background-color: ${({ theme }) => (theme.darkMode ? theme.backgroundScrim : opacify(60, '#FDF0F8'))};
  color: ${({ theme }) => theme.textPrimary};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.deepShadow};

  background-image: url(${({ theme }) => (theme.darkMode ? `${tokensPromoDark}` : `${tokensPromoLight}`)});
  background-size: cover;
  background-blend-mode: overlay;
`
const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`
const HeaderText = styled.div`
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  cursor: pointer;
`
const Description = styled.span`
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  width: 240px;
`

export default function TokensBanner() {
  const theme = useTheme()
  const { pathname } = useLocation()
  const currentPage = getCurrentPageFromLocation(pathname)
  const [showBanner, setShowBanner] = useState(false)
  const [tokensBannerDismissed, setTokensBannerDismissed] = useAtom(tokensBannerDismissedAtom)

  useEffect(() => {
    setShowBanner(currentPage === PageName.SWAP_PAGE || currentPage === PageName.POOL_PAGE)
    if (currentPage === PageName.TOKENS_PAGE) {
      setTokensBannerDismissed(true)
    }
  }, [currentPage, setTokensBannerDismissed])

  const closeBanner = () => {
    setShowBanner(false)
    setTokensBannerDismissed(true)
  }
  const clickBanner = () => {
    window.location.href = 'https://app.uniswap.org/#/tokens'
    setTokensBannerDismissed(true)
  }

  return (
    <PopupContainer show={showBanner && !tokensBannerDismissed}>
      <Header>
        <HeaderText onClick={clickBanner}>Explore Top Tokens</HeaderText>
        <X size={20} color={theme.textSecondary} onClick={closeBanner} style={{ cursor: 'pointer' }} />
      </Header>

      <Description onClick={clickBanner}>Check out the new explore tab to discover and learn more</Description>
    </PopupContainer>
  )
}
