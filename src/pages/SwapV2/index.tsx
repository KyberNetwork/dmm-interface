import { CurrencyAmount, Token, Currency } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowDown } from 'react-feather'
import { Box, Flex, Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import { RouteComponentProps, useParams } from 'react-router-dom'
import { t, Trans } from '@lingui/macro'
import { BrowserView, isMobile, MobileView } from 'react-device-detect'

import AddressInputPanel from 'components/AddressInputPanel'
import { ButtonConfirmed, ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import Card, { GreyCard } from 'components/Card/index'
import Column, { AutoColumn } from 'components/Column/index'
import ConfirmSwapModal from 'components/swapv2/ConfirmSwapModal'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { AutoRow, RowBetween } from 'components/Row'
import AdvancedSwapDetailsDropdown from 'components/swapv2/AdvancedSwapDetailsDropdown'
import { ReactComponent as RoutingIcon } from 'assets/svg/routing-icon.svg'
import {
  ArrowWrapper,
  BottomGrouping,
  Container,
  Dots,
  KyberTag,
  LiveChartWrapper,
  PageWrapper,
  PriceImpactHigh,
  RoutesWrapper,
  TokenInfoWrapper,
  StyledFlex,
  SwapCallbackError,
  SwapFormActions,
  Tab,
  TabContainer,
  TabWrapper,
  Wrapper,
} from 'components/swapv2/styleds'
import TokenWarningModal from 'components/TokenWarningModal'
import ProgressSteps from 'components/ProgressSteps'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { INITIAL_ALLOWED_SLIPPAGE } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens, useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallbackFromTradeV2 } from 'hooks/useApproveCallback'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { useToggleTransactionSettingsMenu, useWalletModalToggle } from 'state/application/hooks'
import { Field } from 'state/swap/actions'
import { useDefaultsFromURLSearch, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { useDerivedSwapInfoV2 } from 'state/swap/useAggregator'
import {
  useExpertModeManager,
  useShowLiveChart,
  useShowTokenInfo,
  useShowTradeRoutes,
  useUserSlippageTolerance,
} from 'state/user/hooks'
import { LinkStyledButton, TYPE } from 'theme'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import AppBody from 'pages/AppBody'
import { ClickableText } from 'pages/Pool/styleds'
import Loader from 'components/Loader'
import { Aggregator } from 'utils/aggregator'
import { useSwapV2Callback } from 'hooks/useSwapV2Callback'
import Routing from 'components/swapv2/Routing'
import RefreshButton from 'components/swapv2/RefreshButton'
import TradeTypeSelection from 'components/swapv2/TradeTypeSelection'
import { formattedNum, isAddressString } from 'utils'
import TransactionSettings from 'components/TransactionSettings'
import { Swap as SwapIcon } from 'components/Icons'
import TradePrice from 'components/swapv2/TradePrice'
import InfoHelper from 'components/InfoHelper'
import LiveChart from 'components/LiveChart'
import { ShareButtonWithModal } from 'components/ShareModal'
import TokenInfo from 'components/swapv2/TokenInfo'
import SingleTokenInfo from 'components/swapv2/SingleTokenInfo'
import MobileLiveChart from 'components/swapv2/MobileLiveChart'
import MobileTradeRoutes from 'components/swapv2/MobileTradeRoutes'
import MobileTokenInfo from 'components/swapv2/MobileTokenInfo'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { currencyId } from 'utils/currencyId'
import Banner from 'components/Banner'
import TrendingSoonTokenBanner from 'components/TrendingSoonTokenBanner'
import TopTrendingSoonTokensInCurrentNetwork from 'components/TopTrendingSoonTokensInCurrentNetwork'
import { clientData } from 'constants/clientData'
import {
  MAP_TOKEN_HAS_MULTI_BY_NETWORK,
  NETWORK_LABEL,
  NETWORK_TO_CHAINID,
  WHITE_LIST_PATH_SWAP_SYMBOL,
} from 'constants/networks'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import { convertToSlug } from 'utils/string'
import { filterTokens, filterTokensWithExactKeyword } from 'components/SearchModal/filtering'
import { useRef } from 'react'
import usePrevious from 'hooks/usePrevious'

enum ACTIVE_TAB {
  SWAP,
  INFO,
}

export const AppBodyWrapped = styled(AppBody)`
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.04);
  z-index: 1;
  padding: 30px 24px;
  margin-top: 0;
  position: initial;
  @media only screen and (min-width: 768px) {
    width: 404px;
  }
  @media only screen and (min-width: 1100px) {
    position: sticky;
    top: 10px;
  }
`

const SwitchLocaleLinkWrapper = styled.div`
  margin-bottom: 30px;
`

const RoutingIconWrapper = styled(RoutingIcon)`
  height: 27px;
  width: 27px;
  margin-right: 10px;
`

export default function Swap({ history }: RouteComponentProps) {
  const [rotate, setRotate] = useState(false)
  const [showInverted, setShowInverted] = useState<boolean>(false)
  const isShowLiveChart = useShowLiveChart()
  const isShowTradeRoutes = useShowTradeRoutes()
  const isShowTokenInfo = useShowTokenInfo()

  const [isSelectCurencyMannual, setIsSelectCurencyMannual] = useState(false) // true khi select input/output bằng tay else select bằng url

  const [activeTab, setActiveTab] = useState<ACTIVE_TAB>(ACTIVE_TAB.SWAP)

  const loadedUrlParams = useDefaultsFromURLSearch()

  // token warning stuff
  const [loadedInputCurrency, loadedOutputCurrency] = [
    useCurrency(loadedUrlParams?.inputCurrencyId),
    useCurrency(loadedUrlParams?.outputCurrencyId),
  ]

  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)
  const urlLoadedTokens: Token[] = useMemo(
    () => [loadedInputCurrency, loadedOutputCurrency]?.filter((c): c is Token => c instanceof Token) ?? [],
    [loadedInputCurrency, loadedOutputCurrency],
  )
  const handleConfirmTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
  }, [])

  // dismiss warning if all imported tokens are in active lists
  const defaultTokens = useAllTokens()
  const importTokensNotInDefault =
    urlLoadedTokens &&
    urlLoadedTokens.filter((token: Token) => {
      return !Boolean(token.address in defaultTokens)
    })

  const { account, chainId } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // for expert mode
  const toggleSettings = useToggleTransactionSettingsMenu()
  const [isExpertMode] = useExpertModeManager()

  // get custom setting values for user
  const [allowedSlippage] = useUserSlippageTolerance()

  // swap state
  const { independentField, typedValue, recipient, feeConfig } = useSwapState()

  const {
    v2Trade,
    currencyBalances,
    parsedAmount,
    currencies,
    inputError: swapInputError,
    tradeComparer,
    onRefresh,
    loading: loadingAPI,
  } = useDerivedSwapInfoV2()

  const currencyIn = currencies[Field.INPUT]
  const currencyOut = currencies[Field.OUTPUT]

  const { wrapType, execute: onWrap, inputError: wrapInputError } = useWrapCallback(
    currencies[Field.INPUT],
    currencies[Field.OUTPUT],
    typedValue,
  )
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const trade = showWrap ? undefined : v2Trade

  const parsedAmounts = showWrap
    ? {
        [Field.INPUT]: parsedAmount,
        [Field.OUTPUT]: parsedAmount,
      }
    : {
        [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
        [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
      }

  const { onSwitchTokensV2, onCurrencySelection, onUserInput, onChangeRecipient } = useSwapActionHandlers()

  const isValid = !swapInputError
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput],
  )
  const handleTypeOutput = useCallback((): void => {
    // ...
  }, [])

  // reset if they close warning without tokens in params
  const handleDismissTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
  }, [])

  // modal and loading
  const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash }, setSwapState] = useState<{
    showConfirm: boolean
    tradeToConfirm: Aggregator | undefined
    attemptingTxn: boolean
    swapErrorMessage: string | undefined
    txHash: string | undefined
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
  })

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: showWrap
      ? parsedAmounts[independentField]?.toExact() ?? ''
      : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  const userHasSpecifiedInputOutput = Boolean(
    currencyIn && currencyOut && parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0)),
  )
  const noRoute = !trade?.swaps?.length

  // check whether the user has approved the router on the input token
  const [approval, approveCallback] = useApproveCallbackFromTradeV2(trade, allowedSlippage)

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  const handleRotateClick = useCallback(() => {
    setApprovalSubmitted(false) // reset 2 step UI for approvals
    setRotate(prev => !prev)
    onSwitchTokensV2()
  }, [onSwitchTokensV2])

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
    if (approval === ApprovalState.NOT_APPROVED) {
      setApprovalSubmitted(false)
    }
  }, [approval, approvalSubmitted])

  const maxAmountInput: CurrencyAmount<Currency> | undefined = maxAmountSpend(currencyBalances[Field.INPUT])

  // the callback to execute the swap
  const { callback: swapCallback, error: swapCallbackError } = useSwapV2Callback(
    trade,
    allowedSlippage,
    recipient,
    clientData,
  )

  const handleSwap = useCallback(() => {
    if (!swapCallback) {
      return
    }
    setSwapState({ attemptingTxn: true, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: undefined })
    swapCallback()
      .then(hash => {
        setSwapState({ attemptingTxn: false, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: hash })
      })
      .catch(error => {
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          showConfirm,
          swapErrorMessage: error.message,
          txHash: undefined,
        })
      })
  }, [tradeToConfirm, showConfirm, swapCallback])

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non expert mode
  const showApproveFlow =
    !swapInputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED))

  const handleConfirmDismiss = useCallback(() => {
    setSwapState({ showConfirm: false, tradeToConfirm, attemptingTxn, swapErrorMessage, txHash })
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.INPUT, '')
    }
  }, [attemptingTxn, onUserInput, swapErrorMessage, tradeToConfirm, txHash])

  const handleAcceptChanges = useCallback(() => {
    setSwapState({ tradeToConfirm: trade, swapErrorMessage, txHash, attemptingTxn, showConfirm })
  }, [attemptingTxn, showConfirm, swapErrorMessage, trade, txHash])

  const handleInputSelect = useCallback(
    inputCurrency => {
      setIsSelectCurencyMannual(true)
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency)
    },
    [onCurrencySelection],
  )

  const handleMaxInput = useCallback(() => {
    maxAmountInput && onUserInput(Field.INPUT, maxAmountInput.toExact())
  }, [maxAmountInput, onUserInput])

  const handleOutputSelect = useCallback(
    outputCurrency => {
      setIsSelectCurencyMannual(true)
      onCurrencySelection(Field.OUTPUT, outputCurrency)
    },
    [onCurrencySelection],
  )

  const isLoading =
    loadingAPI ||
    ((!currencyBalances[Field.INPUT] || !currencyBalances[Field.OUTPUT]) && userHasSpecifiedInputOutput && !v2Trade)

  const { mixpanelHandler } = useMixpanel(trade, currencies)
  const mixpanelSwapInit = () => {
    mixpanelHandler(MIXPANEL_TYPE.SWAP_INITIATED)
  }

  const params = useParams<{
    fromCurrency: string
    toCurrency: string
    network: string
  }>()
  const getUrlMatchParams = () => {
    const fromCurrency = (params.fromCurrency || '').toLowerCase()
    const toCurrency = (params.toCurrency || '').toLowerCase()
    const network: string = convertToSlug(params.network || '')
    return { fromCurrency, toCurrency, network }
  }

  const { changeNetwork } = useActiveNetwork()
  const refIsCheckNetwork = useRef<boolean>() // to prevent call function many time

  function findTokenPairFromUrl() {
    if (!refIsCheckNetwork.current || !Object.keys(defaultTokens).length) return
    let { fromCurrency, toCurrency } = getUrlMatchParams()
    const { network } = getUrlMatchParams()

    if (!toCurrency) {
      // net/xxx
      const fromToken = filterTokensWithExactKeyword(Object.values(defaultTokens), fromCurrency)[0]
      if (fromToken) onCurrencySelection(Field.INPUT, fromToken)
      else history.push('/swap')
      return
    }

    const isAddress1 = isAddressString(fromCurrency)
    const isAddress2 = isAddressString(toCurrency)

    if (!isAddress1 && !isAddress2 && !WHITE_LIST_PATH_SWAP_SYMBOL.includes(`${fromCurrency}-to-${toCurrency}`)) {
      // sym-to-sym not in white list
      history.push('/swap')
      return
    }

    // net/add-to-add
    if (isAddress1 && isAddress2) {
      const fromToken = filterTokensWithExactKeyword(Object.values(defaultTokens), fromCurrency)[0]
      const toToken = filterTokensWithExactKeyword(Object.values(defaultTokens), toCurrency)[0]
      if (fromToken && toToken) history.push(`/swap/${network}/${fromToken.symbol}-to-${toToken?.symbol}`)
      else history.push('/swap')
      return
    }

    // sym-to-sym
    // hard code: ex: usdt => usdt_e, ...
    const mapData = MAP_TOKEN_HAS_MULTI_BY_NETWORK[network as keyof typeof MAP_TOKEN_HAS_MULTI_BY_NETWORK]
    if (mapData) {
      type KeyType = keyof typeof mapData
      const newValue1 = mapData[fromCurrency as KeyType]
      const newValue2 = mapData[toCurrency as KeyType]
      if (newValue1) fromCurrency = newValue1
      if (newValue2) toCurrency = newValue2
    }
    const fromToken = filterTokensWithExactKeyword(Object.values(defaultTokens), fromCurrency)[0]
    const toToken = filterTokensWithExactKeyword(Object.values(defaultTokens), toCurrency)[0]

    if (!toToken || !fromToken) {
      history.push('/swap')
      return
    }
    onCurrencySelection(Field.INPUT, fromToken)
    onCurrencySelection(Field.OUTPUT, toToken)
  }

  const checkAutoSelectTokenFromUrl = () => {
    // check case:  `/swap/net/x-to-y` or `/swap/net/x` is valid
    const { fromCurrency, network } = getUrlMatchParams()
    if (!fromCurrency || !network) return

    const findChainId = +NETWORK_TO_CHAINID[network] // check network first and then find token pair at findTokenPairFromUrl()
    if (findChainId !== chainId) {
      changeNetwork(findChainId)
        .then(() => {
          refIsCheckNetwork.current = true
        })
        .catch(() => {
          history.push('/swap')
        })
    } else {
      refIsCheckNetwork.current = true
    }
  }

  const syncUrl = () => {
    const addressIn = currencyIn?.wrapped?.address,
      addressOut = currencyOut?.wrapped?.address
    if (addressIn && addressOut && chainId) {
      history.push(`/swap/${convertToSlug(NETWORK_LABEL[chainId] || '')}/${addressIn}-to-${addressOut}`)
    }
  }

  useEffect(() => {
    findTokenPairFromUrl()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultTokens])

  useEffect(() => {
    checkAutoSelectTokenFromUrl()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isSelectCurencyMannual) syncUrl() // run only when we select mannual
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencyIn, currencyOut])

  useEffect(() => {
    if (isExpertMode) {
      mixpanelHandler(MIXPANEL_TYPE.ADVANCED_MODE_ON)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpertMode])

  useEffect(() => {
    if (allowedSlippage !== 50) {
      mixpanelHandler(MIXPANEL_TYPE.SLIPPAGE_CHANGED, { new_slippage: allowedSlippage / 100 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedSlippage])

  const shareUrl =
    currencies && currencyIn && currencyOut
      ? window.location.origin +
        `/swap?inputCurrency=${currencyId(currencyIn as Currency, chainId)}&outputCurrency=${currencyId(
          currencyOut as Currency,
          chainId,
        )}&networkId=${chainId}`
      : undefined

  const renderTokenInfo = Boolean(isShowTokenInfo && (currencyIn || currencyOut))

  return (
    <>
      <TokenWarningModal
        isOpen={importTokensNotInDefault.length > 0 && !dismissTokenWarning}
        tokens={importTokensNotInDefault}
        onConfirm={handleConfirmTokenWarning}
        onDismiss={handleDismissTokenWarning}
      />
      <PageWrapper>
        <Banner />
        <TopTrendingSoonTokensInCurrentNetwork />
        <Container>
          <StyledFlex justifyContent={'center'} alignItems="flex-start" flexWrap={'wrap'}>
            <AppBodyWrapped>
              <RowBetween mb={'16px'}>
                <TabContainer>
                  <TabWrapper>
                    <Tab
                      onClick={() => setActiveTab(ACTIVE_TAB.SWAP)}
                      isActive={isMobile ? false : activeTab === ACTIVE_TAB.SWAP}
                    >
                      <TYPE.black fontSize={18} fontWeight={500}>{t`Swap`}</TYPE.black>
                    </Tab>
                    <BrowserView>
                      <Tab
                        onClick={() => {
                          mixpanelHandler(MIXPANEL_TYPE.TOKEN_INFO_CHECKED)
                          setActiveTab(ACTIVE_TAB.INFO)
                        }}
                        isActive={activeTab === ACTIVE_TAB.INFO}
                      >
                        <TYPE.black fontSize={18} fontWeight={500}>{t`Info`}</TYPE.black>
                      </Tab>
                    </BrowserView>
                  </TabWrapper>
                </TabContainer>

                <SwapFormActions>
                  <MobileTokenInfo currencies={currencies} />
                  <RefreshButton isConfirming={showConfirm} trade={trade} onRefresh={onRefresh} />
                  <TransactionSettings isShowDisplaySettings />
                  <ShareButtonWithModal
                    url={shareUrl}
                    onShared={() => {
                      mixpanelHandler(MIXPANEL_TYPE.TOKEN_SWAP_LINK_SHARED)
                    }}
                  />
                </SwapFormActions>
              </RowBetween>

              {activeTab === ACTIVE_TAB.SWAP ? (
                <>
                  <Wrapper id="swap-page">
                    <ConfirmSwapModal
                      isOpen={showConfirm}
                      trade={trade}
                      originalTrade={tradeToConfirm}
                      onAcceptChanges={handleAcceptChanges}
                      attemptingTxn={attemptingTxn}
                      txHash={txHash}
                      recipient={recipient}
                      allowedSlippage={allowedSlippage}
                      onConfirm={handleSwap}
                      swapErrorMessage={swapErrorMessage}
                      onDismiss={handleConfirmDismiss}
                      tokenAddToMetaMask={currencyOut}
                    />

                    <Flex flexDirection="column" sx={{ gap: '0.675rem' }}>
                      <CurrencyInputPanel
                        label={independentField === Field.OUTPUT && !showWrap && trade ? t`From (estimated)` : t`From`}
                        value={formattedAmounts[Field.INPUT]}
                        positionMax="top"
                        showMaxButton
                        currency={currencyIn}
                        onUserInput={handleTypeInput}
                        onMax={handleMaxInput}
                        onCurrencySelect={handleInputSelect}
                        otherCurrency={currencyOut}
                        id="swap-currency-input"
                        showCommonBases={true}
                        estimatedUsd={
                          trade?.amountInUsd ? `${formattedNum(trade.amountInUsd.toString(), true)}` : undefined
                        }
                      />
                      <AutoColumn justify="space-between">
                        <AutoRow justify={isExpertMode ? 'space-between' : 'center'} style={{ padding: '0 1rem' }}>
                          <ArrowWrapper
                            clickable
                            rotated={rotate}
                            onClick={() => {
                              setApprovalSubmitted(false) // reset 2 step UI for approvals
                              setRotate(prev => !prev)
                              onSwitchTokensV2()
                            }}
                          >
                            <SwapIcon size={22} />
                          </ArrowWrapper>
                          {recipient === null && !showWrap && isExpertMode ? (
                            <LinkStyledButton id="add-recipient-button" onClick={() => onChangeRecipient('')}>
                              <Trans>+ Add Recipient (optional)</Trans>
                            </LinkStyledButton>
                          ) : null}
                        </AutoRow>
                      </AutoColumn>
                      <Box sx={{ position: 'relative' }}>
                        {tradeComparer?.tradeSaved?.usd && (
                          <KyberTag>
                            <Trans>You save</Trans>{' '}
                            {formattedNum(tradeComparer.tradeSaved.usd, true) +
                              ` (${tradeComparer?.tradeSaved?.percent &&
                                (tradeComparer.tradeSaved.percent < 0.01
                                  ? '<0.01'
                                  : tradeComparer.tradeSaved.percent.toFixed(2))}%)`}
                            <InfoHelper
                              text={
                                <Text>
                                  <Trans>
                                    The amount you save compared to{' '}
                                    <Text as="span" color={theme.warning}>
                                      {tradeComparer.comparedDex.name}
                                    </Text>
                                    .
                                  </Trans>{' '}
                                  <Trans>
                                    <Text color={theme.primary} fontWeight={500} as="span">
                                      KyberSwap
                                    </Text>{' '}
                                    gets you the best token rates
                                  </Trans>
                                </Text>
                              }
                              size={14}
                              color={theme.primary}
                            />
                          </KyberTag>
                        )}

                        <CurrencyInputPanel
                          disabledInput
                          value={formattedAmounts[Field.OUTPUT]}
                          onUserInput={handleTypeOutput}
                          label={independentField === Field.INPUT && !showWrap && trade ? t`To (estimated)` : t`To`}
                          showMaxButton={false}
                          currency={currencyOut}
                          onCurrencySelect={handleOutputSelect}
                          otherCurrency={currencyIn}
                          id="swap-currency-output"
                          showCommonBases={true}
                          estimatedUsd={
                            trade?.amountOutUsd ? `${formattedNum(trade.amountOutUsd.toString(), true)}` : undefined
                          }
                        />
                      </Box>

                      {recipient !== null && !showWrap ? (
                        <>
                          <AutoRow justify="space-between" style={{ padding: '0 1rem' }}>
                            <ArrowWrapper clickable={false}>
                              <ArrowDown size="16" color={theme.text} />
                            </ArrowWrapper>
                            <LinkStyledButton id="remove-recipient-button" onClick={() => onChangeRecipient(null)}>
                              <Trans>- Remove Recipient</Trans>
                            </LinkStyledButton>
                          </AutoRow>
                          <AddressInputPanel id="recipient" value={recipient} onChange={onChangeRecipient} />
                        </>
                      ) : null}

                      {showWrap ? null : (
                        <Card padding={'0 .75rem 0 .25rem'} borderRadius={'20px'}>
                          <AutoColumn gap="4px">
                            <TradePrice
                              price={trade?.executionPrice}
                              showInverted={showInverted}
                              setShowInverted={setShowInverted}
                            />

                            {allowedSlippage !== INITIAL_ALLOWED_SLIPPAGE && (
                              <Flex
                                alignItems="center"
                                fontSize={12}
                                color={theme.subText}
                                onClick={toggleSettings}
                                width="fit-content"
                              >
                                <ClickableText color={theme.subText} fontWeight={500}>
                                  <Trans>Max Slippage:</Trans>&nbsp;
                                  {allowedSlippage / 100}%
                                </ClickableText>
                              </Flex>
                            )}
                          </AutoColumn>
                        </Card>
                      )}
                    </Flex>

                    <TradeTypeSelection />

                    <TrendingSoonTokenBanner currencies={currencies} style={{ marginTop: '24px' }} />

                    {trade?.priceImpact === -1 ? (
                      <PriceImpactHigh>
                        <AlertTriangle color={theme.warning} size={16} style={{ marginRight: '10px' }} />
                        <Trans>Unable to calculate Price Impact</Trans>
                        <InfoHelper text="Turn on Advanced Mode to trade" color={theme.text} />
                      </PriceImpactHigh>
                    ) : (
                      trade?.priceImpact &&
                      trade.priceImpact > 5 && (
                        <PriceImpactHigh veryHigh={trade?.priceImpact > 15}>
                          <AlertTriangle
                            color={trade?.priceImpact > 15 ? theme.red : theme.warning}
                            size={16}
                            style={{ marginRight: '10px' }}
                          />
                          {trade?.priceImpact > 15 ? (
                            <>
                              <Trans>Price Impact is Very High</Trans>
                              <InfoHelper text="Turn on Advanced Mode for high slippage trades" color={theme.text} />
                            </>
                          ) : (
                            <Trans>Price Impact is High</Trans>
                          )}
                        </PriceImpactHigh>
                      )
                    )}

                    <BottomGrouping>
                      {!account ? (
                        <ButtonLight onClick={toggleWalletModal}>
                          <Trans>Connect Wallet</Trans>
                        </ButtonLight>
                      ) : isLoading ? (
                        <GreyCard style={{ textAlign: 'center', borderRadius: '5.5px', padding: '18px' }}>
                          <TYPE.main>
                            <Dots>
                              <Trans>Calculating best route</Trans>
                            </Dots>
                          </TYPE.main>
                        </GreyCard>
                      ) : showWrap ? (
                        <ButtonPrimary disabled={Boolean(wrapInputError)} onClick={onWrap}>
                          {wrapInputError ??
                            (wrapType === WrapType.WRAP ? 'Wrap' : wrapType === WrapType.UNWRAP ? 'Unwrap' : null)}
                        </ButtonPrimary>
                      ) : noRoute && userHasSpecifiedInputOutput ? (
                        <GreyCard style={{ textAlign: 'center', borderRadius: '5.5px', padding: '18px' }}>
                          <TYPE.main>
                            <Trans>Insufficient liquidity for this trade.</Trans>
                          </TYPE.main>
                        </GreyCard>
                      ) : showApproveFlow ? (
                        <RowBetween>
                          <ButtonConfirmed
                            onClick={approveCallback}
                            disabled={approval !== ApprovalState.NOT_APPROVED || approvalSubmitted}
                            width="48%"
                            altDisabledStyle={approval === ApprovalState.PENDING} // show solid button while waiting
                            confirmed={approval === ApprovalState.APPROVED}
                          >
                            {approval === ApprovalState.PENDING ? (
                              <AutoRow gap="6px" justify="center">
                                <Trans>Approving</Trans> <Loader stroke="white" />
                              </AutoRow>
                            ) : approvalSubmitted && approval === ApprovalState.APPROVED ? (
                              t`Approved`
                            ) : (
                              t`Approve ${currencyIn?.symbol}`
                            )}
                          </ButtonConfirmed>
                          <ButtonError
                            onClick={() => {
                              mixpanelSwapInit()
                              if (isExpertMode) {
                                handleSwap()
                              } else {
                                setSwapState({
                                  tradeToConfirm: trade,
                                  attemptingTxn: false,
                                  swapErrorMessage: undefined,
                                  showConfirm: true,
                                  txHash: undefined,
                                })
                              }
                            }}
                            width="48%"
                            id="swap-button"
                            disabled={!isValid || approval !== ApprovalState.APPROVED}
                          >
                            <Text fontSize={16} fontWeight={500}>
                              {trade && trade.priceImpact > 5 ? t`Swap Anyway` : t`Swap`}
                            </Text>
                          </ButtonError>
                        </RowBetween>
                      ) : (
                        <ButtonError
                          onClick={() => {
                            mixpanelSwapInit()
                            if (isExpertMode) {
                              handleSwap()
                            } else {
                              setSwapState({
                                tradeToConfirm: trade,
                                attemptingTxn: false,
                                swapErrorMessage: undefined,
                                showConfirm: true,
                                txHash: undefined,
                              })
                            }
                          }}
                          id="swap-button"
                          disabled={
                            !isValid ||
                            !!swapCallbackError ||
                            approval !== ApprovalState.APPROVED ||
                            (!isExpertMode && trade && (trade.priceImpact > 15 || trade.priceImpact === -1))
                          }
                          style={{
                            border: 'none',
                            ...(!(
                              !isValid ||
                              !!swapCallbackError ||
                              approval !== ApprovalState.APPROVED ||
                              (!isExpertMode && trade && (trade.priceImpact > 15 || trade.priceImpact === -1))
                            ) &&
                            trade &&
                            (trade.priceImpact > 5 || trade.priceImpact === -1)
                              ? { background: theme.red, color: theme.white }
                              : {}),
                          }}
                        >
                          <Text fontWeight={500}>
                            {swapInputError
                              ? swapInputError
                              : approval !== ApprovalState.APPROVED
                              ? t`Checking allowance...`
                              : trade && (trade.priceImpact > 5 || trade.priceImpact === -1)
                              ? t`Swap Anyway`
                              : t`Swap`}
                          </Text>
                        </ButtonError>
                      )}
                      {showApproveFlow && (
                        <Column style={{ marginTop: '1rem' }}>
                          <ProgressSteps steps={[approval === ApprovalState.APPROVED]} />
                        </Column>
                      )}
                      {isExpertMode && swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
                    </BottomGrouping>
                  </Wrapper>
                  <AdvancedSwapDetailsDropdown trade={trade} feeConfig={feeConfig} />
                </>
              ) : (
                <TokenInfo currencies={currencies} />
              )}
            </AppBodyWrapped>
            <Flex flexDirection={'column'}>
              <BrowserView>
                {isShowLiveChart && (
                  <LiveChartWrapper borderBottom={isShowTradeRoutes || renderTokenInfo}>
                    <LiveChart onRotateClick={handleRotateClick} currencies={currencies} />
                  </LiveChartWrapper>
                )}
                {isShowTradeRoutes && (
                  <RoutesWrapper isOpenChart={isShowLiveChart} borderBottom={renderTokenInfo}>
                    <Flex flexDirection="column" width="100%">
                      <Flex alignItems={'center'}>
                        <RoutingIconWrapper />
                        <Text fontSize={18} fontWeight={500} color={theme.subText}>
                          <Trans>Your trade route</Trans>
                        </Text>
                      </Flex>
                      <Routing
                        trade={trade}
                        currencies={currencies}
                        formattedAmounts={formattedAmounts}
                        maxHeight={!isShowLiveChart ? '700px' : '332px'}
                        backgroundColor={theme.buttonBlack}
                      />
                    </Flex>
                  </RoutesWrapper>
                )}
              </BrowserView>
              {renderTokenInfo ? (
                <TokenInfoWrapper>
                  <SingleTokenInfo currency={currencyIn} borderBottom />
                  <SingleTokenInfo currency={currencyOut} />
                </TokenInfoWrapper>
              ) : null}
              <SwitchLocaleLinkWrapper>
                <SwitchLocaleLink />
              </SwitchLocaleLinkWrapper>
            </Flex>
          </StyledFlex>
        </Container>
      </PageWrapper>
      <MobileLiveChart handleRotateClick={handleRotateClick} currencies={currencies} />
      <MobileTradeRoutes trade={trade} formattedAmounts={formattedAmounts} currencies={currencies} />
    </>
  )
}
