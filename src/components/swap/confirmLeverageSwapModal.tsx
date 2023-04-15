import { Trans } from '@lingui/macro'
import { Trace } from '@uniswap/analytics'
import { InterfaceModalName } from '@uniswap/analytics-events'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { ReactNode, useCallback, useMemo, useState } from 'react'
import { InterfaceTrade } from 'state/routing/types'
import { tradeMeaningfullyDiffers } from 'utils/tradeMeaningFullyDiffer'
import { SmallButtonPrimary,ButtonPrimary } from 'components/Button'

import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent,
  LevTransactionConfirmationModal
} from '../TransactionConfirmationModal'
import SwapModalFooter from './SwapModalFooter'
import CloseLevSwapModalHeader from './CloseLevSwapModalHeader'
import {
  // useDefaultsFromURLSearch,
  useDerivedSwapInfo,
  // useSwapActionHandlers,
  // useSwapState,
} from '../../state/swap/hooks'
export default function ConfirmLeverageSwapModal({
  // trade,
  // originalTrade,
  // onAcceptChanges,
  // allowedSlippage,
  // onConfirm,
  onDismiss,
  recipient,
  // swapErrorMessage,
  isOpen,
  attemptingTxn,
  txHash,
  // swapQuoteReceivedDate,
  // fiatValueInput,
  // fiatValueOutput,
}: {
  isOpen: boolean
  // trade: InterfaceTrade<Currency, Currency, TradeType> | undefined
  // originalTrade: Trade<Currency, Currency, TradeType> | undefined
  attemptingTxn: boolean
  txHash: string | undefined
  recipient: string | null
  // allowedSlippage: Percent
  // onAcceptChanges: () => void
  // onConfirm: () => void
  // swapErrorMessage: ReactNode | undefined
  onDismiss: () => void
  // // swapQuoteReceivedDate: Date | undefined
  // fiatValueInput: { data?: number; isLoading: boolean }
  // fiatValueOutput: { data?: number; isLoading: boolean }
}) {
  const [isLoadingQuote, setIsLoadingQuote] = useState(false); 
  // // shouldLogModalCloseEvent lets the child SwapModalHeader component know when modal has been closed
  // // and an event triggered by modal closing should be logged.
  const [shouldLogModalCloseEvent, setShouldLogModalCloseEvent] = useState(false)
  // const showAcceptChanges = useMemo(
  //   () => Boolean(trade && originalTrade && tradeMeaningfullyDiffers(trade, originalTrade)),
  //   [originalTrade, trade]
  // )
  // console.log('trade here')
  const onModalDismiss = useCallback(() => {
    if (isOpen) setShouldLogModalCloseEvent(true)
    onDismiss()
  }, [isOpen, onDismiss])

  const {
    trade: { state: tradeState, trade },
    allowedSlippage,
    currencyBalances,
    parsedAmount,
    currencies,
    inputError: swapInputError,
  } = useDerivedSwapInfo()

    // trade: new InterfaceTrade({
    //   v2Routes: [],
    //   v3Routes: [
    //     {
    //       routev3: "bestRoute",
    //       inputAmount: "10",
    //       outputAmount: "10",
    //     },
    //   ],
    //   TradeType.EXACT_INPUT,
    // }),

  const modalHeader = useCallback(() => {
    return null
     
    // trade ? (
    //   <SwapModalHeader
    //     trade={trade}
    //     shouldLogModalCloseEvent={shouldLogModalCloseEvent}
    //     setShouldLogModalCloseEvent={setShouldLogModalCloseEvent}
    //     allowedSlippage={allowedSlippage}
    //     recipient={recipient}
    //     showAcceptChanges={showAcceptChanges}
    //     onAcceptChanges={onAcceptChanges}
    //   />
    // ) : null
  }, []
 // [allowedSlippage, onAcceptChanges, recipient, showAcceptChanges, trade, shouldLogModalCloseEvent]
  )
  const modalBottom = useCallback(()=>{
    return null; 

  }, [])
  // const modalBottom = useCallback(() => {
  //   return trade ? (
  //     <SwapModalFooter
  //       onConfirm={onConfirm}
  //       trade={trade}
  //       hash={txHash}
  //       allowedSlippage={allowedSlippage}
  //       disabledConfirm={showAcceptChanges}
  //       swapErrorMessage={swapErrorMessage}
  //       swapQuoteReceivedDate={swapQuoteReceivedDate}
  //       fiatValueInput={fiatValueInput}
  //       fiatValueOutput={fiatValueOutput}
  //     />
  //   ) : null
  // }, [
  //   onConfirm,
  //   showAcceptChanges,
  //   swapErrorMessage,
  //   trade,
  //   allowedSlippage,
  //   txHash,
  //   swapQuoteReceivedDate,
  //   fiatValueInput,
  //   fiatValueOutput,
  // ])



  // // text to show while loading
  const pendingText = (
    <Trans>
    Swapping USDC for ETH
  {/*      Swapping {trade?.inputAmount?.toSignificant(6)} {trade?.inputAmount?.currency?.symbol} for{' '}
      {trade?.outputAmount?.toSignificant(6)} {trade?.outputAmount?.currency?.symbol} */}
    </Trans>
  )
  const swapErrorMessage = null;

  const confirmationContent = useCallback(
    () =>
      swapErrorMessage ? (
        <TransactionErrorContent onDismiss={onModalDismiss} message={swapErrorMessage} />
      ) : (
        <ConfirmationModalContent
          title={<Trans>Confirm Swap</Trans>}
          onDismiss={onModalDismiss}
          topContent={modalHeader}
          bottomContent={modalBottom}
        />
      ),
    [onModalDismiss, modalBottom, modalHeader, swapErrorMessage]
  )

  return (

    <Trace modal={InterfaceModalName.CONFIRM_SWAP}>


      <LevTransactionConfirmationModal
        isOpen={isOpen}
        onDismiss={onModalDismiss}
        attemptingTxn={false}
        hash={txHash}
        content={confirmationContent}
        pendingText={pendingText}
        isLoadingQuote ={isLoadingQuote}
        setIsLoadingQuote = {setIsLoadingQuote}
        //currencyToAdd={trade?.outputAmount.currency}
        //currencyToAdd = {null}
      />
    </Trace>
  )
}
