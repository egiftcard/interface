import { useWeb3React } from '@web3-react/core'
import { getConnection } from 'connection'
import { didUserReject } from 'connection/utils'
import { SupportedChainId } from 'constants/chains'
import { useCallback } from 'react'
import { addPopup } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'
import { switchChain } from 'utils/switchChain'

export default function useSelectChain() {
  const dispatch = useAppDispatch()
  const { connector } = useWeb3React()

  return useCallback(
    async (targetChain: SupportedChainId) => {
      if (!connector) return

      const connection = getConnection(connector)

      try {
        await switchChain(connector, targetChain)
      } catch (error) {
        if (!didUserReject(connection, error)) {
          console.error('Failed to switch networks', error)
          dispatch(addPopup({ content: { failedSwitchNetwork: targetChain }, key: 'failed-network-switch' }))
        }

        // If we failed to switch chains, we should re-activate the connector.
        try {
          await connector.activate()
        } catch (error) {
          console.error('Failed to re-activate connector', error)
        }
      }
    },
    [connector, dispatch]
  )
}
