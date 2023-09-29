import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { motion } from 'framer-motion'
import { rgba } from 'polished'
import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { ArrowDown, ArrowUp } from 'react-feather'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled, { DefaultTheme, css } from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import Column from 'components/Column'
import Icon from 'components/Icons/Icon'
import AnimatedLoader from 'components/Loader/AnimatedLoader'
import Pagination from 'components/Pagination'
import Row, { RowFit } from 'components/Row'
import TabButton from 'components/TabButton'
import { TextDotted } from 'components/Tooltip'
import { APP_PATHS, ICON_ID, SORT_DIRECTION } from 'constants/index'
import { MIXPANEL_TYPE, useMixpanelKyberAI } from 'hooks/useMixpanel'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { StyledSectionWrapper } from 'pages/TrueSightV2/components'
import TokenFilter from 'pages/TrueSightV2/components/TokenFilter'
import { MEDIA_WIDTHS } from 'theme'

import ChevronIcon from '../components/ChevronIcon'
import FeedbackSurvey from '../components/FeedbackSurvey'
import KyberAIShareModal from '../components/KyberAIShareModal'
import MultipleChainDropdown from '../components/MultipleChainDropdown'
import SimpleTooltip from '../components/SimpleTooltip'
import SmallKyberScoreMeter from '../components/SmallKyberScoreMeter'
import TokenChart from '../components/TokenChartSVG'
import TokenListVariants from '../components/TokenListVariants'
import WatchlistButton from '../components/WatchlistButton'
import KyberScoreChart from '../components/chart/KyberScoreChart'
import TokenAnalysisListShareContent from '../components/shareContent/TokenAnalysisListShareContent'
import { KYBERAI_LISTYPE_TO_MIXPANEL, Z_INDEX_KYBER_AI } from '../constants'
import { useTokenListQuery } from '../hooks/useKyberAIData'
import { IKyberScoreChart, ITokenList, KyberAIListType, QueryTokenParams } from '../types'
import { calculateValueToColor, formatLocaleStringNum, formatTokenPrice, navigateToSwapPage } from '../utils'

const SIZE_MOBILE = '1080px'

const TradeInfoWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
   flex-direction: column;
  `}
`

const ListTokenWrapper = styled(StyledSectionWrapper)`
  height: fit-content;
  padding: 0;
  background: ${({ theme }) => theme.background};
  @media only screen and (max-width: ${SIZE_MOBILE}) {
    margin-left: -16px;
    margin-right: -16px;
    border-left: 0;
    border-right: 0;
  }
`

const TableWrapper = styled.div`
  border-radius: 20px 20px 0 0;
  padding: 0;
  font-size: 12px;
  border-bottom: none;
  transition: all 0.15s ease;
  overflow: hidden;
  @media only screen and (max-width: ${SIZE_MOBILE}) {
    border-radius: 0px;
    border: none;
    overflow-x: scroll;
    min-height: 250px;
  }
`
const PaginationWrapper = styled.div`
  border-radius: 0 0 20px 20px;
  display: flex;
  align-items: center;
  border-top: none;
  overflow: hidden;
  min-height: 50px;
  background-color: ${({ theme }) => theme.background};
  @media only screen and (max-width: ${SIZE_MOBILE}) {
    margin-left: -16px;
    margin-right: -16px;
    border-radius: 0px;
    border: none;
  }
`
const Table = styled.table`
  border-spacing: 0px;
  width: 100%;
  border-collapse: collapse;

  thead {
    height: 48px;
    text-transform: uppercase;
    position: sticky;
    top: 0;
    z-index: ${Z_INDEX_KYBER_AI.HEADER_TABLE_TOKENS};
    border-radius: 19px 19px 0 0;

    ${({ theme }) => css`
      background-color: ${theme.tableHeader};
      color: ${theme.subText};
    `};

    @media only screen and (max-width: 768px) {
      border-radius: 0;
    }

    th {
      border: none;
      outline: none;
      white-space: nowrap;
      font-weight: 400 !important;
      color: ${({ theme }) => theme.subText} !important;
      font-size: 12px;
      background-color: ${({ theme }) => theme.tableHeader};
      cursor: pointer;

      :hover {
        color: ${({ theme }) => theme.text} !important;
      }
    }
    tr {
      height: 48px;
    }
  }

  tr {
    height: 80px;
    font-size: 14px;
    content-visibility: auto;
    contain-intrinsic-height: 80px;
    border-radius: 0;
    cursor: pointer;
    transition: background-color 0.1s linear;
    ${({ theme }) => css`
      td {
        background-color: ${theme.background};
      }
      color: ${theme.text};
      border-bottom: 1px solid ${theme.border};

      :hover td {
        background-color: ${theme.buttonGray};
      }
    `};

    td,
    th {
      padding: 10px 16px;
      text-align: center;
    }

    td:nth-child(1),
    th:nth-child(1),
    td:nth-child(2),
    th:nth-child(2) {
      position: sticky;
      z-index: 2;
    }
    td:nth-child(1),
    th:nth-child(1) {
      left: -1px;
    }
    td:nth-child(2),
    th:nth-child(2) {
      left: 34px;
    }
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    tr {
      td, th {
        padding: 8px 10px;
      }
    }
  `}

  .table-cell-shadow-right::before {
    box-shadow: inset 10px 0 8px -8px #00000099;
    position: absolute;
    top: 0;
    right: 0;
    bottom: -1px;
    width: 30px;
    transform: translate(100%);
    transition: box-shadow 0.5s;
    content: '';
    pointer-events: none;
  }
