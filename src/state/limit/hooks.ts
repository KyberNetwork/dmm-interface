import { Currency } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import { CreateOrderParam } from 'components/swapv2/LimitOrder/type'
import { APP_PATHS } from 'constants/index'
import { DEFAULT_OUTPUT_TOKEN_BY_CHAIN, NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useCurrencyV2 } from 'hooks/Tokens'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { AppDispatch, AppState } from 'state/index'
import { Field } from 'state/swap/actions'
import { queryParametersToSwapState } from 'state/swap/hooks'

import { removeCurrentOrderUpdate, setCurrentOrderUpdate, setLimitCurrency } from './actions'
import { LimitState } from './reducer'

export function useLimitState(): LimitState {
  return useSelector((state: AppState) => state.limit)
}

const useDefaultsFromURLSearch = () => {
  const { chainId } = useActiveWeb3React()
  const parsedQs = useParsedQueryString()
  const { currencyIn, currencyOut } = useLimitState()
  const storedInputValue = currencyIn?.chainId === chainId ? currencyIn : undefined
  const storedOutputValue = currencyOut?.chainId === chainId ? currencyOut : undefined
  const { pathname } = useLocation()
  const parsed = queryParametersToSwapState(parsedQs, chainId, pathname.startsWith(APP_PATHS.LIMIT))

  const outputCurrencyAddress = chainId ? DEFAULT_OUTPUT_TOKEN_BY_CHAIN[chainId]?.address ?? '' : ''

  const parsedInputValue = parsed[Field.INPUT].currencyId // default inputCurrency is the native token
  const parsedOutputValue = parsed[Field.OUTPUT].currencyId || outputCurrencyAddress || ''

  // priority order
  // 1. address on url (inputCurrency, outputCurrency)
  // 2. previous currency (to not reset default pair when back to limit page)
  // 3. default pair
  const inputCurrencyId = parsedQs.inputCurrency ? parsedInputValue : storedInputValue || parsedInputValue
  let outputCurrencyId = parsedQs.outputCurrency ? parsedOutputValue : storedOutputValue || parsedOutputValue

  const native = chainId ? NativeCurrencies[chainId].symbol : ''
  if (native && outputCurrencyId === native && inputCurrencyId === native) {
    outputCurrencyId = outputCurrencyAddress
  }

  // if currency is object, no need to call
  const inputCurrency =
    useCurrencyV2(inputCurrencyId && typeof inputCurrencyId === 'object' ? '' : inputCurrencyId) ?? storedInputValue
  const outputCurrency =
    useCurrencyV2(outputCurrencyId && typeof outputCurrencyId === 'object' ? '' : outputCurrencyId) ?? storedOutputValue

  return { inputCurrency, outputCurrency }
}

export function useLimitActionHandlers() {
  const dispatch = useDispatch<AppDispatch>()
  const { currencyIn, currencyOut } = useLimitState()
  const { inputCurrency, outputCurrency } = useDefaultsFromURLSearch() // todo danh refator + swap ???, not use id

  const onSelectPair = useCallback(
    (currencyIn: Currency | undefined, currencyOut: Currency | undefined) => {
      dispatch(
        setLimitCurrency({
          currencyIn: currencyIn?.isNative ? currencyIn.wrapped : currencyIn,
          currencyOut,
        }),
      )
    },
    [dispatch],
  )

  useEffect(() => {
    if (
      (inputCurrency && !currencyIn?.equals(inputCurrency)) ||
      (outputCurrency && !currencyOut?.equals(outputCurrency))
    ) {
      onSelectPair(inputCurrency ?? undefined, outputCurrency ?? undefined)
    }
  }, [onSelectPair, inputCurrency, outputCurrency, currencyIn, currencyOut])

  const setCurrencyIn = useCallback(
    (currencyIn: Currency | undefined) => {
      onSelectPair(currencyIn, currencyOut)
    },
    [currencyOut, onSelectPair],
  )

  const setCurrencyOut = useCallback(
    (currencyOut: Currency | undefined) => {
      onSelectPair(currencyIn, currencyOut)
    },
    [currencyIn, onSelectPair],
  )

  const switchCurrency = useCallback(() => {
    onSelectPair(currencyOut, currencyIn)
  }, [onSelectPair, currencyOut, currencyIn])

  const setCurrentOrder = useCallback(
    (order: CreateOrderParam) => {
      dispatch(setCurrentOrderUpdate(order))
    },
    [dispatch],
  )

  const removeCurrentOrder = useCallback(
    (orderId: number) => {
      dispatch(removeCurrentOrderUpdate(orderId))
    },
    [dispatch],
  )

  return {
    switchCurrency,
    setCurrencyIn,
    setCurrencyOut,
    onSelectPair,
    setCurrentOrder,
    removeCurrentOrder,
  }
}
