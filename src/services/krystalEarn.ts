import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export enum EarnSupportedProtocols {
  UNISWAP_V3 = 'Uniswap V3',
  PANCAKESWAP_V3 = 'PancakeSwap V3',
  SUSHISWAP_V3 = 'SushiSwap V3',
}
export const earnSupportedChains = [ChainId.MAINNET, ChainId.BASE]
export const earnSupportedProtocols = [
  EarnSupportedProtocols.UNISWAP_V3,
  EarnSupportedProtocols.PANCAKESWAP_V3,
  EarnSupportedProtocols.SUSHISWAP_V3,
]

export enum PositionStatus {
  IN_RANGE = 'IN_RANGE',
  OUT_RANGE = 'OUT_RANGE',
}

export interface PositionAmount {
  token: {
    address: string
    symbol: string
    name: string
    decimals: number
    logo: string
    tag: string
    price: number
  }
  tokenType: string
  tokenID: string
  balance: string
  quotes: {
    usd: {
      symbol: string
      marketPrice: number
      price: number
      priceChange24hPercentage: number
      value: number
      timestamp: number
    }
  }
}

export interface EarnPosition {
  [x: string]: any
  chainName: 'eth'
  chainId: number
  chainLogo: string
  userAddress: string
  id: string
  tokenAddress: string
  tokenId: string
  liquidity: string
  minPrice: number
  maxPrice: number
  currentAmounts: Array<PositionAmount>
  providedAmounts: Array<PositionAmount>
  feePending: Array<PositionAmount>
  feesClaimed: Array<PositionAmount>
  farmRewardsPending: Array<PositionAmount>
  farmRewardsClaimed: Array<PositionAmount>
  feeEarned24h: Array<PositionAmount>
  farmReward24h: Array<PositionAmount>
  createdTime: number
  lastUpdateBlock: number
  openedBlock: number
  openedTime: number
  closedBlock: number
  closedTime: number
  closedPrice: number
  farming: boolean
  impermanentLoss: number
  apr: number
  feeApr: number
  farmApr: number
  pnl: number
  initialUnderlyingValue: number
  currentUnderlyingValue: number
  currentPositionValue: number
  compareWithHodl: number
  returnOnInvestment: number
  totalDepositValue: number
  totalWithdrawValue: number
  yesterdayEarning: number
  earning24h: number
  status: PositionStatus
  avgConvertPrice: number
  isConvertedFromToken0: boolean
  gasUsed: number
  isSupportAutomation: boolean
  hasAutomationOrder: boolean
  pool: {
    id: string
    poolAddress: string
    price: number
    tokenAmounts: Array<PositionAmount>
    farmRewardTokens: Array<PositionAmount>
    fees: Array<number>
    rewards24h: Array<PositionAmount>
    tickSpacing: number
    project: string
    projectLogo: string
    projectAddress: string
    showWarning: boolean
    tvl: number
    farmAddress: string
    tag: string
  }
}

export interface PositionEarning {
  date: string
  timestamp: number
  totalFeeEarning: number
  totalFarmEarning: number
  totalEarning: number
  earningByDay: number
}

const krystalEarnServiceApi = createApi({
  reducerPath: 'krystalEarnServiceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api.krystal.app/all',
  }),
  keepUnusedDataFor: 1,
  endpoints: builder => ({
    userPosition: builder.query<Array<EarnPosition>, { addresses: string; positionId?: string }>({
      query: params => ({
        url: `/v1/lp/userPositions`,
        params: {
          ...params,
          chainIds: earnSupportedChains,
          protocols: earnSupportedProtocols,
          quoteSymbol: 'usd',
          offset: 0,
          orderBy: 'liquidity',
          orderASC: false,
          positionStatus: 'open',
        },
      }),
      transformResponse: (response: { positions: Array<EarnPosition> }) => response.positions,
    }),
    positionEarningStatistics: builder.query<
      Array<PositionEarning>,
      { tokenAddress: string; tokenId: string; chainId: string | number }
    >({
      query: params => ({
        url: `/v1/balance/positionEarningStatistic`,
        params,
      }),
      transformResponse: (response: { data: Array<PositionEarning> }) => response.data,
    }),
  }),
})

export const { useUserPositionQuery, usePositionEarningStatisticsQuery } = krystalEarnServiceApi

export default krystalEarnServiceApi
