import { Price } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React, { useEffect, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import { GreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { AutoRow, RowBetween } from 'components/Row'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import { BuildRouteResult } from 'components/SwapForm/hooks/useBuildRoute'
import { Dots } from 'components/swapv2/styleds'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useEncodeSolana } from 'state/swap/hooks'
import { CloseIcon } from 'theme/components'
import { toCurrencyAmount } from 'utils/currencyAmount'

import SwapBrief from './SwapBrief'
import SwapDetails, { Props as SwapDetailsProps } from './SwapDetailsv2'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 24px;
  gap: 16px;
  border-radius: 20px;
`

type Props = {
  buildResult: BuildRouteResult | undefined
  isBuildingRoute: boolean
  errorWhileBuildRoute: string | undefined
  onDismiss: () => void
  onSwap: () => void
  onRetry: () => void
}

const ConfirmSwapModalContent: React.FC<Props> = ({
  buildResult,
  isBuildingRoute,
  errorWhileBuildRoute,
  onDismiss,
  onSwap,
  onRetry,
}) => {
  const theme = useTheme()
  const { isSolana } = useActiveWeb3React()
  const [encodeSolana] = useEncodeSolana()
  const [isAcceptedChanges, setAcceptedChanges] = useState(false)
  const { routeSummary } = useSwapFormContext()

  const shouldShowAcceptChanges =
    !isBuildingRoute && !errorWhileBuildRoute && !isAcceptedChanges && buildResult?.data?.outputChange?.level !== 0
  const shouldDisableConfirmButton = isBuildingRoute || !!errorWhileBuildRoute || shouldShowAcceptChanges

  const getSwapDetailsProps = (): SwapDetailsProps => {
    if (!buildResult?.data || !routeSummary) {
      return {
        isLoading: isBuildingRoute,
        hasError: !!errorWhileBuildRoute,

        gasUsd: undefined,
        executionPrice: undefined,
        parsedAmountOut: undefined,
        amountInUsd: undefined,
      }
    }

    const { amountIn, amountInUsd, amountOut, gasUsd } = buildResult.data
    const parsedAmountIn = toCurrencyAmount(routeSummary.parsedAmountIn.currency, amountIn)
    const parsedAmountOut = toCurrencyAmount(routeSummary.parsedAmountOut.currency, amountOut)
    const executionPrice = new Price(
      parsedAmountIn.currency,
      parsedAmountOut.currency,
      parsedAmountIn.quotient,
      parsedAmountOut.quotient,
    )

    return {
      isLoading: isBuildingRoute,
      hasError: !!errorWhileBuildRoute,

      gasUsd,
      executionPrice,
      parsedAmountOut,
      amountInUsd,
    }
  }

  const renderSwapBrief = () => {
    if (!routeSummary) {
      return null
    }

    let parsedAmountIn = routeSummary.parsedAmountIn
    let parsedAmountOut = routeSummary.parsedAmountOut
    let levelOfChanges

    if (buildResult?.data) {
      const { amountIn, amountOut } = buildResult.data
      parsedAmountIn = toCurrencyAmount(routeSummary.parsedAmountIn.currency, amountIn)
      parsedAmountOut = toCurrencyAmount(routeSummary.parsedAmountOut.currency, amountOut)
      const { amount, level } = buildResult.data.outputChange || {}

      const changedAmount = Number(amount)

      if (changedAmount >= 0) {
        levelOfChanges = undefined
      } else if (changedAmount < 0) {
        levelOfChanges = level
      }
    }

    return <SwapBrief levelOfChanges={levelOfChanges} inputAmount={parsedAmountIn} outputAmount={parsedAmountOut} />
  }

  useEffect(() => {
    setAcceptedChanges(false)
  }, [buildResult])

  return (
    <Wrapper>
      <AutoColumn>
        <RowBetween>
          <Text fontWeight={500} fontSize={20}>
            <Trans>Confirm Swap</Trans>
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>

        {renderSwapBrief()}
      </AutoColumn>

      <SwapDetails {...getSwapDetailsProps()} />

      <AutoRow>
        {isSolana && !encodeSolana ? (
          <GreyCard style={{ textAlign: 'center', borderRadius: '999px', padding: '12px' }} id="confirm-swap-or-send">
            <Dots>
              <Trans>Checking accounts</Trans>
            </Dots>
          </GreyCard>
        ) : errorWhileBuildRoute ? (
          <ButtonPrimary onClick={onRetry}>
            <Text fontSize={14} fontWeight={500} as="span" lineHeight={1}>
              <Trans>Try again</Trans>
            </Text>
          </ButtonPrimary>
        ) : (
          <ButtonPrimary onClick={onSwap} disabled={shouldDisableConfirmButton} id="confirm-swap-or-send">
            <Text fontSize={14} fontWeight={500} as="span" lineHeight={1}>
              <Trans>Confirm Swap</Trans>
            </Text>
          </ButtonPrimary>
        )}
      </AutoRow>
    </Wrapper>
  )
}

export default ConfirmSwapModalContent
