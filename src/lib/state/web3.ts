import { atom } from 'jotai'
import { atomWithDefault } from 'jotai/utils'
import { initializeConnector, Web3ReactHooks } from 'widgets-web3-react/core'
import { EMPTY } from 'widgets-web3-react/empty'
import { Connector } from 'widgets-web3-react/types'

const EMPTY_CONNECTOR = initializeConnector(() => EMPTY)

export type Web3ReactState = [Connector, Web3ReactHooks]

export const urlAtom = atomWithDefault<Web3ReactState>(() => EMPTY_CONNECTOR)
export const injectedAtom = atomWithDefault<Web3ReactState>(() => EMPTY_CONNECTOR)
export const providerAtom = atom<Web3ReactState>((get) => {
  const url = get(urlAtom)
  const injected = get(injectedAtom)
  if (injected[0] !== EMPTY) {
    return get(injectedAtom)
  }
  return url
})
