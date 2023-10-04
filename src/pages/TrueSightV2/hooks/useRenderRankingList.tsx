import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { ReactNode } from 'react'
import { ArrowDown, ArrowUp } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import Column from 'components/Column'
import Row from 'components/Row'
import { TextDotted } from 'components/Tooltip'
import { SORT_DIRECTION } from 'constants/index'

import ChevronIcon from '../components/ChevronIcon'
import SimpleTooltip from '../components/SimpleTooltip'
import SmallKyberScoreMeter from '../components/SmallKyberScoreMeter'
import TokenChart from '../components/TokenChartSVG'
import TokenListVariants from '../components/TokenListVariants'
import KyberScoreChart from '../components/chart/KyberScoreChart'
import { SORT_FIELD } from '../constants'
import { KyberAIListType } from '../types'
import {
  calculateValueToColor,
  colorFundingRateText,
  formatLocaleStringNum,
  formatTokenPrice,
  getTypeByKyberScore,
} from '../utils'

enum KyberAIListColumnType {
  TOKEN_NAME,
  KYBERSCORE,
  LAST_3D_KYBERSCORES,
  CURRENT_PRICE,
  LAST_7D_PRICE,
  VOLUME_24H,
  NETFLOW_24H,
  NETFLOW_3D,
  FIRST_DISCOVERED,
  KYBERSCORE_DELTA,
  FUNDING_RATES,
}

const configColumnsByListType: Record<KyberAIListType, KyberAIListColumnType[]> = {
  [KyberAIListType.MYWATCHLIST]: [
    KyberAIListColumnType.TOKEN_NAME,
    KyberAIListColumnType.KYBERSCORE,
    KyberAIListColumnType.LAST_3D_KYBERSCORES,
    KyberAIListColumnType.CURRENT_PRICE,
    KyberAIListColumnType.LAST_7D_PRICE,
    KyberAIListColumnType.VOLUME_24H,
  ],

  [KyberAIListType.ALL]: [
    KyberAIListColumnType.TOKEN_NAME,
    KyberAIListColumnType.KYBERSCORE,
    KyberAIListColumnType.LAST_3D_KYBERSCORES,
    KyberAIListColumnType.CURRENT_PRICE,
    KyberAIListColumnType.LAST_7D_PRICE,
    KyberAIListColumnType.VOLUME_24H,
  ],
  [KyberAIListType.BULLISH]: [
    KyberAIListColumnType.TOKEN_NAME,
    KyberAIListColumnType.KYBERSCORE,
    KyberAIListColumnType.LAST_3D_KYBERSCORES,
    KyberAIListColumnType.CURRENT_PRICE,
    KyberAIListColumnType.LAST_7D_PRICE,
    KyberAIListColumnType.VOLUME_24H,
  ],
  [KyberAIListType.BEARISH]: [
    KyberAIListColumnType.TOKEN_NAME,
    KyberAIListColumnType.KYBERSCORE,
    KyberAIListColumnType.LAST_3D_KYBERSCORES,
    KyberAIListColumnType.CURRENT_PRICE,
    KyberAIListColumnType.LAST_7D_PRICE,
    KyberAIListColumnType.VOLUME_24H,
  ],
  [KyberAIListType.KYBERSWAP_DELTA]: [
    KyberAIListColumnType.TOKEN_NAME,
    KyberAIListColumnType.KYBERSCORE,
    KyberAIListColumnType.LAST_3D_KYBERSCORES,
    KyberAIListColumnType.KYBERSCORE_DELTA,
    KyberAIListColumnType.CURRENT_PRICE,
    KyberAIListColumnType.LAST_7D_PRICE,
  ],
  [KyberAIListType.TOP_CEX_INFLOW]: [
    KyberAIListColumnType.TOKEN_NAME,
    KyberAIListColumnType.KYBERSCORE,
    KyberAIListColumnType.LAST_3D_KYBERSCORES,
    KyberAIListColumnType.CURRENT_PRICE,
    KyberAIListColumnType.LAST_7D_PRICE,
    KyberAIListColumnType.NETFLOW_24H,
    KyberAIListColumnType.NETFLOW_3D,
  ],
  [KyberAIListType.TOP_CEX_OUTFLOW]: [
    KyberAIListColumnType.TOKEN_NAME,
    KyberAIListColumnType.KYBERSCORE,
    KyberAIListColumnType.LAST_3D_KYBERSCORES,
    KyberAIListColumnType.CURRENT_PRICE,
    KyberAIListColumnType.LAST_7D_PRICE,
    KyberAIListColumnType.NETFLOW_24H,
    KyberAIListColumnType.NETFLOW_3D,
  ],
  [KyberAIListType.FUNDING_RATE]: [
    KyberAIListColumnType.TOKEN_NAME,
    KyberAIListColumnType.KYBERSCORE,
    KyberAIListColumnType.LAST_3D_KYBERSCORES,
    KyberAIListColumnType.CURRENT_PRICE,
    KyberAIListColumnType.FUNDING_RATES,
  ],

  [KyberAIListType.TOP_TRADED]: [
    KyberAIListColumnType.TOKEN_NAME,
    KyberAIListColumnType.KYBERSCORE,
    KyberAIListColumnType.LAST_3D_KYBERSCORES,
    KyberAIListColumnType.CURRENT_PRICE,
    KyberAIListColumnType.LAST_7D_PRICE,
    KyberAIListColumnType.VOLUME_24H,
  ],
  [KyberAIListType.TRENDING_SOON]: [
    KyberAIListColumnType.TOKEN_NAME,
    KyberAIListColumnType.KYBERSCORE,
    KyberAIListColumnType.LAST_3D_KYBERSCORES,
    KyberAIListColumnType.CURRENT_PRICE,
    KyberAIListColumnType.LAST_7D_PRICE,
    KyberAIListColumnType.VOLUME_24H,
    KyberAIListColumnType.FIRST_DISCOVERED,
  ],
  [KyberAIListType.TRENDING]: [
    KyberAIListColumnType.TOKEN_NAME,
    KyberAIListColumnType.KYBERSCORE,
    KyberAIListColumnType.LAST_3D_KYBERSCORES,
    KyberAIListColumnType.CURRENT_PRICE,
    KyberAIListColumnType.LAST_7D_PRICE,
    KyberAIListColumnType.VOLUME_24H,
  ],
}

