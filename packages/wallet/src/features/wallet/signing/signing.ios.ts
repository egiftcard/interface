// If the message to be signed is a hex string, it must be converted to an array:

import { TypedDataDomain, TypedDataField, Wallet } from 'ethers'
import { arrayify, isHexString } from 'ethers/lib/utils'
import { logger } from 'wallet/src/features/logger/logger'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { NativeSigner } from 'wallet/src/features/wallet/signing/NativeSigner'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'
import { EthTypedMessage } from 'wallet/src/features/wallet/signing/types'
import { ensureLeading0x } from 'wallet/src/utils/addresses'

// https://docs.ethers.io/v5/api/signer/#Signer--signing-methods
export async function signMessage(
  message: string,
  account: Account,
  signerManager: SignerManager
): Promise<string> {
  const signer = await signerManager.getSignerForAccount(account)
  if (!signer) {
    logger.error('Error signing signing message', {
      tags: {
        file: 'signing.ios',
        function: 'signMessage',
        message,
        account: JSON.stringify(account),
      },
    })
    return ''
  }

  let signature
  if (isHexString(message)) {
    signature = await signer.signMessage(arrayify(message))
  } else {
    signature = await signer.signMessage(message)
  }

  return ensureLeading0x(signature)
}

export async function signTypedData(
  domain: TypedDataDomain,
  types: Record<string, TypedDataField[]>,
  value: Record<string, unknown>,
  account: Account,
  signerManager: SignerManager
): Promise<string> {
  const signer = await signerManager.getSignerForAccount(account)

  // https://github.com/LedgerHQ/ledgerjs/issues/86
  // Ledger does not support signTypedData yet
  if (!(signer instanceof NativeSigner) && !(signer instanceof Wallet)) {
    logger.error('Error signing typed data with account', {
      tags: {
        file: 'signing.ios',
        function: 'signTypedData',
      },
    })
    return ''
  }

  const signature = await signer._signTypedData(domain, types, value)

  return ensureLeading0x(signature)
}

export async function signTypedDataMessage(
  message: string,
  account: Account,
  signerManager: SignerManager
): Promise<string> {
  const parsedData: EthTypedMessage = JSON.parse(message)
  // ethers computes EIP712Domain type for you, so we should not pass it in directly
  // or else ethers will get confused about which type is the primary type
  // https://github.com/ethers-io/ethers.js/issues/687#issuecomment-714069471
  delete parsedData.types.EIP712Domain

  return signTypedData(
    parsedData.domain,
    parsedData.types,
    parsedData.message,
    account,
    signerManager
  )
}
