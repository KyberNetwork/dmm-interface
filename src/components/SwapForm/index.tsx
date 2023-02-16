import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { useSelector } from 'react-redux'
import { Flex } from 'rebass'

import AddressInputPanel from 'components/AddressInputPanel'
import ArrowRotate from 'components/ArrowRotate'
import { AutoRow } from 'components/Row'
import TrendingSoonTokenBanner from 'components/TrendingSoonTokenBanner'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import TradeTypeSelection from 'components/swapv2/TradeTypeSelection'
import { PriceImpactHigh, Wrapper } from 'components/swapv2/styleds'
import { STABLE_COINS_ADDRESS } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import usePrevious from 'hooks/usePrevious'
import useSyncTokenSymbolToUrl from 'hooks/useSyncTokenSymbolToUrl'
import useTheme from 'hooks/useTheme'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { ClickableText } from 'pages/Pool/styleds'
import { AppState } from 'state'
import { useToggleTransactionSettingsMenu } from 'state/application/hooks'
import { Field } from 'state/swap/actions'
import { useInputCurrency, useOutputCurrency, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import useParsedAmountFromInputCurrency from 'state/swap/hooks/useParsedAmountFromInputCurrency'
import { useExpertModeManager, useUserAddedTokens, useUserSlippageTolerance } from 'state/user/hooks'
import { useCurrencyBalances } from 'state/wallet/hooks'

import ActionButton from './ActionButton'
import InputCurrencyPanel from './InputCurrencyPanel'
import OutputCurrencyPanel from './OutputCurrencyPanel'
import PriceImpactNote from './PriceImpactNote'
import RefreshButton from './RefreshButton'
import TradePrice from './TradePrice'
import TradeSummary from './TradeSummary'

const SwapForm: React.FC = () => {
  const { chainId, isSolana, isEVM } = useActiveWeb3React()
  const [rotate, setRotate] = useState(false)

  const isSelectCurrencyManually = useSelector((state: AppState) => state.swap.isSelectTokenManually)

  const theme = useTheme()

  // for expert mode
  const toggleSettings = useToggleTransactionSettingsMenu()
  const [isExpertMode] = useExpertModeManager()

  // get custom setting values for user
  const [allowedSlippage] = useUserSlippageTolerance()

  // swap state
  const { typedValue, recipient, [Field.INPUT]: INPUT, [Field.OUTPUT]: OUTPUT } = useSwapState()

  const { onSwitchTokensV2, onCurrencySelection, onResetSelectCurrency, onUserInput, onChangeRecipient } =
    useSwapActionHandlers()

  const parsedAmount = useParsedAmountFromInputCurrency()

  const currencyIn = useInputCurrency()
  const currencyOut = useOutputCurrency()
  const currencies = {
    [Field.INPUT]: currencyIn,
    [Field.OUTPUT]: currencyIn,
  }

  const [balanceIn] = useCurrencyBalances(
    useMemo(() => [currencyIn ?? undefined, currencyOut ?? undefined], [currencyIn, currencyOut]),
  )

  const { wrapType } = useWrapCallback(currencyIn, currencyOut, typedValue)

  const isSolanaUnwrap = isSolana && wrapType === WrapType.UNWRAP
  useEffect(() => {
    // reset value for unwrapping WSOL
    // because on Solana, unwrap WSOL is closing WSOL account,
    // which mean it will unwrap all WSOL at once and we can't unwrap partial amount of WSOL
    if (isSolanaUnwrap) onUserInput(Field.INPUT, balanceIn?.toExact() ?? '')
  }, [balanceIn, isSolanaUnwrap, onUserInput, parsedAmount])

  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE

  // reset recipient
  useEffect(() => {
    onChangeRecipient(null)
  }, [onChangeRecipient, isExpertMode])

  const handleRecipientChange = (value: string | null) => {
    if (recipient === null && value !== null) {
      mixpanelHandler(MIXPANEL_TYPE.ADD_RECIPIENT_CLICKED)
    }
    onChangeRecipient(value)
  }

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput],
  )

  const handleRotateClick = useCallback(() => {
    setRotate(prev => !prev)
    onSwitchTokensV2()
  }, [onSwitchTokensV2])

  // it's safe to put undefined here for now as we're not using any action that involves `trade`
  const { mixpanelHandler } = useMixpanel(undefined, currencies)

  const onSelectSuggestedPair = useCallback(
    (fromToken: Currency | undefined, toToken: Currency | undefined, amount?: string) => {
      if (fromToken) onCurrencySelection(Field.INPUT, fromToken)
      if (toToken) onCurrencySelection(Field.OUTPUT, toToken)
      if (amount) handleTypeInput(amount)
    },
    [handleTypeInput, onCurrencySelection],
  )

  const tokenImports: Token[] = useUserAddedTokens()
  const prevTokenImports = usePrevious(tokenImports)

  useEffect(() => {
    // when remove token imported
    if (!prevTokenImports) return
    const isRemoved = prevTokenImports?.length > tokenImports.length
    if (!isRemoved || prevTokenImports[0].chainId !== chainId) return

    const addressIn = currencyIn?.wrapped?.address
    const addressOut = currencyOut?.wrapped?.address
    // removed token => deselect input
    const tokenRemoved = prevTokenImports.filter(
      token => !tokenImports.find(token2 => token2.address === token.address),
    )

    tokenRemoved.forEach(({ address }: Token) => {
      if (address === addressIn || !currencyIn) {
        onResetSelectCurrency(Field.INPUT)
      }
      if (address === addressOut || !currencyOut) {
        onResetSelectCurrency(Field.OUTPUT)
      }
    })
  }, [tokenImports, chainId, prevTokenImports, currencyIn, currencyOut, onResetSelectCurrency])

  useSyncTokenSymbolToUrl(currencyIn, currencyOut, onSelectSuggestedPair, isSelectCurrencyManually)

  useEffect(() => {
    if (isExpertMode) {
      mixpanelHandler(MIXPANEL_TYPE.ADVANCED_MODE_ON)
    }
  }, [isExpertMode, mixpanelHandler])

  const [rawSlippage, setRawSlippage] = useUserSlippageTolerance()

  const isStableCoinSwap =
    INPUT?.currencyId &&
    OUTPUT?.currencyId &&
    chainId &&
    STABLE_COINS_ADDRESS[chainId].includes(INPUT?.currencyId) &&
    STABLE_COINS_ADDRESS[chainId].includes(OUTPUT?.currencyId)

  const rawSlippageRef = useRef(rawSlippage)
  rawSlippageRef.current = rawSlippage

  useEffect(() => {
    if (isStableCoinSwap && rawSlippageRef.current > 10) {
      setRawSlippage(10)
    }
    if (!isStableCoinSwap && rawSlippageRef.current === 10) {
      setRawSlippage(50)
    }
  }, [isStableCoinSwap, setRawSlippage])

  const isLargeSwap = useMemo((): boolean => {
    return false
    // Not used yet
    // if these line is 6 months old, feel free to delete it
    /*
      if (!isSolana) return false
      if (!trade) return false
      try {
        return trade.swaps.some(swapPath =>
          swapPath.some(swap => {
            // return swapAmountInUsd / swap.reserveUsd > 1%
            //  =  (swap.swapAmount / 10**decimal * tokenIn.price) / swap.reserveUsd > 1%
            //  = swap.swapAmount * tokenIn.price / (10**decimal * swap.reserveUsd) > 1%
            //  = 10**decimal * swap.reserveUsd / (swap.swapAmount * tokenIn.price) < 100
            const tokenIn = trade.tokens[swap.tokenIn]
            if (!tokenIn || !tokenIn.decimals) return false

            return JSBI.lessThan(
              JSBI.divide(
                JSBI.multiply(
                  JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(tokenIn.decimals + 20)),
                  JSBI.BigInt(swap.reserveUsd * 10 ** 20),
                ),
                JSBI.multiply(JSBI.BigInt(tokenIn.price * 10 ** 20), JSBI.BigInt(Number(swap.swapAmount) * 10 ** 20)),
              ),
              JSBI.BigInt(100),
            )
          }),
        )
      } catch (e) {
        return false
      }
    */
  }, [])

  return (
    <Flex sx={{ flexDirection: 'column', gap: '16px' }}>
      <Wrapper id={TutorialIds.SWAP_FORM_CONTENT}>
        <Flex flexDirection="column" sx={{ gap: '0.75rem' }}>
          <InputCurrencyPanel />

          <AutoRow justify="space-between">
            <Flex alignItems="center">
              {!showWrap && (
                <>
                  <RefreshButton />
                  <TradePrice />
                </>
              )}
            </Flex>

            <ArrowRotate rotate={rotate} onClick={handleRotateClick} />
          </AutoRow>

          <OutputCurrencyPanel />

          {isExpertMode && isEVM && !showWrap && (
            <AddressInputPanel id="recipient" value={recipient} onChange={handleRecipientChange} />
          )}

          {!showWrap && (
            <Flex alignItems="center" fontSize={12} color={theme.subText} onClick={toggleSettings} width="fit-content">
              <ClickableText color={theme.subText} fontWeight={500}>
                <Trans>Max Slippage:</Trans>&nbsp;
                {allowedSlippage / 100}%
              </ClickableText>
            </Flex>
          )}
        </Flex>

        <TradeTypeSelection />

        {chainId !== ChainId.ETHW && (
          <TrendingSoonTokenBanner currencyIn={currencyIn} currencyOut={currencyOut} style={{ marginTop: '24px' }} />
        )}

        <PriceImpactNote />

        {isLargeSwap && (
          <PriceImpactHigh>
            <AlertTriangle color={theme.warning} size={24} style={{ marginRight: '10px' }} />
            <Trans>Your transaction may not be successful. We recommend increasing the slippage for this trade</Trans>
          </PriceImpactHigh>
        )}

        <ActionButton />
      </Wrapper>
      <TradeSummary />
    </Flex>
  )
}

export default SwapForm
