import { MaxUint256 } from '@ethersproject/constants'
import { TransactionResponse } from '@ethersproject/providers'
import { CurrencyAmount, Currency, ChainId, TradeType, Percent } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'
import { Trade } from '@kyberswap/ks-sdk-classic'
import { Trade as ProAmmTrade } from '@kyberswap/ks-sdk-elastic'
import { useCallback, useMemo } from 'react'
import { DYNAMIC_FEE_ROUTER_ADDRESSES } from 'constants/index'
import { useTokenAllowance } from 'data/Allowances'
import { Field } from 'state/swap/actions'
import { useHasPendingApproval, useTransactionAdder } from 'state/transactions/hooks'
import { computeSlippageAdjustedAmounts } from 'utils/prices'
import { calculateGasMargin } from 'utils'
import { useTokenContract } from './useContract'
import { useActiveWeb3React } from './index'
import { Aggregator } from '../utils/aggregator'
import { nativeOnChain } from 'constants/tokens'
import { PRO_AMM_ROUTERS } from 'constants/v2'
import { useSelector } from 'react-redux'
import { ethers } from 'ethers'
import { AppState } from 'state'

export enum ApprovalState {
  UNKNOWN,
  NOT_APPROVED,
  PENDING,
  APPROVED,
}

// returns a variable indicating the state of the approval and a function which approves if necessary or early returns
export function useApproveCallback(
  amountToApprove?: CurrencyAmount<Currency>,
  spender?: string,
): [ApprovalState, () => Promise<void>] {
  const { account, chainId } = useActiveWeb3React()
  const token = amountToApprove?.currency.wrapped
  const currentAllowance = useTokenAllowance(token, account ?? undefined, spender)
  const pendingApproval = useHasPendingApproval(token?.address, spender)
  // check the current approval status
  const approvalState: ApprovalState = useMemo(() => {
    if (!amountToApprove || !spender) return ApprovalState.UNKNOWN
    if (amountToApprove.currency.isNative) return ApprovalState.APPROVED
    // we might not have enough data to know whether or not we need to approve
    if (!currentAllowance) return ApprovalState.UNKNOWN

    // Handle farm approval.
    if (amountToApprove.quotient.toString() === MaxUint256.toString()) {
      return currentAllowance.equalTo(JSBI.BigInt(0))
        ? pendingApproval
          ? ApprovalState.PENDING
          : ApprovalState.NOT_APPROVED
        : ApprovalState.APPROVED
    }

    return currentAllowance.lessThan(amountToApprove)
      ? pendingApproval
        ? ApprovalState.PENDING
        : ApprovalState.NOT_APPROVED
      : ApprovalState.APPROVED
  }, [amountToApprove, currentAllowance, pendingApproval, spender])

  const tokenContract = useTokenContract(token?.address)
  const addTransactionWithType = useTransactionAdder()

  const gasPrice = useSelector((state: AppState) => state.application.gasPrice)
  const approve = useCallback(async (): Promise<void> => {
    if (approvalState !== ApprovalState.NOT_APPROVED) {
      console.error('approve was called unnecessarily')
      return
    }
    if (!token) {
      console.error('no token')
      return
    }

    if (!tokenContract) {
      console.error('tokenContract is null')
      return
    }

    if (!amountToApprove) {
      console.error('missing amount to approve')
      return
    }

    if (!spender) {
      console.error('no spender')
      return
    }

    let useExact = false
    let needRevoke = false

    const estimatedGas = await tokenContract.estimateGas.approve(spender, MaxUint256).catch(() => {
      // general fallback for tokens who restrict approval amounts
      useExact = true
      return tokenContract.estimateGas.approve(spender, amountToApprove.quotient.toString()).catch(() => {
        needRevoke = true
        return tokenContract.estimateGas.approve(spender, '0')
      })
    })

    console.log(
      '[gas_price] approval used: ',
      gasPrice?.standard ? `api/node: ${gasPrice?.standard} wei` : 'metamask default',
    )

    if (needRevoke) {
      return tokenContract.approve(spender, '0', {
        ...(gasPrice?.standard ? { gasPrice: ethers.utils.parseUnits(gasPrice?.standard, 'wei') } : {}),
        gasLimit: calculateGasMargin(estimatedGas),
      })
    }

    return tokenContract
      .approve(spender, useExact ? amountToApprove.quotient.toString() : MaxUint256, {
        ...(gasPrice?.standard ? { gasPrice: ethers.utils.parseUnits(gasPrice?.standard, 'wei') } : {}),
        gasLimit: calculateGasMargin(estimatedGas),
      })
      .then((response: TransactionResponse) => {
        addTransactionWithType(response, {
          type: 'Approve',
          summary: amountToApprove.currency.isNative
            ? nativeOnChain(chainId as ChainId).symbol
            : amountToApprove.currency.symbol,
          approval: { tokenAddress: token.address, spender: spender },
        })
      })
      .catch((error: Error) => {
        console.debug('Failed to approve token', error)
        throw error
      })
  }, [approvalState, token, tokenContract, amountToApprove, spender, addTransactionWithType, chainId, gasPrice])

  return [approvalState, approve]
}

// wraps useApproveCallback in the context of a swap
export function useApproveCallbackFromTrade(trade?: Trade<Currency, Currency, TradeType>, allowedSlippage = 0) {
  const { chainId } = useActiveWeb3React()
  const amountToApprove = useMemo(
    () => (trade ? computeSlippageAdjustedAmounts(trade, allowedSlippage)[Field.INPUT] : undefined),
    [trade, allowedSlippage],
  )
  return useApproveCallback(amountToApprove, !!chainId ? DYNAMIC_FEE_ROUTER_ADDRESSES[chainId] : undefined)
}

// wraps useApproveCallback in the context of a swap
export function useApproveCallbackFromTradeV2(trade?: Aggregator, allowedSlippage = 0) {
  const { chainId } = useActiveWeb3React()
  const amountToApprove = useMemo(
    () => (trade ? computeSlippageAdjustedAmounts(trade, allowedSlippage)[Field.INPUT] : undefined),
    [trade, allowedSlippage],
  )
  return useApproveCallback(amountToApprove, !!chainId && trade?.routerAddress ? trade.routerAddress : undefined)
}

export function useProAmmApproveCallback(
  trade: ProAmmTrade<Currency, Currency, TradeType> | undefined,
  allowedSlippage: Percent,
) {
  const { chainId } = useActiveWeb3React()
  const amountToApprove = useMemo(
    () => (trade && trade.inputAmount.currency.isToken ? trade.maximumAmountIn(allowedSlippage) : undefined),
    [trade, allowedSlippage],
  )
  return useApproveCallback(amountToApprove, !!chainId ? PRO_AMM_ROUTERS[chainId] : undefined)
}