const TableHeaderCell = styled.th<{ sortable?: boolean }>`
  border: none;
  outline: none;
  white-space: nowrap;
  font-weight: 400 !important;
  color: ${({ theme }) => theme.subText} !important;
  font-size: 12px;
  background-color: ${({ theme }) => theme.tableHeader};
  ${({ sortable }) =>
    sortable &&
    css`
      cursor: pointer;
      :hover {
        color: ${({ theme }) => theme.text} !important;
      }
    `}
`

const SortArrow = ({
  type,
  sortInfo,
}: {
  type: SORT_FIELD
  sortInfo: { field: SORT_FIELD | undefined; direction: SORT_DIRECTION }
}) => {
  if (sortInfo.field !== type) return null
  return sortInfo.direction === SORT_DIRECTION.DESC ? <ArrowDown size={16} /> : <ArrowUp size={16} />
}

const renderByColumnType: Record<
  KyberAIListColumnType,
  {
    col: () => ReactNode
    tableHeader: (params?: any) => ReactNode
    tableCell: (params?: any) => ReactNode
  }
> = {
  [KyberAIListColumnType.TOKEN_NAME]: {
    col: () => <col style={{ width: '220px', minWidth: 'fit-content' }} />,
    tableHeader: ({ isScrolling, onChangeSort, sortInfo }) => (
      <TableHeaderCell
        sortable
        style={{ textAlign: 'left' }}
        className={isScrolling ? 'table-cell-shadow-right' : ''}
        onClick={() => onChangeSort(SORT_FIELD.NAME)}
      >
        <Row gap="4px">
          <Trans>Token name</Trans>
          <SortArrow type={SORT_FIELD.NAME} sortInfo={sortInfo} />
        </Row>
      </TableHeaderCell>
    ),
    tableCell: ({ token, isScrolling }) => (
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
              src={token?.logo}
              width="36px"
              height="36px"
              loading="lazy"
              style={{ background: 'white' }}
            />
          </div>

          <Column gap="8px" style={{ cursor: 'pointer', alignItems: 'flex-start' }}>
            <Text style={{ textTransform: 'uppercase' }}>{token?.symbol}</Text>{' '}
            <TokenListVariants tokens={token?.addresses || []} />
          </Column>
        </Row>
      </td>
    ),
  },
  [KyberAIListColumnType.KYBERSCORE]: {
    col: () => <col style={{ width: '200px', minWidth: 'auto' }} />,
    tableHeader: ({ onChangeSort, kyberscoreCalculateAt, sortInfo }) => (
      <TableHeaderCell sortable style={{ textAlign: 'left' }} onClick={() => onChangeSort(SORT_FIELD.KYBER_SCORE)}>
        <Column gap="4px">
          <Row justify="flex-start" gap="4px">
            <Column gap="2px">
              <SimpleTooltip
                text={
                  <span>
                    KyberScore uses AI to measure the upcoming trend of a token (bullish or bearish) by taking into
                    account multiple on-chain and off-chain indicators. The score ranges from 0 to 100. Higher the
                    score, more bullish the token in the short-term. Read more{' '}
                    <a href="https://docs.kyberswap.com/kyberswap-solutions/kyberai/concepts/kyberscore">here ↗</a>
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
            <SortArrow type={SORT_FIELD.KYBER_SCORE} sortInfo={sortInfo} />
          </Row>
        </Column>
      </TableHeaderCell>
    ),
    tableCell: ({ theme, latestKyberScore }) => (
      <td>
        <Column style={{ alignItems: 'center', width: '110px' }}>
          <SmallKyberScoreMeter data={latestKyberScore} />
          <Text
            color={calculateValueToColor(latestKyberScore?.kyberScore || 0, theme)}
            fontSize="14px"
            fontWeight={500}
          >
            {latestKyberScore?.tag || 'Not Applicable'}
          </Text>
        </Column>
      </td>
    ),
  },
  [KyberAIListColumnType.LAST_3D_KYBERSCORES]: {
    col: () => <col style={{ width: '230px', minWidth: 'auto' }} />,
    tableHeader: () => (
      <TableHeaderCell style={{ textAlign: 'left' }}>
        <Text>
          <Trans>Last 3D KyberScores</Trans>
        </Text>
      </TableHeaderCell>
    ),
    tableCell: ({ token, index }) => (
      <td>
        <KyberScoreChart data={token?.kyberScore3D} index={index} />
      </td>
    ),
  },
  [KyberAIListColumnType.CURRENT_PRICE]: {
    col: () => <col style={{ width: '200px', minWidth: 'auto' }} />,
    tableHeader: ({ onChangeSort, sortInfo }) => (
      <TableHeaderCell sortable onClick={() => onChangeSort(SORT_FIELD.PRICE)}>
        <Row justify="flex-start" gap="4px">
          <Trans>Current Price</Trans>
          <SortArrow type={SORT_FIELD.PRICE} sortInfo={sortInfo} />
        </Row>
      </TableHeaderCell>
    ),
    tableCell: ({ token, theme }) => (
      <td>
        {token && (
          <Column gap="10px" style={{ textAlign: 'left' }}>
            <Text>${formatTokenPrice(token.price)}</Text>
            <Text fontSize={12} color={token.priceChange24H > 0 ? theme.primary : theme.red}>
              <Row gap="2px">
                <ChevronIcon
                  rotate={token.priceChange24H > 0 ? '180deg' : '0deg'}
                  color={token.priceChange24H > 0 ? theme.primary : theme.red}
                />
                {Math.abs(token.priceChange24H).toFixed(2)}%
              </Row>
            </Text>
          </Column>
        )}
      </td>
    ),
  },
  [KyberAIListColumnType.LAST_7D_PRICE]: {
    col: () => <col style={{ width: '200px', minWidth: 'auto' }} />,
    tableHeader: () => (
      <TableHeaderCell>
        <Row justify="flex-start">
          <Trans>Last 7d price</Trans>
        </Row>
      </TableHeaderCell>
    ),
    tableCell: ({ token, index }) => (
      <td style={{ textAlign: 'start' }}>
        <TokenChart data={token?.weekPrices} index={index} />
      </td>
    ),
  },
  [KyberAIListColumnType.VOLUME_24H]: {
    col: () => <col style={{ width: '150px', minWidth: 'auto' }} />,
    tableHeader: ({ onChangeSort, sortInfo }) => (
      <TableHeaderCell sortable onClick={() => onChangeSort(SORT_FIELD.VOLUME_24H)}>
        <Row justify="flex-start" gap="4px">
          <Trans>24h Volume</Trans>
          <SortArrow type={SORT_FIELD.VOLUME_24H} sortInfo={sortInfo} />
        </Row>
      </TableHeaderCell>
    ),
    tableCell: ({ token }) => (
      <td style={{ textAlign: 'start' }}>${token ? formatLocaleStringNum(token.volume24H) : '--'}</td>
    ),
  },
  [KyberAIListColumnType.NETFLOW_24H]: {
    col: () => <col style={{ width: '150px', minWidth: 'auto' }} />,
    tableHeader: ({ sortInfo, onChangeSort }) => (
      <TableHeaderCell sortable onClick={() => onChangeSort(SORT_FIELD.CEX_NETFLOW_24H)}>
        <Row justify="flex-start" gap="4px">
          <Trans>24h Netflow</Trans>
          <SortArrow type={SORT_FIELD.CEX_NETFLOW_24H} sortInfo={sortInfo} />
        </Row>
      </TableHeaderCell>
    ),
    tableCell: ({ token }) => (
      <td style={{ textAlign: 'start' }}>{formatLocaleStringNum(token?.cexNetflow24H || 0)}</td>
    ),
  },
  [KyberAIListColumnType.NETFLOW_3D]: {
    col: () => <col style={{ width: '150px', minWidth: 'auto' }} />,
    tableHeader: ({ sortInfo, onChangeSort }) => (
      <TableHeaderCell sortable onClick={() => onChangeSort(SORT_FIELD.CEX_NETFLOW_3D)}>
        <Row justify="flex-start" gap="4px">
          <Trans>3d Netflow</Trans>
          <SortArrow type={SORT_FIELD.CEX_NETFLOW_3D} sortInfo={sortInfo} />
        </Row>
      </TableHeaderCell>
    ),
    tableCell: ({ token }) => <td style={{ textAlign: 'start' }}>{formatLocaleStringNum(token?.cexNetflow3D || 0)}</td>,
  },
  [KyberAIListColumnType.FIRST_DISCOVERED]: {
    col: () => <col style={{ width: '150px', minWidth: 'auto' }} />,
    tableHeader: ({ onChangeSort, sortInfo }) => (
      <TableHeaderCell sortable onClick={() => onChangeSort(SORT_FIELD.FIRST_DISCOVER_ON)}>
        <Row justify="flex-start" gap="4px">
          <Trans>First Discovered</Trans>
          <SortArrow type={SORT_FIELD.FIRST_DISCOVER_ON} sortInfo={sortInfo} />
        </Row>
      </TableHeaderCell>
    ),
    tableCell: ({ token }) => (
      <td style={{ textAlign: 'start' }}>
        {token?.discoveredOn ? dayjs(token.discoveredOn * 1000).format('DD/MM/YYYY') : '--'}
      </td>
    ),
  },
  [KyberAIListColumnType.KYBERSCORE_DELTA]: {
    col: () => <col style={{ width: '240px', minWidth: 'auto' }} />,
    tableHeader: ({ sortInfo, onChangeSort }) => (
      <TableHeaderCell sortable onClick={() => onChangeSort(SORT_FIELD.KYBER_SCORE_DELTA)}>
        <Row justify="flex-start" gap="4px">
          <Trans>Kyberscore Delta</Trans>
          <SortArrow type={SORT_FIELD.KYBER_SCORE_DELTA} sortInfo={sortInfo} />
        </Row>
      </TableHeaderCell>
    ),
    tableCell: ({ token, theme }) => {
      const delta = token ? token.kyberScore - token.prevKyberScore : 0
      return (
        <td>
          <Row gap="8px">
            {delta > 0 ? <ArrowUp size={36} color={theme.primary} /> : <ArrowDown size={36} color={theme.red} />}
            <Column fontSize="14px" lineHeight="20px" alignItems="flex-start" fontWeight={500} gap="2px">
              <Text color={theme.subText}>{getTypeByKyberScore(token?.prevKyberScore || 50)}</Text>
              <Text color={calculateValueToColor(token?.kyberScore || 50, theme)}>
                {getTypeByKyberScore(token?.kyberScore || 50)}
              </Text>
            </Column>
          </Row>
        </td>
      )
    },
  },
  [KyberAIListColumnType.FUNDING_RATES]: {
    col: () => (
      <>
        <col style={{ width: '120px', minWidth: 'auto' }} />
        <col style={{ width: '120px', minWidth: 'auto' }} />
        <col style={{ width: '120px', minWidth: 'auto' }} />
      </>
    ),
    tableHeader: ({ theme }) => (
      <TableHeaderCell colSpan={3} align="left">
        <Column gap="6px">
          <Row justify="flex-start">
            <Trans>Funding Rates</Trans>
          </Row>
          <Row
            gap="24px"
            sx={{
              div: {
                flex: 1,
                textAlign: 'left',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: theme.text,
              },
              img: { width: '12px', height: '12px' },
            }}
          >
            <div>
              <img src="https://cdn.coinglasscdn.com/static/exchanges/270.png" />
              Binance
            </div>
            <div>
              <img src="https://cdn.coinglasscdn.com/static/exchanges/okx2.png" />
              OKX
            </div>
            <div>
              <img src="https://cdn.coinglasscdn.com/static/exchanges/bybit2.png" />
              Bybit
            </div>
          </Row>
        </Column>
      </TableHeaderCell>
    ),
    tableCell: ({ token, theme }) => (
      <>
        {['Binance', 'OKX', 'Bybit'].map((exname: string) => {
          const exchange = token?.fundingRateExtra?.uMarginList?.find((item: any) => item.exchangeName === exname)
          const rate = (exchange && exchange.rate) || 0
          return (
            <td key={exname} style={{ textAlign: 'start' }}>
              <Text color={colorFundingRateText(rate, theme)}>{rate.toFixed(4) + '%' || '--'}</Text>
            </td>
          )
        })}
      </>
    ),
  },
}

export default function useRenderRankingList() {
  const [searchParams] = useSearchParams()
  const listTypeParam = (searchParams.get('listType') as KyberAIListType) || KyberAIListType.BULLISH
  const columnsList = configColumnsByListType[listTypeParam]

  return {
    renderCol: () => columnsList.map(c => renderByColumnType[c].col()),
    renderTableHeader: (params?: any) => columnsList.map(c => renderByColumnType[c].tableHeader(params)),
    renderTableCell: (params: any) => columnsList.map(c => renderByColumnType[c].tableCell(params)),
  }
}
