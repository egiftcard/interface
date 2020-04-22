import React from 'react'
import styled from 'styled-components'

import Row from '../Row'
import Menu from '../Menu'
import Card, { YellowCard } from '../Card'
import Web3Status from '../Web3Status'
import { X } from 'react-feather'

import { Link } from '../../theme'
import { Text } from 'rebass'
import { YellowCard } from '../Card'
import Web3Status from '../Web3Status'

import { WETH } from '@uniswap/sdk'
import { useWeb3React } from '../../hooks'
import { useAddressBalance } from '../../contexts/Balances'
import { useWalletModalToggle } from '../../contexts/Application'

import Logo from '../../assets/svg/logo.svg'
import Wordmark from '../../assets/svg/wordmark.svg'

const HeaderFrame = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  position: absolute;
`

const HeaderElement = styled.div`
  display: flex;
  min-width: 0;
  display: flex;
  align-items: center;
`

const Title = styled.div`
  display: flex;
  align-items: center;

  :hover {
    cursor: pointer;
  }
`

const TitleText = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.black};
  margin-left: 12px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `};
`

const AccountElement = styled.div`
  display: flex;
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme, active }) => (!active ? theme.white : theme.bg3)};
  border: 1px solid ${({ theme }) => theme.bg3};
  border-radius: 12px;
  padding-left: ${({ active }) => (active ? '8px' : 0)};
  white-space: nowrap;

  :focus {
    border: 1px solid blue;
  }
`

const TestnetWrapper = styled.div`
  white-space: nowrap;
  width: fit-content;
  margin-left: 10px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    // position: absolute; 
    // top: 70px;
    // right: 20px;
    display: none;
  `};
`

const NetworkCard = styled(YellowCard)`
  width: fit-content;
  margin-right: 10px;
  border-radius: 12px;
  padding: 8px 12px;
`

export default function Header() {
  const { account, chainId } = useWeb3React()

  const userEthBalance = useAddressBalance(account, WETH[chainId])
  const toggleWalletModal = useWalletModalToggle()

  return (
    <HeaderFrame>
      <HeaderElement>
        <Title>
          <Link id="link" href="https://uniswap.io">
            <img src={Logo} alt="logo" />
          </Link>
          {!isMobile && (
            <>
              <Link id="link" href="https://uniswap.io">
                <img style={{ marginLeft: '4px' }} src={Wordmark} alt="logo" />
              </Link>
              <p style={{ opacity: 0.6, marginLeft: '4px', fontSize: '16px' }}>{'/ Exchange'}</p>
            </>
          )}
        </Title>
      </HeaderElement>
      <HeaderElement>
        {!isMobile && chainId === 4 && <NetworkCard>Rinkeby Testnet</NetworkCard>}
        {!isMobile && chainId === 3 && <NetworkCard> Ropsten Testnet</NetworkCard>}
        {!isMobile && chainId === 5 && <NetworkCard>Goerli Testnet</NetworkCard>}
        {!isMobile && chainId === 42 && <NetworkCard>Kovan Testnet</NetworkCard>}
        <AccountElement active={!!account}>
          {account ? (
            <Row style={{ marginRight: '-1.25rem', paddingRight: '1.75rem' }}>
              <Text fontWeight={400}> {userEthBalance && userEthBalance?.toFixed(4) + ' ETH'}</Text>
            </Row>
          ) : (
            ''
          )}
          <Web3Status onClick={toggleWalletModal} />
        </AccountElement>
        <TestnetWrapper>
          {chainId === 4 && <YellowCard padding={'6px'}>Rinkeby Testnet</YellowCard>}
          {chainId === 3 && <YellowCard padding={'6px'}>Ropsten Testnet</YellowCard>}
          {chainId === 5 && <YellowCard padding={'6px'}>Goerli Testnet</YellowCard>}
          {chainId === 42 && <YellowCard padding={'6px'}>Kovan Testnet</YellowCard>}
        </TestnetWrapper>
        <Menu />
      </HeaderElement>
    </HeaderFrame>
  )
}
