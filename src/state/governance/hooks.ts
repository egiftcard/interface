import { TransactionResponse } from '@ethersproject/providers'
import { t } from '@lingui/macro'
import { abi as GOV_ABI } from '@uniswap/governance/build/GovernorAlpha.json'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { UNISWAP_GRANTS_PROPOSAL_DESCRIPTION } from 'constants/proposals/uniswap_grants_proposal_description'
import { Contract } from 'ethers'
import { defaultAbiCoder, formatUnits, Interface, isAddress } from 'ethers/lib/utils'
import {
  useGovernanceV0Contract,
  useGovernanceV1Contract,
  useLatestGovernanceContract,
  useUniContract,
} from 'hooks/useContract'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback, useMemo } from 'react'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { UNISWAP_GRANTS_START_BLOCK } from '../../constants/proposals'
import { UNI } from '../../constants/tokens'
import { useLogs } from '../logs/hooks'
import { useSingleCallResult, useSingleContractMultipleData } from '../multicall/hooks'
import { useTransactionAdder } from '../transactions/hooks'

interface ProposalDetail {
  target: string
  functionSig: string
  callData: string
}

export interface ProposalData {
  id: string
  title: string
  description: string
  proposer: string
  status: ProposalState
  forCount: number
  againstCount: number
  startBlock: number
  endBlock: number
  details: ProposalDetail[]
  governorIndex: number // index in the governance address array for which this proposal pertains
}

export interface CreateProposalData {
  targets: string[]
  values: string[]
  signatures: string[]
  calldatas: string[]
  description: string
}

export enum ProposalState {
  Undetermined = -1,
  Pending,
  Active,
  Canceled,
  Defeated,
  Succeeded,
  Queued,
  Expired,
  Executed,
}

const GovernanceInterface = new Interface(GOV_ABI)

// get count of all proposals made in the latest governor contract
function useLatestProposalCount(): number | undefined {
  const latestGovernanceContract = useLatestGovernanceContract()

  const { result } = useSingleCallResult(latestGovernanceContract, 'proposalCount')

  return result?.[0]?.toNumber()
}

/**
 * Need proposal events to get description data emitted from
 * new proposal event.
 */
function useFormattedProposalCreatedLogs(contract: Contract | null):
  | {
      description: string
      details: { target: string; functionSig: string; callData: string }[]
    }[]
  | undefined {
  // create filters for ProposalCreated events
  const filter = useMemo(() => contract?.filters?.ProposalCreated(), [contract])

  const useLogsResult = useLogs(filter)

  return useMemo(() => {
    return (
      useLogsResult?.logs?.map((log) => {
        const parsed = GovernanceInterface.parseLog(log).args
        return {
          description: parsed.description,
          details: parsed.targets.map((target: string, i: number) => {
            const signature = parsed.signatures[i]
            const [name, types] = signature.substr(0, signature.length - 1).split('(')
            const calldata = parsed.calldatas[i]
            const decoded = defaultAbiCoder.decode(types.split(','), calldata)
            return {
              target,
              functionSig: name,
              callData: decoded.join(', '),
            }
          }),
        }
      }) ?? []
    )
  }, [useLogsResult])
}

const V0_PROPOSAL_IDS = [[1], [2], [3], [4]]

