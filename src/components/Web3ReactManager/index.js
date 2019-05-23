import React, { useState, useEffect } from 'react'
import { useWeb3Context, Connectors } from 'web3-react'
import styled, { keyframes } from 'styled-components'
import { ethers } from 'ethers'
import { useTranslation } from 'react-i18next'
import { isMobile } from 'react-device-detect'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'

import { getNetworkName } from '../../utils'

const { Connector } = Connectors

const MessageWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 20rem;
`

const Message = styled.h2`
  color: ${({ theme }) => theme.uniswapPink};
`

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`
const Spinner = styled.div`
  font-size: 4rem;

  svg {
    animation: 2s ${rotate} linear infinite;

    path {
      color: ${({ theme }) => theme.uniswapPink};
    }
  }
`

function tryToSetConnector(setConnector, setError) {
  setConnector('Injected', { suppressAndThrowErrors: true }).catch(error => {
    if (error.code === Connector.errorCodes.UNSUPPORTED_NETWORK) {
      setError(error, { connectorName: 'Injected' })
    } else {
      setConnector('Network')
    }
  })
}

export default function Web3ReactManager({ children }) {
  const { t } = useTranslation()
  const { active, error, setConnector, setError } = useWeb3Context()

  useEffect(() => {
    if (!active && !error) {
      if (window.ethereum || window.web3) {
        if (isMobile) {
          tryToSetConnector(setConnector, setError)
        } else {
          const library = new ethers.providers.Web3Provider(window.ethereum || window.web3)
          library.listAccounts().then(accounts => {
            if (accounts.length >= 1) {
              tryToSetConnector(setConnector, setError)
            } else {
              setConnector('Network')
            }
          })
        }
      } else {
        setConnector('Network')
      }
    }
  }, [active, error, setConnector, setError])

  const [showLoader, setShowLoader] = useState(false)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowLoader(true)
    }, 750)
    return () => {
      clearTimeout(timeout)
    }
  }, [])

  if (error) {
    if (error.code === Connector.errorCodes.UNSUPPORTED_NETWORK) {
      const correctNetwork = getNetworkName(Number(process.env.REACT_APP_NETWORK_ID))
      return (
        <MessageWrapper>
          <Message>{`${t('wrongNetwork')}. ${t('switchNetwork', { correctNetwork })}.`}</Message>
        </MessageWrapper>
      )
    } else {
      return (
        <MessageWrapper>
          <Message>{t('unknownError')}</Message>
        </MessageWrapper>
      )
    }
  } else if (!active) {
    return showLoader ? (
      <MessageWrapper>
        <Spinner>
          <FontAwesomeIcon icon={faCircleNotch} />
        </Spinner>
      </MessageWrapper>
    ) : null
  } else {
    return children
  }
}
