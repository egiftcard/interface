import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from 'src/app/rootReducer'
import { ClientSideOrderBy, CoingeckoOrderBy } from 'src/features/dataApi/coingecko/types'
import { NFTViewType } from 'src/features/wallet/types'
import { AccountType, NativeAccount } from './accounts/types'

const DEFAULT_TOKENS_ORDER_BY = CoingeckoOrderBy.MarketCapDesc
const DEFAULT_TOKENS_METADATA_DISPLAY_TYPE = ClientSideOrderBy.PriceChangePercentage24hDesc

export const selectAccounts = (state: RootState) => state.wallet.accounts

export const selectNonPendingAccounts = createSelector(selectAccounts, (accounts) =>
  Object.fromEntries(Object.entries(accounts).filter((a) => !a[1].pending))
)

export const selectPendingAccounts = createSelector(selectAccounts, (accounts) =>
  Object.fromEntries(Object.entries(accounts).filter((a) => a[1].pending))
)

export const selectSignerAccounts = createSelector(selectAccounts, (accounts) =>
  Object.values(accounts).filter((a) => a.type !== AccountType.Readonly)
)

export const selectSortedMnemonicAccounts = createSelector(selectAccounts, (accounts) =>
  Object.values(accounts)
    .filter((account) => account.type === AccountType.Native)
    .sort((a, b) => (a as NativeAccount).derivationIndex - (b as NativeAccount).derivationIndex)
    .map((account) => account as NativeAccount)
)

export const selectNativeAccountExists = createSelector(
  selectNonPendingAccounts,
  (accounts) =>
    Object.values(accounts).findIndex((value) => {
      return value.type === AccountType.Native
    }) >= 0
)

export const selectActiveAccountAddress = (state: RootState) => state.wallet.activeAccountAddress
export const selectActiveAccount = createSelector(
  selectAccounts,
  selectActiveAccountAddress,
  (accounts, activeAccountAddress) =>
    (activeAccountAddress ? accounts[activeAccountAddress] : null) ?? null
)

export const selectUserPalette = createSelector(
  selectActiveAccount,
  (activeAccount) => activeAccount?.customizations?.palette
)

export const makeSelectLocalPfp = (address: Address) =>
  createSelector(selectAccounts, (accounts) => accounts[address]?.customizations?.localPfp)

export const selectFinishedOnboarding = (state: RootState) => state.wallet.finishedOnboarding
export const selectFlashbotsEnabled = (state: RootState) => state.wallet.flashbotsEnabled
export const selectIsBiometricAuthEnabled = (state: RootState) =>
  state.wallet.isBiometricAuthEnabled
export const selectNFTViewType = (state: RootState) =>
  state.wallet.settings.nftViewType ?? NFTViewType.Grid
export const selectHideSmallBalances = (state: RootState) =>
  !state.wallet.settings.showSmallBalances

export const selectTokensOrderBy = (state: RootState) =>
  state.wallet.settings.tokensOrderBy ?? DEFAULT_TOKENS_ORDER_BY

// Selects tokens metadata with a default
export const selectTokensMetadataDisplayType = createSelector(
  selectTokensOrderBy,
  (state: RootState) => state.wallet.settings.tokensMetadataDisplayType,
  (tokensOrderBy, tokensMetadataDisplayType) =>
    tokensMetadataDisplayType ?? DEFAULT_TOKENS_METADATA_DISPLAY_TYPE
)

export const selectInactiveAccountAddresses = createSelector(
  selectActiveAccountAddress,
  selectAccounts,
  (activeAddress, accounts) => Object.keys(accounts).filter((address) => address !== activeAddress)
)

export const selectInactiveAccounts = createSelector(
  selectActiveAccountAddress,
  selectAccounts,
  (activeAddress, accounts) =>
    Object.values(accounts).filter((account) => account.address !== activeAddress)
)

export const makeSelectAccountNotificationSetting = (address: Address) =>
  createSelector(selectAccounts, (accounts) => !!accounts[address]?.pushNotificationsEnabled)