// get data for all past and active proposals
export function useAllProposalData(): ProposalData[] {
  const proposalCount = useLatestProposalCount()

  const gov0 = useGovernanceV0Contract()
  const gov1 = useGovernanceV1Contract()

  const latestGovernorProposalIndexes = useMemo(() => {
    return typeof proposalCount === 'number' ? new Array(proposalCount).fill(0).map((_, i) => [i + 1]) : []
  }, [proposalCount])

  const proposalsV0 = useSingleContractMultipleData(gov0, 'proposals', V0_PROPOSAL_IDS)
  const proposalsV1 = useSingleContractMultipleData(gov1, 'proposals', latestGovernorProposalIndexes)

  // get all proposal states
  const proposalStatesV0 = useSingleContractMultipleData(gov0, 'state', V0_PROPOSAL_IDS)
  const proposalStatesV1 = useSingleContractMultipleData(gov1, 'state', latestGovernorProposalIndexes)

  // get metadata from past events
  const formattedLogsV0 = useFormattedProposalCreatedLogs(gov0)
  const formattedLogsV1 = useFormattedProposalCreatedLogs(gov1)

  // early return until events are fetched
  return useMemo(() => {
    if (!formattedLogsV0 || !formattedLogsV1) return []

    const proposalsCallData = proposalsV0.concat(proposalsV1)
    const proposalStatesCallData = proposalStatesV0.concat(proposalStatesV1)
    const formattedEvents = formattedLogsV0.concat(formattedLogsV1)

    if (
      !proposalsCallData?.every((p) => Boolean(p.result)) ||
      !proposalStatesCallData?.every((p) => Boolean(p.result)) ||
      !formattedEvents?.every((p) => Boolean(p))
    ) {
      return []
    }

    return proposalsCallData.map((proposal, i) => {
      let description = formattedEvents[i]?.description
      const startBlock = parseInt(proposal?.result?.startBlock?.toString())
      if (startBlock === UNISWAP_GRANTS_START_BLOCK) {
        description = UNISWAP_GRANTS_PROPOSAL_DESCRIPTION
      }
      return {
        id: proposal?.result?.id.toString(),
        title: description?.split(/# |\n/g)[1] ?? 'Untitled',
        description: description ?? 'No description.',
        proposer: proposal?.result?.proposer,
        status: proposalStatesCallData[i]?.result?.[0] ?? ProposalState.Undetermined,
        forCount: parseFloat(formatUnits(proposal?.result?.forVotes.toString(), 18)),
        againstCount: parseFloat(formatUnits(proposal?.result?.againstVotes.toString(), 18)),
        startBlock,
        endBlock: parseInt(proposal?.result?.endBlock?.toString()),
        details: formattedEvents[i]?.details,
        governorIndex: i >= V0_PROPOSAL_IDS.length ? 1 : 0,
      }
    })
  }, [formattedLogsV0, formattedLogsV1, proposalStatesV0, proposalStatesV1, proposalsV0, proposalsV1])
}

export function useProposalData(governorIndex: number, id: string): ProposalData | undefined {
  const allProposalData = useAllProposalData()
  return allProposalData?.filter((p) => p.governorIndex === governorIndex)?.find((p) => p.id === id)
}

// get the users delegatee if it exists
export function useUserDelegatee(): string {
  const { account } = useActiveWeb3React()
  const uniContract = useUniContract()
  const { result } = useSingleCallResult(uniContract, 'delegates', [account ?? undefined])
  return result?.[0] ?? undefined
}

// gets the users current votes
export function useUserVotes(): CurrencyAmount<Token> | undefined {
  const { account, chainId } = useActiveWeb3React()
  const uniContract = useUniContract()

  // check for available votes
  const uni = chainId ? UNI[chainId] : undefined
  const votes = useSingleCallResult(uniContract, 'getCurrentVotes', [account ?? undefined])?.result?.[0]
  return votes && uni ? CurrencyAmount.fromRawAmount(uni, votes) : undefined
}

// fetch available votes as of block (usually proposal start block)
export function useUserVotesAsOfBlock(block: number | undefined): CurrencyAmount<Token> | undefined {
  const { account, chainId } = useActiveWeb3React()
  const uniContract = useUniContract()

  // check for available votes
  const uni = chainId ? UNI[chainId] : undefined
  const votes = useSingleCallResult(uniContract, 'getPriorVotes', [account ?? undefined, block ?? undefined])
    ?.result?.[0]
  return votes && uni ? CurrencyAmount.fromRawAmount(uni, votes) : undefined
}

export function useDelegateCallback(): (delegatee: string | undefined) => undefined | Promise<string> {
  const { account, chainId, library } = useActiveWeb3React()
  const addTransaction = useTransactionAdder()

  const uniContract = useUniContract()

  return useCallback(
    (delegatee: string | undefined) => {
      if (!library || !chainId || !account || !isAddress(delegatee ?? '')) return undefined
      const args = [delegatee]
      if (!uniContract) throw new Error('No UNI Contract!')
      return uniContract.estimateGas.delegate(...args, {}).then((estimatedGasLimit) => {
        return uniContract
          .delegate(...args, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: t`Delegated votes`,
            })
            return response.hash
          })
      })
    },
    [account, addTransaction, chainId, library, uniContract]
  )
}

export function useVoteCallback(): {
  voteCallback: (proposalId: string | undefined, support: boolean) => undefined | Promise<string>
} {
  const { account } = useActiveWeb3React()

  const latestGovernanceContract = useLatestGovernanceContract()

  const addTransaction = useTransactionAdder()

  const voteCallback = useCallback(
    (proposalId: string | undefined, support: boolean) => {
      if (!account || !latestGovernanceContract || !proposalId) return
      const args = [proposalId, support]
      return latestGovernanceContract.estimateGas.castVote(...args, {}).then((estimatedGasLimit) => {
        return latestGovernanceContract
          .castVote(...args, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: `Voted ${support ? 'for ' : 'against'} proposal ${proposalId}`,
            })
            return response.hash
          })
      })
    },
    [account, addTransaction, latestGovernanceContract]
  )
  return { voteCallback }
}

export function useCreateProposalCallback(): (
  createProposalData: CreateProposalData | undefined
) => undefined | Promise<string> {
  const { account } = useActiveWeb3React()

  const latestGovernanceContract = useLatestGovernanceContract()
  const addTransaction = useTransactionAdder()

  return useCallback(
    (createProposalData: CreateProposalData | undefined) => {
      if (!account || !latestGovernanceContract || !createProposalData) return undefined

      const args = [
        createProposalData.targets,
        createProposalData.values,
        createProposalData.signatures,
        createProposalData.calldatas,
        createProposalData.description,
      ]

      return latestGovernanceContract.estimateGas.propose(...args).then((estimatedGasLimit) => {
        return latestGovernanceContract
          .propose(...args, { gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: t`Submitted new proposal`,
            })
            return response.hash
          })
      })
    },
    [account, addTransaction, latestGovernanceContract]
  )
}

export function useLatestProposalId(address: string | undefined): string | undefined {
  const govContractV1 = useGovernanceV1Contract()
  const res = useSingleCallResult(govContractV1, 'latestProposalIds', [address])

  return res?.result?.[0]?.toString()
}

export function useProposalThreshold(): CurrencyAmount<Token> | undefined {
  const { chainId } = useActiveWeb3React()

  const latestGovernanceContract = useLatestGovernanceContract()
  const res = useSingleCallResult(latestGovernanceContract, 'proposalThreshold')
  const uni = chainId ? UNI[chainId] : undefined

  if (res?.result?.[0] && uni) {
    return CurrencyAmount.fromRawAmount(uni, res.result[0])
  }

  return undefined
}
