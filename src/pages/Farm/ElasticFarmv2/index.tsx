import { ChainId } from '@kyberswap/ks-sdk-core'
import { TickMath } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { Info } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Divider from 'components/Divider'
import { RowBetween, RowFit, RowWrap } from 'components/Row'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { ZERO_ADDRESS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import { useProAmmNFTPositionManagerContract } from 'hooks/useContract'
import { useProAmmPositions } from 'hooks/useProAmmPositions'
import useTheme from 'hooks/useTheme'
import { Dots } from 'pages/Pool/styleds'
import { useFarmAction } from 'state/farms/elastic/hooks'
import { useElasticFarmsV2 } from 'state/farms/elasticv2/hooks'
import { ElasticFarmV2, ElasticFarmV2Range } from 'state/farms/elasticv2/types'
import { useSingleCallResult } from 'state/multicall/hooks'
import { useIsTransactionPending } from 'state/transactions/hooks'
import { PositionDetails } from 'types/position'
import { getTickToPrice } from 'utils/getTickToPrice'

import FarmCard from './components/FarmCard'

const Wrapper = styled.div`
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.border};
  background-color: ${({ theme }) => theme.background};
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const FarmsWrapper = styled(RowWrap)`
  --items-in-row: 3;
  --gap: 24px;
`

export interface ElasticFarmV2WithRangePrices extends ElasticFarmV2 {
  userPositions: Array<PositionDetails>
  ranges: Array<ElasticFarmV2Range & { priceLower?: string; priceUpper?: string; priceCurrent?: string }>
}

export default function ElasticFarmv2({ address }: { address?: string }) {
  const theme = useTheme()
  const { chainId, account } = useActiveWeb3React()
  const above1000 = useMedia('(min-width: 1000px)')

  const whitelisted = useAllTokens()
  const inputToken = Object.values(whitelisted)?.filter(t => t.symbol === 'KNC')[0]
  const outputToken = Object.values(whitelisted)?.filter(t => t.symbol === 'USDC')[0]

  const elasticFarm = useElasticFarmsV2()
  const { approve } = useFarmAction(address || ZERO_ADDRESS)
  const farms = elasticFarm?.farms
  const posManager = useProAmmNFTPositionManagerContract()
  const [approvalTx, setApprovalTx] = useState('')
  const isApprovalTxPending = useIsTransactionPending(approvalTx)
  const res = useSingleCallResult(posManager, 'isApprovedForAll', [account, address])
  const isApprovedForAll = res?.result?.[0] || !address

  const handleApprove = async () => {
    if (!isApprovedForAll) {
      const tx = await approve()
      setApprovalTx(tx)
    }
  }

  const [searchParams] = useSearchParams()
  const tab = searchParams.get('type') || 'active'

  const { positions: userPositions } = useProAmmPositions(account)
  const combinedFarms: ElasticFarmV2WithRangePrices[] | undefined = useMemo(() => {
    if (!userPositions || !farms) return undefined

    return farms?.map(farm => {
      return {
        ...farm,
        userPositions: userPositions?.filter(p => p.poolId.toLowerCase() === farm.poolAddress.toLowerCase()),
        ranges: farm.ranges.map(range => {
          return {
            ...range,
            priceLower:
              +range.tickLower > TickMath.MIN_TICK
                ? getTickToPrice(farm.token0, farm.token1, +range.tickLower)?.toSignificant(4)
                : '0',
            priceUpper:
              +range.tickUpper < TickMath.MAX_TICK
                ? getTickToPrice(farm.token0, farm.token1, +range.tickUpper)?.toSignificant(4)
                : '∞',
            priceCurrent: getTickToPrice(farm.token0, farm.token1, +farm.pool.tickCurrent)?.toSignificant(4),
          }
        }),
      }
    })
  }, [farms, userPositions])
  const renderApproveButton = () => {
    if (isApprovedForAll || tab === 'ended') {
      return null
    }

    if (approvalTx && isApprovalTxPending) {
      return (
        <ButtonPrimary
          style={{
            whiteSpace: 'nowrap',
            height: '38px',
            padding: '0 12px',
          }}
          onClick={handleApprove}
          disabled
        >
          <Info width="16px" />
          <Text fontSize="14px" marginLeft="8px">
            <Dots>
              <Trans>Approving</Trans>
            </Dots>
          </Text>
        </ButtonPrimary>
      )
    }

    return (
      <MouseoverTooltipDesktopOnly
        text={
          <Text color={theme.subText} as="span">
            <Trans>
              Authorize the farming contract so it can access your liquidity positions (i.e. your NFT tokens). Then
              deposit your liquidity positions using the{' '}
              <Text as="span" color={theme.text}>
                Deposit
              </Text>{' '}
              button
            </Trans>
          </Text>
        }
        width="400px"
        placement="top"
      >
        <ButtonPrimary
          style={{
            whiteSpace: 'nowrap',
            height: '38px',
            padding: '0 12px',
          }}
          onClick={handleApprove}
        >
          <Info width="16px" />
          <Text fontSize="14px" marginLeft="8px">
            {approvalTx && isApprovalTxPending ? (
              <Dots>
                <Trans>Approving</Trans>
              </Dots>
            ) : above1000 ? (
              <Trans>Approve Farming Contract</Trans>
            ) : (
              <Trans>Approve</Trans>
            )}
          </Text>
        </ButtonPrimary>
      </MouseoverTooltipDesktopOnly>
    )
  }

  return (
    <Wrapper>
      <RowBetween>
        <Text fontSize="16px" lineHeight="20px" color={theme.text}>
          <Trans>Elastic Farm V2</Trans>
        </Text>
        <RowFit>{renderApproveButton()}</RowFit>
      </RowBetween>
      <Divider />
      <FarmsWrapper>
        {chainId === ChainId.GÖRLI ? (
          <>
            {combinedFarms?.map((farm: ElasticFarmV2WithRangePrices) => (
              <FarmCard key={farm.id} inputToken={farm.pool.token0} outputToken={farm.pool.token1} farm={farm} />
            ))}
          </>
        ) : (
          <>
            <FarmCard inputToken={inputToken} outputToken={outputToken} />
            <FarmCard inputToken={inputToken} outputToken={outputToken} hasPositions hasRewards hasUnstake />
            <FarmCard inputToken={inputToken} outputToken={outputToken} enableStake />
          </>
        )}
      </FarmsWrapper>
    </Wrapper>
  )
}
