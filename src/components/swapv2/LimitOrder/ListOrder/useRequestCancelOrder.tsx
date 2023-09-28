import { t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { useCallback, useState } from 'react'
import {
  useCancelOrdersMutation,
  useCreateCancelOrderSignatureMutation,
  useGetEncodeDataMutation,
  useInsertCancellingOrderMutation,
} from 'services/limitOrder'

import useCancellingOrders from 'components/swapv2/LimitOrder/useCancellingOrders'
import LIMIT_ORDER_ABI from 'constants/abis/limit_order.json'
import { TRANSACTION_STATE_DEFAULT } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { TransactionFlowState } from 'types/TransactionFlowState'
import { getContract } from 'utils/getContract'
import { sendEVMTransaction } from 'utils/sendTransaction'

import { formatAmountOrder, formatSignature, getErrorMessage, getPayloadTracking } from '../helpers'
import { CancelOrderType, LimitOrder } from '../type'

export const useGetEncodeLimitOrder = () => {
  const { account } = useActiveWeb3React()
  const [getEncodeData] = useGetEncodeDataMutation()
  const { library } = useWeb3React()
  return useCallback(
    async ({ orders, isCancelAll }: { orders: LimitOrder[]; isCancelAll: boolean | undefined }) => {
      if (!library) throw new Error()
      if (isCancelAll) {
        const contracts = [...new Set(orders.map(e => e.contractAddress))]
        const result = []
        for (const address of contracts) {
          const limitOrderContract = getContract(address, LIMIT_ORDER_ABI, library, account)
          const [{ encodedData }, nonce] = await Promise.all([
            getEncodeData({ orderIds: [], isCancelAll }).unwrap(),
            limitOrderContract?.nonce?.(account),
          ])
          result.push({ encodedData, nonce, contractAddress: address })
        }
        return result
      }
      // cancel single order
      const { encodedData } = await getEncodeData({
        orderIds: orders.map(e => e.id),
      }).unwrap()
      return [{ encodedData, contractAddress: orders[0]?.contractAddress, nonce: '' }]
    },
    [account, getEncodeData, library],
  )
}

const useRequestCancelOrder = ({
  orders,
  isCancelAll,
  totalOrder,
}: {
  orders: LimitOrder[]
  isCancelAll: boolean
  totalOrder: number
}) => {
  const { setCancellingOrders, cancellingOrdersIds } = useCancellingOrders()
  const { account, chainId, networkInfo } = useActiveWeb3React()
  const { library } = useWeb3React()
  const [flowState, setFlowState] = useState<TransactionFlowState>(TRANSACTION_STATE_DEFAULT)
  const [insertCancellingOrder] = useInsertCancellingOrderMutation()
  const [createCancelSignature] = useCreateCancelOrderSignatureMutation()
  const [cancelOrderRequest] = useCancelOrdersMutation()
  const addTransactionWithType = useTransactionAdder()

  const getEncodeData = useGetEncodeLimitOrder()

  const requestHardCancelOrder = async (order: LimitOrder | undefined) => {
    if (!library || !account) return Promise.reject('Wrong input')

    setFlowState({
      ...TRANSACTION_STATE_DEFAULT,
      pendingText: t`Canceling your orders`,
      showConfirm: true,
      attemptingTxn: true,
    })
    const newOrders = isCancelAll ? orders.map(e => e.id) : order?.id ? [order?.id] : []

    const sendTransaction = async (encodedData: string, contract: string, payload: any) => {
      const response = await sendEVMTransaction(account, library, contract, encodedData, BigNumber.from(0))
      if (response?.hash) {
        insertCancellingOrder({
          maker: account,
          chainId: chainId.toString(),
          txHash: response.hash,
          contractAddress: contract ?? '',
          ...payload,
        }).unwrap()
      }

      if (response) {
        const {
          makerAssetDecimals,
          takerAssetDecimals,
          takerAssetSymbol,
          takingAmount,
          makingAmount,
          takerAsset,
          makerAssetSymbol,
          makerAsset,
        } = order || ({} as LimitOrder)
        const amountIn = order ? formatAmountOrder(makingAmount, makerAssetDecimals) : ''
        const amountOut = order ? formatAmountOrder(takingAmount, takerAssetDecimals) : ''
        addTransactionWithType({
          ...response,
          type: TRANSACTION_TYPE.CANCEL_LIMIT_ORDER,
          extraInfo: order
            ? {
                tokenAddressIn: makerAsset,
                tokenAddressOut: takerAsset,
                tokenSymbolIn: makerAssetSymbol,
                tokenSymbolOut: takerAssetSymbol,
                tokenAmountIn: amountIn,
                tokenAmountOut: amountOut,
                arbitrary: getPayloadTracking(order, networkInfo.name),
              }
            : { arbitrary: { totalOrder } },
        })
      }
    }

    if (isCancelAll) {
      const data = await getEncodeData({ isCancelAll, orders })
      for (const item of data) {
        const { contractAddress, nonce, encodedData } = item
        await sendTransaction(encodedData, contractAddress, { nonce: nonce.toNumber() })
      }
    } else {
      const data = await getEncodeData({ isCancelAll, orders: order ? [order] : [] })
      const { contractAddress, encodedData } = data[0] || {}
      await sendTransaction(encodedData, contractAddress ?? '', { orderIds: newOrders })
    }
    setCancellingOrders(cancellingOrdersIds.concat(newOrders))
    return
  }

  const requestGasLessCancelOrder = async (orders: LimitOrder[]) => {
    if (!library || !account) return Promise.reject('Wrong input')
    setFlowState({
      ...TRANSACTION_STATE_DEFAULT,
      pendingText: t`Canceling your orders`,
      showConfirm: true,
      attemptingTxn: true,
    })

    const orderIds = orders.map(e => e.id)
    const cancelPayload = { chainId: chainId.toString(), maker: account, orderIds }
    const messagePayload = await createCancelSignature(cancelPayload).unwrap()
    const rawSignature = await library.send('eth_signTypedData_v4', [account, JSON.stringify(messagePayload)])
    const signature = formatSignature(rawSignature)
    const resp = await cancelOrderRequest({ ...cancelPayload, signature }).unwrap()
    const operatorSignatureExpiredAt = resp?.orders?.[0]?.operatorSignatureExpiredAt
    operatorSignatureExpiredAt && setCancellingOrders(cancellingOrdersIds.concat(orderIds))
    return resp
  }

  const handleError = (error: any) => {
    setFlowState(state => ({
      ...state,
      attemptingTxn: false,
      errorMessage: getErrorMessage(error),
    }))
    throw error // keep origin error
  }

  const onCancelOrder = async (orders: LimitOrder[], cancelType: CancelOrderType) => {
    try {
      const resp = await (cancelType === CancelOrderType.HARD_CANCEL
        ? requestHardCancelOrder(orders?.[0])
        : requestGasLessCancelOrder(orders))
      setFlowState(state => ({ ...state, attemptingTxn: false, showConfirm: false }))
      return resp
    } catch (error) {
      handleError(error)
    }
  }

  const onUpdateOrder = async (orders: LimitOrder[], cancelType: CancelOrderType) => {
    try {
      if (cancelType === CancelOrderType.HARD_CANCEL) return await requestHardCancelOrder(orders?.[0])
      return await requestGasLessCancelOrder(orders)
    } catch (error) {
      handleError(error)
    }
  }

  return { flowState, setFlowState, onCancelOrder, onUpdateOrder }
}
export default useRequestCancelOrder
