import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { stringify } from 'querystring'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import { parseGetRouteResponse } from 'services/route/utils'
import styled from 'styled-components'

import AddressInputPanel from 'components/AddressInputPanel'
import { Clock } from 'components/Icons'
import { NetworkSelector } from 'components/NetworkSelector'
import { AutoRow } from 'components/Row'
import SlippageWarningNote from 'components/SlippageWarningNote'
import InputCurrencyPanel from 'components/SwapForm/InputCurrencyPanel'
import OutputCurrencyPanel from 'components/SwapForm/OutputCurrencyPanel'
import PriceImpactNote from 'components/SwapForm/PriceImpactNote'
import SlippageSettingGroup from 'components/SwapForm/SlippageSettingGroup'
import { SwapFormContextProvider } from 'components/SwapForm/SwapFormContext'
import useBuildRoute from 'components/SwapForm/hooks/useBuildRoute'
import useCheckStablePairSwap from 'components/SwapForm/hooks/useCheckStablePairSwap'
import useGetInputError from 'components/SwapForm/hooks/useGetInputError'
import useGetRoute from 'components/SwapForm/hooks/useGetRoute'
import useParsedAmount from 'components/SwapForm/hooks/useParsedAmount'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import TradePrice from 'components/swapv2/TradePrice'
import { Wrapper } from 'components/swapv2/styleds'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import { Field } from 'state/swap/actions'
import { useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { DetailedRouteSummary } from 'types/route'
import { currencyId } from 'utils/currencyId'

import MultichainKNCNote from './MultichainKNCNote'
import RefreshButton from './RefreshButton'
import ReverseTokenSelectionButton from './ReverseTokenSelectionButton'
import SwapActionButton from './SwapActionButton'
import TradeSummary from './TradeSummary'
import TradeTypeSelection from './TradeTypeSelection'

const PriceAlertButton = styled.div`
  background: ${({ theme }) => rgba(theme.subText, 0.2)};
  border-radius: 24px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  cursor: pointer;
  user-select: none;
  font-weight: 500;
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  align-items: center;
  height: fit-content;
`

export type SwapFormProps = {
  hidden: boolean

  currencyIn: Currency | undefined
  currencyOut: Currency | undefined

  balanceIn: CurrencyAmount<Currency> | undefined
  balanceOut: CurrencyAmount<Currency> | undefined

  routeSummary: DetailedRouteSummary | undefined
  setRouteSummary: React.Dispatch<React.SetStateAction<DetailedRouteSummary | undefined>>

  isDegenMode: boolean
  slippage: number
  transactionTimeout: number
  permit?: string

  onChangeCurrencyIn: (c: Currency) => void
  onChangeCurrencyOut: (c: Currency) => void
  goToSettingsView: () => void
  customChainId?: ChainId
  omniView?: boolean
}

const SwapForm: React.FC<SwapFormProps> = props => {
  const { pathname } = useLocation()
  const isPartnerSwap = pathname.startsWith(APP_PATHS.PARTNER_SWAP)
  const {
    hidden,
    currencyIn,
    currencyOut,
    balanceIn,
    balanceOut,
    setRouteSummary,
    isDegenMode,
    slippage,
    transactionTimeout,
    permit,
    onChangeCurrencyIn,
    onChangeCurrencyOut,
    customChainId,
    omniView,
  } = props

  const { chainId: walletChainId } = useActiveWeb3React()
  const chainId = customChainId || walletChainId
  const navigate = useNavigate()
  const [isProcessingSwap, setProcessingSwap] = useState(false)
  const { typedValue } = useSwapState()
  const [recipient, setRecipient] = useState<string | null>(null)
  const [isSaveGas, setSaveGas] = useState(false)
  const theme = useTheme()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  const { onUserInput: updateInputAmount } = useSwapActionHandlers()
  const onUserInput = useCallback(
    (value: string) => {
      updateInputAmount(Field.INPUT, value)
    },
    [updateInputAmount],
  )
  useEffect(() => {
    onUserInput('1')
  }, [onUserInput])

  const parsedAmount = useParsedAmount(currencyIn, typedValue)
  const {
    wrapType,
    inputError: wrapInputError,
    execute: onWrap,
  } = useWrapCallback(currencyIn, currencyOut, typedValue, false, customChainId)
  const isWrapOrUnwrap = wrapType !== WrapType.NOT_APPLICABLE

  const isStablePairSwap = useCheckStablePairSwap(currencyIn, currencyOut)

  const { fetcher: getRoute, result } = useGetRoute({
    currencyIn,
    currencyOut,
    isSaveGas,
    parsedAmount,
    isProcessingSwap,
    customChain: chainId,
  })

  const { data: getRouteRawResponse, isFetching: isGettingRoute, error: getRouteError } = result
  const getRouteResponse = useMemo(() => {
    if (!getRouteRawResponse?.data || getRouteError || !currencyIn || !currencyOut) {
      return undefined
    }

    return parseGetRouteResponse(getRouteRawResponse.data, currencyIn, currencyOut)
  }, [currencyIn, currencyOut, getRouteError, getRouteRawResponse])

  const routeSummary = getRouteResponse?.routeSummary

  const buildRoute = useBuildRoute({
    recipient: isDegenMode && recipient ? recipient : '',
    routeSummary: getRouteRawResponse?.data?.routeSummary || undefined,
    slippage,
    transactionTimeout,
    permit,
  })

  const swapInputError = useGetInputError({
    currencyIn,
    currencyOut,
    typedValue,
    recipient,
    balanceIn,
    parsedAmountFromTypedValue: parsedAmount,
  })

  useEffect(() => {
    setRouteSummary(routeSummary)
  }, [routeSummary, setRouteSummary])

  return (
    <SwapFormContextProvider
      slippage={slippage}
      routeSummary={routeSummary}
      typedValue={typedValue}
      isSaveGas={isSaveGas}
      recipient={recipient}
      isStablePairSwap={isStablePairSwap}
      isAdvancedMode={isDegenMode}
    >
      <Box sx={{ flexDirection: 'column', gap: '16px', display: hidden ? 'none' : 'flex' }}>
        <Wrapper id={TutorialIds.SWAP_FORM_CONTENT}>
          <Flex flexDirection="column" sx={{ gap: '0.75rem' }}>
            {omniView ? <NetworkSelector chainId={chainId} /> : null}
            <InputCurrencyPanel
              wrapType={wrapType}
              typedValue={typedValue}
              setTypedValue={onUserInput}
              currencyIn={currencyIn}
              currencyOut={currencyOut}
              balanceIn={balanceIn}
              onChangeCurrencyIn={onChangeCurrencyIn}
              customChainId={customChainId}
            />

            <AutoRow justify="space-between">
              <Flex alignItems="center" style={{ gap: '4px' }}>
                {!isWrapOrUnwrap && (
                  <>
                    <RefreshButton
                      shouldDisable={!parsedAmount || parsedAmount.equalTo(0) || isProcessingSwap}
                      callback={getRoute}
                      size={16}
                    />
                    <TradePrice price={routeSummary?.executionPrice} />
                  </>
                )}
              </Flex>

              <Flex sx={{ gap: '12px' }}>
                {!isPartnerSwap && (
                  <PriceAlertButton
                    onClick={() =>
                      navigate(
                        `${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.CREATE_ALERT}?${stringify({
                          amount: typedValue || undefined,
                          inputCurrency: currencyId(currencyIn, chainId),
                          outputCurrency: currencyId(currencyOut, chainId),
                        })}`,
                      )
                    }
                  >
                    <Clock size={14} color={theme.subText} />
                    {upToExtraSmall ? null : (
                      <Text color={theme.subText} style={{ whiteSpace: 'nowrap' }}>
                        <Trans>Price Alert</Trans>
                      </Text>
                    )}
                  </PriceAlertButton>
                )}
                <ReverseTokenSelectionButton
                  onClick={() => {
                    currencyIn && onChangeCurrencyOut(currencyIn)
                    routeSummary && onUserInput(routeSummary.parsedAmountOut.toExact())
                  }}
                />
              </Flex>
            </AutoRow>

            <OutputCurrencyPanel
              wrapType={wrapType}
              parsedAmountIn={parsedAmount}
              parsedAmountOut={routeSummary?.parsedAmountOut}
              currencyIn={currencyIn}
              currencyOut={currencyOut}
              amountOutUsd={routeSummary?.amountOutUsd}
              onChangeCurrencyOut={onChangeCurrencyOut}
              customChainId={customChainId}
            />

            {isDegenMode && !isWrapOrUnwrap && (
              <AddressInputPanel id="recipient" value={recipient} onChange={setRecipient} />
            )}
            <SlippageSettingGroup isWrapOrUnwrap={isWrapOrUnwrap} isStablePairSwap={isStablePairSwap} />
          </Flex>
        </Wrapper>
        <Flex flexDirection="column" style={{ gap: '1.25rem' }}>
          <TradeTypeSelection isSaveGas={isSaveGas} setSaveGas={setSaveGas} />

          {!isWrapOrUnwrap && <SlippageWarningNote rawSlippage={slippage} isStablePairSwap={isStablePairSwap} />}

          <PriceImpactNote priceImpact={routeSummary?.priceImpact} isDegenMode={isDegenMode} />
          <MultichainKNCNote currencyIn={currencyIn} currencyOut={currencyOut} />

          <SwapActionButton
            isGettingRoute={isGettingRoute}
            parsedAmountFromTypedValue={parsedAmount}
            balanceIn={balanceIn}
            balanceOut={balanceOut}
            isDegenMode={isDegenMode}
            typedValue={typedValue}
            currencyIn={currencyIn}
            currencyOut={currencyOut}
            wrapInputError={wrapInputError}
            wrapType={wrapType}
            routeSummary={routeSummary}
            isProcessingSwap={isProcessingSwap}
            setProcessingSwap={setProcessingSwap}
            onWrap={onWrap}
            buildRoute={buildRoute}
            swapInputError={swapInputError}
            customChainId={customChainId}
          />

          {!isWrapOrUnwrap && <TradeSummary routeSummary={routeSummary} slippage={slippage} />}
        </Flex>
      </Box>
    </SwapFormContextProvider>
  )
}

export default SwapForm