`

const ActionButton = styled.button<{ color: string }>`
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  border: none;
  border-radius: 50vh;
  cursor: pointer;
  transition: all 0.1s ease;
  ${({ theme, color }) => css`
    color: ${color || theme.primary};
    background-color: ${color ? rgba(color, 0.2) : rgba(theme.primary, 0.2)};
    :focus {
      box-shadow: 0 0 0 1pt ${color ? rgba(color, 0.2) : rgba(theme.primary, 0.2)};
    }
  `}
  :hover {
    filter: brightness(1.2);
  }
  gap: 4px;
`

const TabWrapper = styled(motion.div)`
  overflow: auto;
  cursor: grab;
  display: inline-flex;
  width: fit-content;
  position: relative;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  min-width: 100%;
  > * {
    flex: 1 0 fit-content;
    scroll-snap-align: start;
  }
  &.no-scroll {
    scroll-snap-type: unset;
    scroll-behavior: unset;
    > * {
      scroll-snap-align: unset;
    }
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
    min-width: initial;
    flex: 1;
  `}
`

const tokenTypeList: {
  type: KyberAIListType
  icon?: ICON_ID
  tooltip?: (theme: DefaultTheme) => ReactNode
  title: string
}[] = [
  { type: KyberAIListType.MYWATCHLIST, icon: 'star', title: t`My Watchlist` },
  { type: KyberAIListType.ALL, title: t`All` },
  {
    type: KyberAIListType.BULLISH,
    title: t`Bullish`,
    icon: 'bullish',
    tooltip: theme => (
      <span>
        Tokens with the highest chance of price <span style={{ color: theme.text }}>increase</span> in the next 24H
        (highest KyberScore)
      </span>
    ),
  },
  {
    type: KyberAIListType.BEARISH,
    title: t`Bearish`,
    icon: 'bearish',
    tooltip: theme => (
      <span>
        Tokens with the highest chance of price <span style={{ color: theme.text }}>decrease</span> in the next 24H
        (lowest KyberScore)
      </span>
    ),
  },
  {
    type: KyberAIListType.KYBERSWAP_DELTA,
    title: t`Kyberscore Delta`,
    icon: 'bearish',
    tooltip: theme => (
      <span>
        Tokens with a <span style={{ color: theme.text }}>significant change in KyberScore</span> between two
        consecutive time periods. This may indicate a change in trend of the token
      </span>
    ),
  },
  {
    type: KyberAIListType.TOP_CEX_INFLOW,
    title: t`Top CEX Positive Netflow`,
    icon: 'download',
    tooltip: theme => (
      <span>
        Tokens with the highest <span style={{ color: theme.text }}>net deposits</span> to Centralized Exchanges in the
        last 3 Days. Possible incoming sell pressure
      </span>
    ),
  },
  {
    type: KyberAIListType.TOP_CEX_OUTFLOW,
    title: t`Top CEX Negative Netflow`,
    icon: 'upload',
    tooltip: theme => (
      <span>
        Tokens with the highest <span style={{ color: theme.text }}>net withdrawals</span> from Centralized Exchanges in
        the last 3 Days. Possible buy pressure
      </span>
    ),
  },
  {
    type: KyberAIListType.FUNDING_RATE,
    title: t`Funding Rates`,
    icon: 'coin-bag',
    tooltip: () => (
      <span>
        Tokens with funding rates on centralized exchanges. Positive funding rate suggests traders are bullish and
        vice-versa for negative funding rates. Extremely positive or negative funding rates may result in leveraged
        positions getting squeezed.
      </span>
    ),
  },
  {
    type: KyberAIListType.TOP_TRADED,
    title: t`Top Traded`,
    icon: 'coin-bag',
    tooltip: theme => (
      <span>
        Tokens with the <span style={{ color: theme.text }}>highest 24H trading volume</span>
      </span>
    ),
  },
  {
    type: KyberAIListType.TRENDING_SOON,
    title: t`Trending Soon`,
    icon: 'trending-soon',
    tooltip: theme => (
      <span>
        Tokens that could be <span style={{ color: theme.text }}>trending</span> in the near future. Trending indicates
        interest in a token - it doesnt imply bullishness or bearishness
      </span>
    ),
  },
  {
    type: KyberAIListType.TRENDING,
    title: t`Currently Trending`,
    icon: 'flame',
    tooltip: theme => (
      <span>
        Tokens that are <span style={{ color: theme.text }}>currently trending</span> in the market
      </span>
    ),
  },
]

const ARROW_SIZE = 40
const TokenListDraggableTabs = ({ tab, setTab }: { tab: KyberAIListType; setTab: (type: KyberAIListType) => void }) => {
  const theme = useTheme()
  const mixpanelHandler = useMixpanelKyberAI()
  const [showScrollRightButton, setShowScrollRightButton] = useState(false)
  const [scrollLeftValue, setScrollLeftValue] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const tabListRef = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    wrapperRef.current?.scrollTo({ left: scrollLeftValue, behavior: 'smooth' })
  }, [scrollLeftValue])

  useEffect(() => {
    const wRef = wrapperRef.current
    if (!wRef) return
    const handleWheel = (e: any) => {
      e.preventDefault()
      setScrollLeftValue(prev => Math.min(Math.max(prev + e.deltaY, 0), wRef.scrollWidth - wRef.clientWidth))
    }
    if (wRef) {
      wRef.addEventListener('wheel', handleWheel)
    }
    return () => wRef?.removeEventListener('wheel', handleWheel)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setShowScrollRightButton(
        Boolean(wrapperRef.current?.clientWidth && wrapperRef.current?.clientWidth < wrapperRef.current?.scrollWidth),
      )
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const indexActive = tokenTypeList.findIndex(e => e.type === tab)

  return (
    <Row gap="8px" style={{ position: 'relative' }}>
      <TabWrapper
        ref={wrapperRef}
        onScrollCapture={e => e.preventDefault()}
        style={{ paddingRight: showScrollRightButton ? ARROW_SIZE : undefined }}
      >
        {tokenTypeList.map(({ type, title, tooltip }, index) => {
          const props = {
            onClick: () => {
              mixpanelHandler(MIXPANEL_TYPE.KYBERAI_RANKING_CATEGORY_CLICK, {
                from_cate: KYBERAI_LISTYPE_TO_MIXPANEL[tab],
                to_cate: KYBERAI_LISTYPE_TO_MIXPANEL[type],
                source: KYBERAI_LISTYPE_TO_MIXPANEL[tab],
              })
              setTab(type)
              if (!wrapperRef.current) return
              const tabRef = tabListRef.current[index]
              const wRef = wrapperRef.current
              if (tabRef.offsetLeft < wRef.scrollLeft) {
                setScrollLeftValue(tabRef.offsetLeft)
              }
              if (wRef.scrollLeft + wRef.clientWidth < tabRef.offsetLeft + tabRef.offsetWidth) {
                setScrollLeftValue(tabRef.offsetLeft + tabRef.offsetWidth - wRef.offsetWidth)
              }
            },
          }
          return (
            <SimpleTooltip key={type} text={tooltip?.(theme)} delay={500} hideOnMobile>
              <TabButton
                separator={index !== 0 && index !== indexActive + 1}
                text={title}
                active={tab === type}
                key={type}
                style={{ fontSize: '14px', padding: '0 12px' }}
                {...props}
                ref={el => {
                  if (el) {
                    tabListRef.current[index] = el
                  }
                }}
              />
            </SimpleTooltip>
          )
        })}
      </TabWrapper>
      {showScrollRightButton && (
        <DropdownSVG
          style={{
            transform: 'rotate(-90deg)',
            cursor: 'pointer',
            flexShrink: '0',
            position: 'absolute',
            background: theme.background,
            color: theme.text,
            right: 0,
            top: 0,
            padding: 6,
            height: ARROW_SIZE,
            width: ARROW_SIZE,
          }}
          onClick={() => {
            setScrollLeftValue(prev => prev + 120)
          }}
        />
      )}
    </Row>
  )
}

const TokenRow = React.memo(function TokenRow({
  token,
  currentTab,
  index,
  isScrolling,
  listType,
}: {
  token: ITokenList
  currentTab: KyberAIListType
  index: number
  isScrolling?: boolean
  listType: KyberAIListType
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const mixpanelHandler = useMixpanelKyberAI()
  const theme = useTheme()
  const [showSwapMenu, setShowSwapMenu] = useState(false)

  const rowRef = useRef<HTMLTableRowElement>(null)

  useOnClickOutside(rowRef, () => setShowSwapMenu(false))
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)

  const hasMutipleChain = token.tokens.length > 1

  const handleRowClick = () => {
    navigate(
      `${APP_PATHS.KYBERAI_EXPLORE}/${token.asset_id}?chain=${token.tokens[0].chain}&address=${token.tokens[0].address}`,
      {
        state: { from: location },
      },
    )
  }

  const latestKyberScore: IKyberScoreChart | undefined = token?.ks_3d?.[token.ks_3d.length - 1]
  return (
    <tr key={token.asset_id} ref={rowRef} onClick={handleRowClick} style={{ position: 'relative' }}>
      <td>
        <RowFit gap="6px">
          <WatchlistButton size={above768 ? 20 : 16} assetId={token.asset_id} symbol={token.symbol} />
          {above768 ? index : <></>}
        </RowFit>
      </td>
      <td className={isScrolling ? 'table-cell-shadow-right' : ''}>
        <Row gap="8px">
          <div
            style={{
              position: 'relative',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              overflow: 'hidden',
            }}
          >
            <img
              alt="tokenInList"
              src={token.tokens[0].logo}
              width="36px"
              height="36px"
              loading="lazy"
              style={{ background: 'white' }}
            />
          </div>

          <Column gap="8px" style={{ cursor: 'pointer', alignItems: 'flex-start' }}>
            <Text style={{ textTransform: 'uppercase' }}>{token.symbol}</Text>{' '}
            <TokenListVariants tokens={token.tokens} />
          </Column>
        </Row>
      </td>
      <td>
        <Column style={{ alignItems: 'center', width: '110px' }}>
          <SmallKyberScoreMeter data={latestKyberScore} />
          <Text
            color={calculateValueToColor(latestKyberScore?.kyber_score || 0, theme)}
            fontSize="14px"
            fontWeight={500}
          >
            {latestKyberScore?.tag || 'Not Applicable'}
          </Text>
        </Column>
      </td>
      <td>
        <KyberScoreChart data={token.ks_3d} index={index} />
      </td>
      <td>
        <Column gap="10px" style={{ textAlign: 'left' }}>
          <Text>${formatTokenPrice(token.price)}</Text>
          <Text fontSize={12} color={token.percent_change_24h > 0 ? theme.primary : theme.red}>
            <Row gap="2px">
              <ChevronIcon
                rotate={token.percent_change_24h > 0 ? '180deg' : '0deg'}
                color={token.percent_change_24h > 0 ? theme.primary : theme.red}
              />
              {Math.abs(token.percent_change_24h).toFixed(2)}%
            </Row>
          </Text>
        </Column>
      </td>
      <td style={{ textAlign: 'start' }}>
        <TokenChart data={token['7daysprice']} index={index} />
      </td>
      <td style={{ textAlign: 'start' }}>
        $
        {currentTab === KyberAIListType.TOP_CEX_INFLOW
          ? formatLocaleStringNum(token.cex_inflow_24h - token.cex_outflow_24h) || '--'
          : currentTab === KyberAIListType.TOP_CEX_OUTFLOW
          ? formatLocaleStringNum(token.cex_outflow_24h - token.cex_inflow_24h) || '--'
          : formatLocaleStringNum(token.volume_24h) || '--'}
      </td>
      {[KyberAIListType.TOP_CEX_INFLOW, KyberAIListType.TOP_CEX_OUTFLOW, KyberAIListType.TRENDING_SOON].includes(
        currentTab,
      ) && (
        <td style={{ textAlign: 'start' }}>
          {currentTab === KyberAIListType.TOP_CEX_INFLOW
            ? '$' + formatLocaleStringNum(token.cex_netflow_3days || 0) || '--'
            : currentTab === KyberAIListType.TOP_CEX_OUTFLOW
            ? '$' + formatLocaleStringNum(token.cex_netflow_3days || 0) || '--'
            : currentTab === KyberAIListType.TRENDING_SOON
            ? token.discovered_on
              ? dayjs(token.discovered_on * 1000).format('DD/MM/YYYY')
              : '--'
            : '--'}
        </td>
      )}
      <td>
        <Row gap="6px" justify={'flex-end'}>
          <SimpleTooltip text={t`Explore`}>
            <ActionButton
              color={theme.subText}
              onClick={e => {
                e.stopPropagation()
                mixpanelHandler(MIXPANEL_TYPE.KYBERAI_RANKING_ACTION_CLICK, {
                  token_name: token.symbol?.toUpperCase(),
                  source: KYBERAI_LISTYPE_TO_MIXPANEL[listType],
                  option: 'explore',
                })
                navigate(
                  `${APP_PATHS.KYBERAI_EXPLORE}/${token.asset_id}?chain=${token.tokens[0].chain}&address=${token.tokens[0].address}`,
                  {
                    state: { from: location },
                  },
                )
              }}
            >
              <Icon id="truesight-v2" size={16} />
            </ActionButton>
          </SimpleTooltip>
          <SimpleTooltip text={t`Swap`}>
            <ActionButton
              color={theme.primary}
              onClick={e => {
                e.stopPropagation()
                mixpanelHandler(MIXPANEL_TYPE.KYBERAI_RANKING_ACTION_CLICK, {
                  token_name: token.symbol?.toUpperCase(),
                  source: KYBERAI_LISTYPE_TO_MIXPANEL[listType],
                  option: 'swap',
                })
                if (hasMutipleChain) {
                  setShowSwapMenu(true)
                } else {
                  navigateToSwapPage(token.tokens[0])
                }
              }}
            >
              <Icon id="swap" size={16} />
            </ActionButton>
          </SimpleTooltip>
          {hasMutipleChain && (
            <>
              <MultipleChainDropdown
                show={showSwapMenu}
                tokens={token?.tokens}
                onChainClick={(chain, address) => {
                  if (chain && address) {
                    navigateToSwapPage({ chain, address })
                  }
                }}
              />
            </>
          )}
        </Row>
      </td>
    </tr>
  )
})
const LoadingRowSkeleton = ({ hasExtraCol }: { hasExtraCol?: boolean }) => {
  return (
    <>
      {[
        ...Array(10)
          .fill(0)
          .map((_, index) => (
            <tr key={index}>
              <td>
                <Skeleton></Skeleton>
              </td>
              <td>
                <Skeleton></Skeleton>
              </td>
              <td>
                <Skeleton></Skeleton>
              </td>
              <td colSpan={hasExtraCol ? 5 : 4}>
                <Skeleton></Skeleton>
              </td>
              <td>
                <Skeleton></Skeleton>
              </td>
            </tr>
          )),
      ]}
    </>
  )
}

enum SORT_FIELD {
  NAME = 'tvl',
  KYBER_SCORE = 'apr',
  PRICE = 'volume',
  VOLUME_24H = 'fee',
  NETFLOW_3D = 'my_liquidity',
  FIRST_DISCOVER_ON = 'my_liquidity',
  FUNDING_RATe = 'fd',
}

const formatParamsFromUrl = (searchParams: URLSearchParams) => {
  const { page, listType, ...filter } = Object.fromEntries(searchParams)
  return {
    page: +page || 1,
    listTypeParam: (listType as KyberAIListType) || KyberAIListType.BULLISH,
    filter,
  }
}
const pageSize = 25

export default function TokenAnalysisList() {
  const theme = useTheme()
  const mixpanelHandler = useMixpanelKyberAI()
  const [showShare, setShowShare] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)
  const [listType, setListType] = useState(KyberAIListType.BULLISH)
  const [, startTransition] = useTransition()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)
  const isMobile = useMedia(`(max-width:${SIZE_MOBILE})`)

  const [searchParams, setSearchParams] = useSearchParams()
  const { page, listTypeParam, filter } = useMemo(() => formatParamsFromUrl(searchParams), [searchParams])

  const queryParams = useMemo(() => {
    const params: QueryTokenParams = { page, pageSize, ...filter }
    if (listTypeParam === KyberAIListType.MYWATCHLIST) {
      params.watchlist = true
      params.type = KyberAIListType.ALL
    } else {
      params.type = listTypeParam
    }
    return params
  }, [page, listTypeParam, filter])

  const { data, isLoading, isFetching, isError } = useTokenListQuery(queryParams)
  const listData = data?.data || []

  const kyberscoreCalculateAt = useMemo(() => {
    const listData = data?.data || []
    const timestamps = listData.map(token => {
      const latestKyberScore: IKyberScoreChart | undefined = token?.ks_3d?.[token.ks_3d.length - 1]
      return latestKyberScore?.created_at || 0
    })
    return Math.max(...timestamps, 0)
  }, [data])

  const handleTabChange = (tab: KyberAIListType) => {
    startTransition(() => {
      searchParams.set('listType', tab)
      searchParams.set('page', '1')
      setSearchParams(searchParams)
    })
  }
  const handleFilterChange = useCallback(
    (filter: Record<string, string>) => {
      Object.entries(filter).forEach(([key, value]) => {
        value === '' || value === undefined ? searchParams.delete(key) : searchParams.set(key, value)
      })
      searchParams.set('page', '1')
      setSearchParams(searchParams)
    },
    [searchParams, setSearchParams],
  )

  const handlePageChange = (page: number) => {
    searchParams.set('page', page.toString())
    setSearchParams(searchParams)
  }
  const onTrackingSelectChain = useCallback(
    (network: string) => {
      mixpanelHandler(MIXPANEL_TYPE.KYBERAI_RANKING_SWITCH_CHAIN_CLICK, {
        source: KYBERAI_LISTYPE_TO_MIXPANEL[listType],
        network,
      })
    },
    [listType, mixpanelHandler],
  )

  useEffect(() => {
    if (wrapperRef.current && tableRef.current) {
      const onScroll = () => {
        if (tableRef.current?.getBoundingClientRect().x === 0) {
          setIsScrolling(false)
        } else {
          setIsScrolling(true)
        }
      }
      const el = wrapperRef.current
      el?.addEventListener('scroll', onScroll)

      return () => {
        el?.removeEventListener('scroll', onScroll)
      }
    }
    return
  }, [])

  useEffect(() => {
    if (!isFetching) {
      setListType(listTypeParam)
    }
  }, [isFetching, listTypeParam])

  const isCexFlowTabs = [
    KyberAIListType.TOP_CEX_INFLOW,
    KyberAIListType.TOP_CEX_OUTFLOW,
    KyberAIListType.TRENDING_SOON,
  ].includes(listType)

  const [sortType, setSortType] = useState<SORT_FIELD>()
  const [sortDirection, setSortDirection] = useState(SORT_DIRECTION.DESC)
  const SortArrow = ({ type }: { type: SORT_FIELD }) => {
    return sortType === type && sortDirection === SORT_DIRECTION.DESC ? <ArrowUp size={16} /> : <ArrowDown size={16} />
  }
  const onChangeSort = (sort: SORT_FIELD) => {
    setSortType(sort)
    setSortDirection(sortDirection === SORT_DIRECTION.DESC ? SORT_DIRECTION.ASC : SORT_DIRECTION.DESC)
  }

  return (
    <>
      <TradeInfoWrapper>
        <Text fontSize="12px" color={theme.subText} fontWeight={500}>
          <Trans>Rankings will be updated every 4 hours</Trans>
        </Text>
        <Text fontSize="12px" color={theme.subText} fontStyle="italic">
          <Trans>Disclaimer: The information here should not be treated as any form of financial advice</Trans>
        </Text>
      </TradeInfoWrapper>
      <ListTokenWrapper>
        <TokenListDraggableTabs tab={listTypeParam} setTab={handleTabChange} />

        <TokenFilter
          defaultFilter={filter}
          handleFilterChange={handleFilterChange}
          setShowShare={setShowShare}
          onTrackingSelectChain={onTrackingSelectChain}
        />

        <Column gap="0px" style={{ position: 'relative' }}>
          {isFetching && (
            <div
              style={{
                position: 'absolute',
                inset: '0 0 0 0',
                background: theme.background,
                opacity: 0.8,
                zIndex: Z_INDEX_KYBER_AI.LOADING_TOKENS_TABLE,
                borderRadius: isMobile ? 0 : '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AnimatedLoader />
            </div>
          )}
          <TableWrapper ref={wrapperRef}>
            <Table ref={tableRef}>
              <colgroup>
                <col style={{ width: '80px', minWidth: '40px' }} />
                <col style={{ width: '220px', minWidth: 'fit-content' }} />
                <col style={{ width: '200px', minWidth: 'auto' }} />
                <col style={{ width: '230px', minWidth: 'auto' }} />
                <col style={{ width: '250px', minWidth: 'auto' }} />
                <col style={{ width: '250px', minWidth: 'auto' }} />
                {isCexFlowTabs && <col style={{ width: '150px', minWidth: 'auto' }} />}
                <col style={{ width: '150px', minWidth: 'auto' }} />
                <col style={{ width: '200px', minWidth: 'auto' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>#</th>
                  <th
                    style={{ textAlign: 'left' }}
                    className={isScrolling ? 'table-cell-shadow-right' : ''}
                    onClick={() => onChangeSort(SORT_FIELD.NAME)}
                  >
                    <Row gap="4px">
                      <Trans>Token name</Trans>
                      <SortArrow type={SORT_FIELD.NAME} />
                    </Row>
                  </th>
                  <th style={{ textAlign: 'left' }} onClick={() => onChangeSort(SORT_FIELD.KYBER_SCORE)}>
                    <Column gap="4px">
                      <Row justify="flex-start" gap="4px">
                        <Column gap="2px">
                          <SimpleTooltip
                            text={
                              <span>
                                KyberScore uses AI to measure the upcoming trend of a token (bullish or bearish) by
                                taking into account multiple on-chain and off-chain indicators. The score ranges from 0
                                to 100. Higher the score, more bullish the token in the short-term. Read more{' '}
                                <a href="https://docs.kyberswap.com/kyberswap-solutions/kyberai/concepts/kyberscore">
                                  here ↗
                                </a>
                              </span>
                            }
                            delay={200}
                          >
                            <TextDotted>
                              <Trans>Kyberscore</Trans>
                            </TextDotted>
                          </SimpleTooltip>
                          <Text as="small" fontSize={'10px'} sx={{ textTransform: 'none' }}>
                            At {kyberscoreCalculateAt ? dayjs(kyberscoreCalculateAt * 1000).format('hh:mm A') : '--'}
                          </Text>
                        </Column>
                        <SortArrow type={SORT_FIELD.KYBER_SCORE} />
                      </Row>
                    </Column>
                  </th>
                  <th style={{ textAlign: 'left' }}>
                    <Text>
                      <Trans>Last 3D KyberScores</Trans>
                    </Text>
                  </th>
                  <th onClick={() => onChangeSort(SORT_FIELD.PRICE)}>
                    <Row justify="flex-start" gap="4px">
                      <Trans>Current Price</Trans>
                      <SortArrow type={SORT_FIELD.PRICE} />
                    </Row>
                  </th>
                  <th>
                    <Row justify="flex-start">
                      <Trans>Last 7d price</Trans>
                    </Row>
                  </th>
                  <th onClick={() => onChangeSort(SORT_FIELD.VOLUME_24H)}>
                    <Row justify="flex-start" gap="4px">
                      <Trans>
                        {{
                          [KyberAIListType.TOP_CEX_INFLOW]: '24h Netflow',
                          [KyberAIListType.TOP_CEX_OUTFLOW]: '24h Netflow',
                        }[listType as string] || '24h Volume'}
                      </Trans>
                    </Row>
                  </th>
                  {isCexFlowTabs && (
                    <th onClick={() => onChangeSort(SORT_FIELD.FIRST_DISCOVER_ON)}>
                      <Row justify="flex-start" gap="4px">
                        <Trans>
                          {{
                            [KyberAIListType.TOP_CEX_INFLOW]: '3D Netflow',
                            [KyberAIListType.TOP_CEX_OUTFLOW]: '3D Netflow',
                            [KyberAIListType.TRENDING_SOON]: 'First Discovered On',
                          }[listType as string] || ''}
                        </Trans>
                        <SortArrow type={SORT_FIELD.FIRST_DISCOVER_ON} />
                      </Row>
                    </th>
                  )}
                  <th style={{ textAlign: 'end' }}>
                    <Trans>Action</Trans>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <SkeletonTheme
                    baseColor={theme.border}
                    height="28px"
                    borderRadius={'8px'}
                    direction="ltr"
                    duration={1.5}
                    highlightColor={theme.tabActive}
                  >
                    <LoadingRowSkeleton hasExtraCol={isCexFlowTabs} />
                  </SkeletonTheme>
                ) : isError || listData.length === 0 ? (
                  <>
                    {above768 ? (
                      <tr>
                        <td colSpan={isCexFlowTabs ? 9 : 8} height={200} style={{ pointerEvents: 'none' }}>
                          <Text>
                            {listType === KyberAIListType.MYWATCHLIST && listData.length === 0 ? (
                              <Trans>You haven&apos;t added any tokens to your watchlist yet</Trans>
                            ) : (
                              <Trans>There was an error. Please try again later.</Trans>
                            )}
                          </Text>
                        </td>
                      </tr>
                    ) : (
                      <tr style={{ height: '201px' }}>
                        <Row
                          style={{
                            position: 'absolute',
                            height: '200px',
                            justifyContent: 'center',
                            backgroundColor: theme.background,
                          }}
                        >
                          <Text>
                            {listType === KyberAIListType.MYWATCHLIST && listData.length === 0 ? (
                              <Trans>You haven&apos;t added any tokens to your watchlist yet</Trans>
                            ) : (
                              <Trans>There was an error. Please try again later.</Trans>
                            )}
                          </Text>
                        </Row>
                      </tr>
                    )}
                  </>
                ) : (
                  listData.map((token: ITokenList, index: number) => (
                    <TokenRow
                      token={token}
                      key={token.asset_id + '_' + (pageSize * (page - 1) + index + 1)}
                      currentTab={listType}
                      index={pageSize * (page - 1) + index + 1}
                      isScrolling={isScrolling}
                      listType={listType}
                    />
                  ))
                )}
              </tbody>
            </Table>
          </TableWrapper>
          <PaginationWrapper>
            {!isError && (
              <Pagination
                totalCount={data?.totalItems || 10}
                pageSize={pageSize}
                currentPage={page}
                onPageChange={(page: number) => {
                  window.scroll({ top: 0 })
                  handlePageChange(page)
                }}
                style={{ flex: 1 }}
              />
            )}
          </PaginationWrapper>
        </Column>
        <KyberAIShareModal
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          content={mobileMode => <TokenAnalysisListShareContent data={data?.data || []} mobileMode={mobileMode} />}
          onShareClick={social =>
            mixpanelHandler(MIXPANEL_TYPE.KYBERAI_SHARE_TOKEN_CLICK, {
              token_name: 'share_list_token',
              network: filter.chains || 'all',
              source: KYBERAI_LISTYPE_TO_MIXPANEL[listType],
              share_via: social,
            })
          }
        />
        <FeedbackSurvey />
      </ListTokenWrapper>
    </>
  )
}
