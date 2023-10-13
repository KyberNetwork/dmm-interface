import { FeeAmount, Pool, Position } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { rgba } from 'polished'
import { ReactElement, useMemo, useState } from 'react'
import { Zap } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonLight, ButtonOutlined, ButtonPrimary } from 'components/Button'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import Dots from 'components/Dots'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import LocalLoader from 'components/LocalLoader'
import Modal from 'components/Modal'
import PriceImpactNote from 'components/SwapForm/PriceImpactNote'
import SlippageSettingGroup from 'components/SwapForm/SlippageSettingGroup'
import useParsedAmount from 'components/SwapForm/hooks/useParsedAmount'
import { MouseoverTooltip } from 'components/Tooltip'
import {
  ConfirmationPendingContent,
  TransactionErrorContent,
  TransactionSubmittedContent,
} from 'components/TransactionConfirmationModal'
import { abi } from 'constants/abis/v2/ProAmmPoolState.json'
import { APP_PATHS } from 'constants/index'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'
import { useToken } from 'hooks/Tokens'
import { useZapInAction, useZapInPoolResult } from 'hooks/elasticZap'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useContract, useProAmmTickReader } from 'hooks/useContract'
import useDebounce from 'hooks/useDebounce'
import { useProAmmPositionsFromTokenId } from 'hooks/useProAmmPositions'
import useTheme from 'hooks/useTheme'
import { RANGE_LIST } from 'pages/AddLiquidityV2/constants'
import { useWalletModalToggle } from 'state/application/hooks'
import { RANGE } from 'state/mint/proamm/type'
import { NEVER_RELOAD, useSingleCallResult, useSingleContractMultipleData } from 'state/multicall/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { StyledInternalLink } from 'theme'
import { formattedNum } from 'utils'
import { getTokenSymbolWithHardcode } from 'utils/tokenInfo'
import { unwrappedToken } from 'utils/wrappedCurrency'

import RangeSelector, { useTicksFromRange } from './RangeSelector'
import ZapDetail, { useZapDetail } from './ZapDetail'

const QuickZapButtonWrapper = styled(ButtonOutlined)<{ size: 'small' | 'medium' }>`
  padding: 0;
  width: ${({ size }) => (size === 'small' ? '28px' : '36px')};
  max-width: ${({ size }) => (size === 'small' ? '28px' : '36px')};
  height: ${({ size }) => (size === 'small' ? '28px' : '36px')};
  background: ${({ theme }) => rgba(theme.subText, 0.2)};
  color: ${({ theme }) => theme.subText};

  border: 1px solid ${({ theme }) => rgba(theme.subText, 0.2)};

  &:active {
    box-shadow: none;
  }

  &:focus {
    box-shadow: none;
  }
`

const Content = styled.div`
  padding: 1rem;
  width: 100%;
`

export const QuickZapButton = ({ onClick, size = 'medium' }: { onClick: () => void; size?: 'small' | 'medium' }) => {
  return (
    <MouseoverTooltip text={<Trans>Quickly zap and add liquidity using only one token</Trans>}>
      <QuickZapButtonWrapper onClick={onClick} size={size}>
        <Zap size={size === 'small' ? 16 : 20} />
      </QuickZapButtonWrapper>
    </MouseoverTooltip>
  )
}

type Props = {
  poolAddress: string
  tokenId?: string | number | BigNumber
  isOpen: boolean
  onDismiss: () => void
}

export default function QuickZap(props: Props) {
  if (!props.isOpen) return null

  return <QuickZapModal {...props} />
}

