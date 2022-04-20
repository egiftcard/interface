import { Currency, Token } from '@uniswap/sdk-core'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import useCurrencyLogoURIs from 'lib/hooks/useCurrencyLogoURIs'
import { useCallback, useState } from 'react'

import useIsCoinbaseWallet from './useIsCoinbaseWallet'

export default function useAddToken(currencyToAdd: Currency | undefined): {
  addToken: () => void
  success: boolean | undefined
} {
  const { library } = useActiveWeb3React()

  const token: Token | undefined = currencyToAdd?.wrapped

  const [success, setSuccess] = useState<boolean | undefined>()
  const logoURL = useCurrencyLogoURIs(token)[0]

  const isCoinbaseWallet = useIsCoinbaseWallet()

  const addToken = useCallback(() => {
    if (
      library &&
      library?.provider &&
      (library?.provider?.isMetaMask || isCoinbaseWallet) &&
      library.provider.request &&
      token
    ) {
      library.provider
        .request({
          method: 'wallet_watchAsset',
          params: {
            //@ts-ignore // need this for incorrect ethers provider type
            type: 'ERC20',
            options: {
              address: token.address,
              symbol: token.symbol,
              decimals: token.decimals,
              image: logoURL,
            },
          },
        })
        .then((success) => {
          setSuccess(success)
        })
        .catch(() => setSuccess(false))
    } else {
      setSuccess(false)
    }
  }, [isCoinbaseWallet, library, logoURL, token])

  return { addToken, success }
}
