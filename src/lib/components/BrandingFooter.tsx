import { Trans } from '@lingui/macro'
import Row from 'lib/components/Row'
import { Logo } from 'lib/icons'
import styled from 'lib/theme'

import ExternalLink from './ExternalLink'

const UniswapA = styled(ExternalLink)`
  color: ${({ theme }) => theme.secondary};
  cursor: pointer;
  display: flex;
  font-size: 0.75em;
  justify-content: center;
  line-height: 1.35em;
  text-decoration: none;

  ${Logo} {
    fill: ${({ theme }) => theme.secondary};
    height: 1em;
    transition: transform 0.25s ease;
    width: 1em;
    will-change: transform;

    :hover {
      fill: ${({ theme }) => theme.onHover(theme.secondary)};
      transform: rotate(-5deg);
    }
  }
`

export default function BrandingFooter() {
  return (
    <UniswapA href={`https://app.uniswap.org/`}>
      <Row gap={0.4}>
        <Logo />
        <Trans>Powered by the Uniswap protocol</Trans>
      </Row>
    </UniswapA>
  )
}