function QuickZapModal({ isOpen, onDismiss, poolAddress, tokenId }: Props) {
  const { chainId, networkInfo, account } = useActiveWeb3React()
  const zapInContractAddress = (networkInfo as EVMNetworkInfo).elastic.zap?.router
  const theme = useTheme()
  const [selectedRange, setSelectedRange] = useState<RANGE>(RANGE_LIST[1])

  const toggleWalletModal = useWalletModalToggle()
  const poolContract = useContract(poolAddress, abi)

  const { loading: loadingPos, position: positionDetail } = useProAmmPositionsFromTokenId(
    tokenId ? BigNumber.from(tokenId) : undefined,
  )

  const { loading: loadingPoolState, result: poolStateRes } = useSingleCallResult(poolContract, 'getPoolState')
  const { loading: loadingToken0, result: token0Res } = useSingleCallResult(
    poolContract,
    'token0',
    undefined,
    NEVER_RELOAD,
  )
  const { loading: loadingToken1, result: token1Res } = useSingleCallResult(
    poolContract,
    'token1',
    undefined,
    NEVER_RELOAD,
  )
  const { loading: loadingFee, result: feeRes } = useSingleCallResult(
    poolContract,
    'swapFeeUnits',
    undefined,
    NEVER_RELOAD,
  )

  const { loading: loadingLiqState, result: liqStateRes } = useSingleCallResult(poolContract, 'getLiquidityState')

  const token0 = useToken(token0Res?.[0])
  const token1 = useToken(token1Res?.[0])

  const currency0 = token0 ? unwrappedToken(token0.wrapped) : undefined
  const currency1 = token1 ? unwrappedToken(token1.wrapped) : undefined

  const pool = useMemo(() => {
    const fee = feeRes?.[0]
    if (!liqStateRes || !poolStateRes || !token0 || !token1 || !fee) return null

    return new Pool(
      token0.wrapped,
      token1.wrapped,
      fee as FeeAmount,
      poolStateRes.sqrtP,
      liqStateRes.baseL,
      liqStateRes.reinvestL,
      poolStateRes.currentTick,
    )
  }, [token0, token1, poolStateRes, liqStateRes, feeRes])

  const position = useMemo(() => {
    if (!positionDetail || !pool) return null
    return new Position({
      pool,
      tickLower: positionDetail.tickLower,
      tickUpper: positionDetail.tickUpper,
      liquidity: positionDetail.liquidity.toString(),
    })
  }, [positionDetail, pool])

  const loading = loadingPoolState || loadingLiqState || loadingToken0 || loadingToken1 || loadingFee || loadingPos

  const outOfRange =
    !!position && (position.pool.tickCurrent < position.tickLower || position.pool.tickCurrent >= position.tickUpper)

  const currencies = useMemo(() => [currency0, currency1], [currency0, currency1])
  const balances = useCurrencyBalances(currencies)

  const [isReverse, setIsReverse] = useState(false)

  const selectedCurrency = useMemo(() => {
    return isReverse ? currency1 : currency0
  }, [isReverse, currency0, currency1])

  const quoteCurrency = useMemo(() => {
    return isReverse ? currency0 : currency1
  }, [isReverse, currency0, currency1])

  const [typedValue, setTypedValue] = useState('')
  const debouncedValue = useDebounce(typedValue, 300)

  const amountIn = useParsedAmount(selectedCurrency, debouncedValue)

  const [tickLower, tickUpper] = useTicksFromRange(selectedRange, pool || undefined)
  const tickReader = useProAmmTickReader()

  const vTickLower = position ? position.tickLower : tickLower
  const vTickUpper = position ? position.tickUpper : tickUpper
  const results = useSingleContractMultipleData(tickReader, 'getNearestInitializedTicks', [
    [poolAddress, vTickLower],
    [poolAddress, vTickUpper],
  ])

  const tickPrevious = useMemo(() => {
    return results.map(call => call.result?.previous)
  }, [results])

  const params = useMemo(() => {
    return amountIn?.greaterThan('0') && selectedCurrency && quoteCurrency
      ? {
          poolAddress,
          tokenIn: selectedCurrency.wrapped.address,
          tokenOut: quoteCurrency.wrapped.address,
          amountIn,
          tickLower: vTickLower,
          tickUpper: vTickUpper,
        }
      : undefined
  }, [amountIn, poolAddress, selectedCurrency, vTickLower, vTickUpper, quoteCurrency])

  const { loading: zapLoading, result, aggregatorData } = useZapInPoolResult(params)
  const [approvalState, approve] = useApproveCallback(amountIn, zapInContractAddress)
  const { zapIn } = useZapInAction()

  let error: ReactElement | null = null
  if (!typedValue) error = <Trans>Enter an amount</Trans>
  else if (!amountIn) error = <Trans>Invalid Input</Trans>
  else if (balances[isReverse ? 1 : 0] && amountIn?.greaterThan(balances[isReverse ? 1 : 0]))
    error = <Trans>Insufficient Balance</Trans>

  const renderActionName = () => {
    if (error) return error
    if (approvalState === ApprovalState.PENDING)
      return (
        <Dots>
          <Trans>Approving</Trans>
        </Dots>
      )
    if (approvalState !== ApprovalState.APPROVED) return <Trans>Approve</Trans>

    if (zapLoading)
      return (
        <Dots>
          <Trans>Loading</Trans>
        </Dots>
      )
    if (!!position) return <Trans>Increase Liquidity</Trans>
    return <Trans>Add Liquidity</Trans>
  }

  const symbol0 = getTokenSymbolWithHardcode(chainId, token0?.wrapped.address, currency0?.symbol)
  const symbol1 = getTokenSymbolWithHardcode(chainId, token1?.wrapped.address, currency1?.symbol)

  const [attempingTx, setAttempingTx] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [errorMsg, setError] = useState('')
  const addTransactionWithType = useTransactionAdder()

  const newPosDraft =
    pool && result
      ? new Position({
          pool,
          tickLower: vTickLower,
          tickUpper: vTickUpper,
          liquidity: result.liquidity.toString(),
        })
      : undefined

  const handleClick = async () => {
    if (approvalState === ApprovalState.NOT_APPROVED) {
      approve()
      return
    }

    if (selectedCurrency && (tokenId || tickPrevious.every(Boolean)) && result && amountIn?.quotient && pool) {
      try {
        setAttempingTx(true)

        const { hash: txHash } = await zapIn(
          {
            tokenId: tokenId ? tokenId.toString() : 0,
            tokenIn: selectedCurrency.wrapped.address,
            amountIn: amountIn.quotient.toString(),
            usedAmount0: result.usedAmount0.toString(),
            usedAmount1: result.usedAmount1.toString(),
            poolAddress,
            tickLower: vTickLower,
            tickUpper: vTickUpper,
            tickPrevious: [tickPrevious[0], tickPrevious[1]],
            poolInfo: {
              token0: pool.token0.wrapped.address,
              fee: pool.fee,
              token1: pool.token1.wrapped.address,
            },
            liquidity: result.liquidity.toString(),
            aggregatorRoute: aggregatorData,
          },
          {
            zapWithNative: selectedCurrency.isNative,
          },
        )

        setTxHash(txHash)
        addTransactionWithType({
          hash: txHash,
          type: tokenId ? TRANSACTION_TYPE.ELASTIC_INCREASE_LIQUIDITY : TRANSACTION_TYPE.ELASTIC_ADD_LIQUIDITY,
          extraInfo: {
            tokenSymbolIn: symbol0 ?? '',
            tokenSymbolOut: symbol1 ?? '',
            tokenAmountIn: newPosDraft?.amount0?.toSignificant(6) || '0',
            tokenAmountOut: newPosDraft?.amount1?.toSignificant(6) || '0',
            tokenAddressIn: currency0?.wrapped.address || '',
            tokenAddressOut: currency1?.wrapped.address || '',
          },
        })

        setAttempingTx(false)
      } catch (e) {
        setAttempingTx(false)
        setError(e?.message || JSON.stringify(e))
      }
    }
  }

  const zapDetail = useZapDetail({
    pool,
    tokenIn: selectedCurrency?.wrapped.address,
    tokenId: tokenId?.toString(),
    position,
    zapResult: result,
    amountIn,
    poolAddress,
    tickLower: vTickLower,
    tickUpper: vTickUpper,
    previousTicks: tickPrevious,
    aggregatorRoute: aggregatorData,
  })

  console.log(111, zapDetail.priceImpact)

  return (
    <Modal isOpen={isOpen}>
      {attempingTx ? (
        <ConfirmationPendingContent
          onDismiss={() => {
            setAttempingTx(false)
          }}
          pendingText={
            <Trans>
              Supplying {newPosDraft?.amount0?.toSignificant(6)} {symbol0} and {newPosDraft?.amount1?.toSignificant(6)}{' '}
              {symbol1}
            </Trans>
          }
        />
      ) : errorMsg ? (
        <TransactionErrorContent
          onDismiss={() => {
            setError('')
            setAttempingTx(false)
          }}
          message={errorMsg}
        />
      ) : txHash ? (
        <TransactionSubmittedContent chainId={chainId} hash={txHash} onDismiss={onDismiss} />
      ) : (
        <Content>
          {loading ? (
            <LocalLoader />
          ) : (
            <>
              <Flex justifyContent="space-between">
                <Flex>
                  <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={20} />
                  <Text>
                    {symbol0} - {symbol1}
                  </Text>
                </Flex>

                {!!position && (
                  <Text fontSize={12} fontWeight="500" color={outOfRange ? theme.warning : theme.primary}>
                    #{tokenId?.toString()}
                  </Text>
                )}
              </Flex>

              <Text marginTop="12px" color={theme.subText} fontSize={12}>
                <Trans>Add liquidity to the pool using a single token</Trans>
              </Text>

              {!!position ? (
                <Text fontWeight="500" fontSize={14} marginTop="20px" marginBottom="12px">
                  <Trans>Increase Liquidity</Trans>
                </Text>
              ) : (
                <Text fontWeight="500" fontSize={14} marginTop="20px" marginBottom="12px">
                  <Trans>Step 1. Deposit Your Liquidity</Trans>
                </Text>
              )}

              <CurrencyInputPanel
                id="quick-zap"
                value={typedValue}
                onUserInput={v => {
                  setTypedValue(v)
                }}
                onMax={() => {
                  setTypedValue(balances[isReverse ? 1 : 0].toExact())
                }}
                onHalf={() => {
                  setTypedValue(balances[isReverse ? 1 : 0].divide('2').toExact())
                }}
                currency={selectedCurrency}
                estimatedUsd={formattedNum(zapDetail.amountInUsd.toString(), true) || undefined}
                positionMax="top"
                showCommonBases
                isSwitchMode
                onSwitchCurrency={() => {
                  setIsReverse(prev => !prev)
                }}
              />

              {!position && pool && (
                <>
                  <Flex justifyContent="space-between" alignItems="center" marginTop="20px" marginBottom="12px">
                    <Text fontWeight="500" fontSize={14}>
                      <Trans>Step 2. Choose Price Range</Trans>
                    </Text>

                    <StyledInternalLink
                      to={`/${networkInfo.route}${APP_PATHS.ELASTIC_CREATE_POOL}/${
                        currency0?.isNative ? currency0.symbol : currency0?.wrapped.address || ''
                      }/${currency1?.isNative ? currency1.symbol : currency1?.wrapped.address || ''}/${pool?.fee}`}
                    >
                      <Text fontSize="12px" fontWeight="500">
                        <Trans>Set a Custom Range</Trans> ↗
                      </Text>
                    </StyledInternalLink>
                  </Flex>

                  <RangeSelector
                    pool={pool}
                    selectedRange={selectedRange}
                    onChange={range => setSelectedRange(range)}
                  />
                </>
              )}

              <div style={{ margin: '20px -8px' }}>
                <SlippageSettingGroup isWrapOrUnwrap={false} isStablePairSwap={false} />
              </div>

              <ZapDetail zapLoading={zapLoading} zapDetail={zapDetail} />

              {!!(
                zapDetail.priceImpact?.isVeryHigh ||
                zapDetail.priceImpact?.isHigh ||
                zapDetail.priceImpact?.isInvalid
              ) &&
                result &&
                !zapLoading && (
                  <>
                    <Flex marginTop="1rem" />
                    <PriceImpactNote priceImpact={zapDetail.priceImpact.value} />
                  </>
                )}

              <Flex sx={{ gap: '1rem' }} marginTop="1.25rem">
                <ButtonOutlined onClick={onDismiss}>
                  <Trans>Cancel</Trans>
                </ButtonOutlined>

                {!account ? (
                  <ButtonLight onClick={toggleWalletModal}>
                    <Trans>Connect Wallet</Trans>
                  </ButtonLight>
                ) : (
                  <ButtonPrimary
                    backgroundColor={
                      zapDetail.priceImpact.isVeryHigh
                        ? theme.red
                        : zapDetail.priceImpact.isHigh
                        ? theme.warning
                        : undefined
                    }
                    onClick={handleClick}
                    disabled={!!error || approvalState === ApprovalState.PENDING || zapLoading}
                  >
                    {renderActionName()}
                  </ButtonPrimary>
                )}
              </Flex>
            </>
          )}
        </Content>
      )}
    </Modal>
  )
}
