import { createReducer } from '@reduxjs/toolkit'
import {
  addTransaction,
  checkedTransaction,
  clearAllTransactions,
  finalizeTransaction,
  SerializableTransactionReceipt,
  checkedSubgraph,
} from './actions'

const now = () => new Date().getTime()

export interface TransactionDetails {
  hash: string
  approval?: { tokenAddress: string; spender: string }
  type?: string
  summary?: string
  claim_rewards?: { recipient: string }
  receipt?: SerializableTransactionReceipt
  lastCheckedBlockNumber?: number
  addedTime: number
  confirmedTime?: number
  from: string
  arbitrary: any // To store anything arbitrary, so it has any type
  needCheckSubgraph?: boolean
}

export interface TransactionState {
  [chainId: number]: {
    [txHash: string]: TransactionDetails
  }
}

export const initialState: TransactionState = {}

export default createReducer(initialState, builder =>
  builder
    .addCase(
      addTransaction,
      (transactions, { payload: { chainId, from, hash, approval, type, summary, claim_rewards, arbitrary } }) => {
        if (transactions[chainId]?.[hash]) {
          throw Error('Attempted to add existing transaction.')
        }
        const txs = transactions[chainId] ?? {}
        txs[hash] = { hash, approval, type, summary, claim_rewards: claim_rewards, arbitrary, from, addedTime: now() }
        transactions[chainId] = txs
      },
    )
    .addCase(clearAllTransactions, (transactions, { payload: { chainId } }) => {
      if (!transactions[chainId]) return
      transactions[chainId] = {}
    })
    .addCase(checkedTransaction, (transactions, { payload: { chainId, hash, blockNumber } }) => {
      const tx = transactions[chainId]?.[hash]
      if (!tx) {
        return
      }
      if (!tx.lastCheckedBlockNumber) {
        tx.lastCheckedBlockNumber = blockNumber
      } else {
        tx.lastCheckedBlockNumber = Math.max(blockNumber, tx.lastCheckedBlockNumber)
      }
    })
    .addCase(finalizeTransaction, (transactions, { payload: { hash, chainId, receipt, needCheckSubgraph } }) => {
      const tx = transactions[chainId]?.[hash]
      if (!tx) {
        return
      }
      tx.receipt = receipt
      tx.confirmedTime = now()
      tx.needCheckSubgraph = needCheckSubgraph
    })
    .addCase(checkedSubgraph, (transactions, { payload: { chainId, hash } }) => {
      const tx = transactions[chainId]?.[hash]
      if (!tx) {
        return
      }
      tx.needCheckSubgraph = false
    }),
)
