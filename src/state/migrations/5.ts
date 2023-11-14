import { PersistState } from 'redux-persist'
import { RouterPreference } from 'state/routing/types'
import { UserState } from 'state/user/reducer'

export type PersistAppStateV5 = {
  _persist: PersistState
} & { user?: UserState & { disabledUniswapX?: boolean } }

/**
 * Migration to migrate users to UniswapX by default.
 */
export const migration5 = (state: PersistAppStateV5 | undefined) => {
  // Remove a previously-persisted variable
  if (state?.user && 'disabledUniswapX' in state.user) {
    delete state.user['disabledUniswapX']
  }
  // If the the user has previously disabled UniswapX *during the opt-out rollout period*, we respect that preference.
  if (state?.user && !state.user?.optedOutOfUniswapX) {
    return {
      ...state,
      user: {
        ...state.user,
        userRouterPreference: RouterPreference.X,
      },
      _persist: {
        ...state._persist,
        version: 5,
      },
    }
  }
  return state
}