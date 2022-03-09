import React, { Dispatch, memo, SetStateAction, useEffect, useMemo, useState } from 'react'
import { useMedia } from 'react-use'
import { TrueSightContainer } from 'pages/TrueSight/components/TrendingSoonLayout'
import TrendingTokenItemMobileOnly from 'pages/TrueSight/components/TrendingLayout/TrendingTokenItemMobileOnly'
import { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import { TRUESIGHT_WHEN_TO_K, TrueSightChartCategory, TrueSightFilter, TrueSightTimeframe } from 'pages/TrueSight/index'
import useGetCoinGeckoChartData from 'pages/TrueSight/hooks/useGetCoinGeckoChartData'
import useTheme from 'hooks/useTheme'
import Pagination from 'components/Pagination'
import { Box, Flex, Text } from 'rebass'
import MobileChartModal from 'pages/TrueSight/components/TrendingSoonLayout/MobileChartModal'
import useGetTrendingData from 'pages/TrueSight/hooks/useGetTrendingData'
import LocalLoader from 'components/LocalLoader'
import WarningIcon from 'components/LiveChart/WarningIcon'
import { Trans } from '@lingui/macro'
import styled from 'styled-components'
import DiscoverIcon from 'components/Icons/DiscoverIcon'
import SwapButtonWithOptions from 'pages/TrueSight/components/SwapButtonWithOptions'
import { ButtonEmpty } from 'components/Button'
import { ChevronDown } from 'react-feather'
import { TruncatedText } from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenItem'
import { formattedNum } from 'utils'
import { rgba } from 'polished'
import Tags from 'pages/TrueSight/components/Tags'
import CommunityButton, { StyledCommunityButton } from 'pages/TrueSight/components/CommunityButton'
import { ExternalLink } from 'theme'
import AddressButton from 'pages/TrueSight/components/AddressButton'
import {
  TagWebsiteCommunityAddressContainer,
  WebsiteCommunityAddressContainer,
} from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenDetail'
import Chart from 'pages/TrueSight/components/Chart'
import dayjs from 'dayjs'
import Divider from 'components/Divider'

const ITEM_PER_PAGE = 25
const MAX_ITEM = 50

// Don't remove `memo` here because it preserves `SwapButtonWithOptions` state.
const TrendingLayout = ({ filter }: { filter: TrueSightFilter }) => {
  const [selectedToken, setSelectedToken] = useState<TrueSightTokenData>()
  const [isOpenChartModal, setIsOpenChartModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const above1200 = useMedia('(min-width: 1200px)')
  const {
    data: trendingSoonData,
    isLoading: isLoadingTrendingSoonTokens,
    error: errorWhenLoadingTrendingSoonData,
  } = useGetTrendingData(filter, currentPage, ITEM_PER_PAGE)
  const maxPage = Math.min(
    Math.ceil((trendingSoonData?.total_number_tokens ?? 1) / ITEM_PER_PAGE),
    MAX_ITEM / ITEM_PER_PAGE,
  )
  const trendingSoonTokens = trendingSoonData?.tokens ?? []

  useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  const [chartTimeframe, setChartTimeframe] = useState<TrueSightTimeframe>(TrueSightTimeframe.ONE_DAY)
  const [chartCategory, setChartCategory] = useState<TrueSightChartCategory>(TrueSightChartCategory.TRADING_VOLUME)
  const tokenNetwork = useMemo(() => (selectedToken ? selectedToken.present_on_chains[0] : undefined), [selectedToken])
  const tokenAddress = useMemo(
    () => (selectedToken ? selectedToken.platforms[selectedToken.present_on_chains[0]] : undefined),
    [selectedToken],
  )
  const { data: chartData, isLoading: isChartDataLoading } = useGetCoinGeckoChartData(
    tokenNetwork,
    tokenAddress,
    chartTimeframe,
  )

  const theme = useTheme()

  useEffect(() => {
    setSelectedToken(undefined)
  }, [filter])

  const MobileLayout = () => (
    <Box overflow="hidden">
      {trendingSoonTokens.map(tokenData => (
        <TrendingTokenItemMobileOnly
          key={tokenData.token_id}
          isSelected={selectedToken?.token_id === tokenData.token_id}
          tokenData={tokenData}
          onSelect={() => setSelectedToken(prev => (prev?.token_id === tokenData.token_id ? undefined : tokenData))}
          setIsOpenChartModal={setIsOpenChartModal}
        />
      ))}
      <Pagination
        onPrev={() => setCurrentPage(prev => Math.max(1, prev - 1))}
        onNext={() => setCurrentPage(prev => Math.min(maxPage, prev + 1))}
        currentPage={currentPage}
        maxPage={maxPage}
        style={{ padding: '20px' }}
      />
      <MobileChartModal
        isOpen={isOpenChartModal}
        setIsOpen={setIsOpenChartModal}
        chartData={chartData}
        isLoading={isChartDataLoading}
        chartCategory={chartCategory}
        setChartCategory={setChartCategory}
        chartTimeframe={chartTimeframe}
        setChartTimeframe={setChartTimeframe}
      />
    </Box>
  )

  const TableBody = ({
    tokenData,
    selectedToken,
    setSelectedToken,
  }: {
    tokenData: TrueSightTokenData
    selectedToken: TrueSightTokenData | undefined
    setSelectedToken: Dispatch<SetStateAction<TrueSightTokenData | undefined>>
  }) => {
    const isThisTokenSelected = !!selectedToken && selectedToken.token_id === tokenData.token_id
    const isTrueSightToken = !!tokenData.discovered_on
    const date = dayjs(tokenData.discovered_on * 1000).format('YYYY/MM/DD')

    return (
      <TableBodyWithDetailContainer isSelected={isThisTokenSelected} isTrueSightToken={isTrueSightToken}>
        <TableBodyContainer
          onClick={() => setSelectedToken(prev => (prev?.token_id === tokenData.token_id ? undefined : tokenData))}
        >
          <TableBodyItem>{tokenData.discovered_on ? <DiscoverIcon color={theme.primary} /> : null}</TableBodyItem>
          <TableBodyItem>
            <img
              src={tokenData.logo_url}
              alt="icon"
              style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px', borderRadius: '50%' }}
            />
            <TruncatedText color={theme.subText}>{tokenData.name}</TruncatedText>
            <span style={{ color: theme.disableText }}>{tokenData.symbol}</span>
          </TableBodyItem>
          <TableBodyItem>{formattedNum(tokenData.price.toString(), true, TRUESIGHT_WHEN_TO_K)}</TableBodyItem>
          <TableBodyItem align="right">
            {formattedNum(tokenData.trading_volume.toString(), true, TRUESIGHT_WHEN_TO_K)}
          </TableBodyItem>
          <TableBodyItem align="right">
            {formattedNum(tokenData.market_cap.toString(), true, TRUESIGHT_WHEN_TO_K)}
          </TableBodyItem>
          <TableBodyItem align="right">
            {tokenData.number_holders === -1
              ? '--'
              : formattedNum(tokenData.number_holders.toString(), false, TRUESIGHT_WHEN_TO_K)}
          </TableBodyItem>
          <TableBodyItem align="right" style={{ overflow: 'visible' }}>
            <SwapButtonWithOptions
              platforms={tokenData.platforms}
              style={{
                minWidth: 'fit-content',
                padding: '0 36px 0 12px',
                justifyContent: 'flex-start',
                height: '28px',
                zIndex: 'unset',
              }}
            />
            <ButtonEmpty padding="0" height="100%" width="unset">
              <ChevronDown
                size={16}
                style={{ transform: isThisTokenSelected ? 'rotate(180deg)' : 'unset', minWidth: '16px' }}
              />
            </ButtonEmpty>
          </TableBodyItem>
        </TableBodyContainer>
        {isThisTokenSelected && isTrueSightToken && (
          <>
            <TableBodyContainer style={{ cursor: 'default' }}>
              <TableBodyItemSmall />
              <TableBodyItemSmall style={{ fontStyle: 'italic' }}>
                <Trans>We discovered this on </Trans> {date}
              </TableBodyItemSmall>
              <TableBodyItemSmall>
                <TableBodyItemSmallDiff up={true}>1,423%</TableBodyItemSmallDiff>
                <span>$0.000000000003</span>
              </TableBodyItemSmall>
              <TableBodyItemSmall align="right">
                <TableBodyItemSmallDiff up={true}>1,423%</TableBodyItemSmallDiff>
                <span>$807,381,607</span>
              </TableBodyItemSmall>
              <TableBodyItemSmall align="right">
                <TableBodyItemSmallDiff up={true}>1,423%</TableBodyItemSmallDiff>
                <span>$807,381,607</span>
              </TableBodyItemSmall>
              <TableBodyItemSmall align="right">
                <TableBodyItemSmallDiff up={false}>-1,423%</TableBodyItemSmallDiff>
                <span>200,000</span>
              </TableBodyItemSmall>
              <TableBodyItemSmall />
            </TableBodyContainer>
            <Divider margin="10px 20px" />
          </>
        )}
        {isThisTokenSelected && (
          <Box padding="10px 20px 20px">
            <TagWebsiteCommunityAddressContainer>
              <Tags tags={tokenData.tags} />
              <WebsiteCommunityAddressContainer>
                <StyledCommunityButton
                  as={ExternalLink}
                  href={tokenData.official_web}
                  target="_blank"
                  style={{ fontWeight: 400 }}
                >
                  Website ↗
                </StyledCommunityButton>
                <CommunityButton communityOption={tokenData.social_urls} />
                <AddressButton platforms={tokenData.platforms} />
              </WebsiteCommunityAddressContainer>
            </TagWebsiteCommunityAddressContainer>
            <Box height="360px" marginTop="20px">
              <Chart
                chartData={chartData}
                isLoading={isChartDataLoading}
                chartCategory={chartCategory}
                setChartCategory={setChartCategory}
                chartTimeframe={chartTimeframe}
                setChartTimeframe={setChartTimeframe}
              />
            </Box>
          </Box>
        )}
      </TableBodyWithDetailContainer>
    )
  }

  const DesktopLayout = () => (
    <TableContainer>
      <TableHeader>
        <TableHeaderItem />
        <TableHeaderItem>
          <Trans>Name</Trans>
        </TableHeaderItem>
        <TableHeaderItem>
          <Trans>Price</Trans>
        </TableHeaderItem>
        <TableHeaderItem align="right">
          <Trans>Trading Volume (24H)</Trans>
        </TableHeaderItem>
        <TableHeaderItem align="right">
          <Trans>Market Cap</Trans>
        </TableHeaderItem>
        <TableHeaderItem align="right">
          <Trans>Holders</Trans>
        </TableHeaderItem>
        <TableHeaderItem align="right">
          <Trans>Actions</Trans>
        </TableHeaderItem>
      </TableHeader>
      {trendingSoonTokens.map(tokenData => (
        <TableBody
          key={tokenData.token_id}
          tokenData={tokenData}
          selectedToken={selectedToken}
          setSelectedToken={setSelectedToken}
        />
      ))}
      <Pagination
        onPrev={() => setCurrentPage(prev => Math.max(1, prev - 1))}
        onNext={() => setCurrentPage(prev => Math.min(maxPage, prev + 1))}
        currentPage={currentPage}
        maxPage={maxPage}
        style={{ padding: '20px' }}
      />
    </TableContainer>
  )

  return (
    <>
      <TrueSightContainer style={{ minHeight: 'unset' }}>
        {isLoadingTrendingSoonTokens ? (
          <LocalLoader />
        ) : errorWhenLoadingTrendingSoonData || trendingSoonTokens.length === 0 ? (
          <Flex
            flexDirection="column"
            height="100%"
            justifyContent="center"
            alignItems="center"
            style={{ height: '616px', gap: '16px' }}
          >
            <WarningIcon />
            <Text color={theme.disableText}>
              {trendingSoonTokens.length === 0 && filter.isShowTrueSightOnly ? (
                <Trans>No token found. Try turn off truesight.</Trans>
              ) : (
                <Trans>No token found</Trans>
              )}
            </Text>
          </Flex>
        ) : above1200 ? (
          <DesktopLayout />
        ) : (
          <MobileLayout />
        )}
      </TrueSightContainer>
    </>
  )
}

export default memo(TrendingLayout)

const TableContainer = styled.div`
  border-radius: 8px;
`

const TableHeader = styled.div`
  display: grid;
  padding: 18px 20px;
  grid-template-columns: 0.1fr 1.5fr 1fr 1fr 1fr 1fr 1fr;
  background: ${({ theme }) => theme.tableHeader}:;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  gap: 16px;
`

const TableHeaderItem = styled.div<{ align?: string }>`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.subText};
  text-align: ${({ align }) => align ?? 'left'};
  text-transform: uppercase;
`

const TableBodyWithDetailContainer = styled.div<{ isTrueSightToken: boolean; isSelected: boolean }>`
  display: flex;
  flex-direction: column;
  background: ${({ theme, isTrueSightToken, isSelected }) =>
    isSelected ? theme.tableHeader : isTrueSightToken ? rgba(theme.bg8, 0.12) : theme.background};
  border-bottom: 1px solid ${({ theme }) => theme.border};
`

const TableBodyContainer = styled.div`
  display: grid;
  padding: 10px 20px;
  grid-template-columns: 0.1fr 1.5fr 1fr 1fr 1fr 1fr 1fr;
  gap: 16px;
  cursor: pointer;
`

const TableBodyItem = styled.div<{ align?: string }>`
  overflow: hidden;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.subText};
  text-align: ${({ align }) => align ?? 'left'};
  display: flex;
  align-items: center;
  justify-content: ${({ align }) => (align === 'right' ? 'flex-end' : 'flex-start')};
  gap: 8px;
`

const TableBodyItemSmall = styled(TableBodyItem)`
  font-size: 12px;
  font-weight: 400;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: ${({ align }) => (align === 'right' ? 'flex-end' : 'flex-start')};
  gap: 8px;
`

export const TableBodyItemSmallDiff = styled.div<{ up: boolean }>`
  font-size: 10px;
  color: ${({ theme, up }) => (up ? theme.apr : theme.red)};
  background: ${({ theme, up }) => (up ? rgba(theme.apr, 0.2) : rgba(theme.red, 0.2))};
  padding: 5px 8px;
  border-radius: 24px;
`
