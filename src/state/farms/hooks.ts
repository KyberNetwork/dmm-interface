import { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Contract } from '@ethersproject/contracts'
import { BigNumber } from '@ethersproject/bignumber'
import { Interface } from '@ethersproject/abi'

import { FARM_HISTORIES } from 'apollo/queries'
import { ChainId, Fraction, JSBI, Token, WETH } from '@dynamic-amm/sdk'
import FAIRLAUNCH_ABI from 'constants/abis/fairlaunch.json'
import FAIRLAUNCH_V2_ABI from 'constants/abis/fairlaunch-v2.json'
import { AppState } from 'state'
import { useAppDispatch } from 'state/hooks'
import { FairLaunchVersion, Farm, FarmHistoriesSubgraphResult, FarmHistory, FarmHistoryMethod } from 'state/farms/types'
import { setFarmsData, setLoading, setYieldPoolsError } from './actions'
import { useBlockNumber, useETHPrice, useExchangeClient, useTokensPrice } from 'state/application/hooks'
import { useActiveWeb3React } from 'hooks'
import useTokensMarketPrice from 'hooks/useTokensMarketPrice'
import { useFairLaunchContracts } from 'hooks/useContract'
import {
  DEFAULT_REWARDS,
  FAIRLAUNCH_ADDRESSES,
  FAIRLAUNCH_V2_ADDRESSES,
  MAX_ALLOW_APY,
  OUTSIDE_FAIRLAUNCH_ADDRESSES,
  ZERO_ADDRESS
} from '../../constants'
import { useAllTokens } from 'hooks/Tokens'
import { getBulkPoolData } from 'state/pools/hooks'
import { useMultipleContractSingleData } from 'state/multicall/hooks'
import { getTradingFeeAPR, useFarmApr } from 'utils/dmm'
import { isAddressString } from 'utils'
import useTokenBalance from 'hooks/useTokenBalance'
import { ethers } from 'ethers'

export const useRewardTokens = () => {
  const { chainId } = useActiveWeb3React()
  const rewardTokensMulticallResult = useMultipleContractSingleData(
    FAIRLAUNCH_ADDRESSES[chainId as ChainId],
    new Interface(FAIRLAUNCH_ABI),
    'getRewardTokens'
  )

  const rewardTokensV2MulticallResult = useMultipleContractSingleData(
    FAIRLAUNCH_V2_ADDRESSES[chainId as ChainId],
    new Interface(FAIRLAUNCH_V2_ABI),
    'getRewardTokens'
  )

  const defaultRewards = useMemo(() => {
    return DEFAULT_REWARDS[chainId as ChainId] || []
  }, [chainId])

  return useMemo(() => {
    let result: string[] = []

    rewardTokensMulticallResult.forEach(token => {
      if (token?.result?.[0]) {
        result = result.concat(token?.result?.[0].filter((item: string) => result.indexOf(item) < 0))
      }
    })

    rewardTokensV2MulticallResult.forEach(token => {
      if (token?.result?.[0]) {
        result = result.concat(token?.result?.[0].filter((item: string) => result.indexOf(item) < 0))
      }
    })

    return [...defaultRewards, ...result]
  }, [rewardTokensMulticallResult, rewardTokensV2MulticallResult, defaultRewards])
}

export const useRewardTokenPrices = (tokens: (Token | undefined)[]) => {
  const tokenPrices = useTokensPrice(tokens)
  const marketPrices = useTokensMarketPrice(tokens)

  return tokenPrices.map((price, index) => price || marketPrices[index] || 0)
}

export const useFarmsData = () => {
  const dispatch = useAppDispatch()
  const { chainId, account } = useActiveWeb3React()
  const fairLaunchContracts = useFairLaunchContracts()
  const ethPrice = useETHPrice()
  const allTokens = useAllTokens()
  const blockNumber = useBlockNumber()
  const currentTimestamp = Math.round(Date.now() / 1000)

  const apolloClient = useExchangeClient()
  const farmsData = useSelector((state: AppState) => state.farms.data)
  const loading = useSelector((state: AppState) => state.farms.loading)
  const error = useSelector((state: AppState) => state.farms.error)

  const latestRenderTime = useRef(0)
  useEffect(() => {
    async function getListFarmsForContract(contract: Contract): Promise<Farm[]> {
      const rewardTokenAddresses: string[] = await contract?.getRewardTokens()
      const poolLength = await contract?.poolLength()

      const pids = [...Array(BigNumber.from(poolLength).toNumber()).keys()]

      const isV2 = FAIRLAUNCH_V2_ADDRESSES[chainId as ChainId].includes(contract.address)
      const poolInfos = await Promise.all(
        pids.map(async (pid: number) => {
          const poolInfo = await contract?.getPoolInfo(pid)
          if (isV2) {
            return {
              ...poolInfo,
              accRewardPerShares: poolInfo.accRewardPerShares.map((accRewardPerShare: BigNumber, index: number) =>
                accRewardPerShare.div(poolInfo.rewardMultipliers[index])
              ),
              rewardPerSeconds: poolInfo.rewardPerSeconds.map((accRewardPerShare: BigNumber, index: number) =>
                accRewardPerShare.div(poolInfo.rewardMultipliers[index])
              ),
              pid,
              fairLaunchVersion: FairLaunchVersion.V2
            }
          }

          return {
            ...poolInfo,
            pid,
            fairLaunchVersion: FairLaunchVersion.V1
          }
        })
      )

      const stakedBalances = await Promise.all(
        pids.map(async (pid: number) => {
          const stakedBalance = account ? await contract?.getUserInfo(pid, account as string) : { amount: 0 }

          return stakedBalance.amount
        })
      )

      const pendingRewards = await Promise.all(
        pids.map(async (pid: number) => {
          const pendingRewards = account ? await contract?.pendingRewards(pid, account as string) : null

          return pendingRewards
        })
      )

      const poolAddresses = poolInfos.map(poolInfo => poolInfo.stakeToken.toLowerCase())

      const farmsData = await getBulkPoolData(poolAddresses, apolloClient, ethPrice.currentPrice, chainId)

      const rewardTokens = rewardTokenAddresses.map(address =>
        address.toLowerCase() === ZERO_ADDRESS.toLowerCase() ? WETH[chainId as ChainId] : allTokens[address]
      )

      const farms: Farm[] = poolInfos.map((poolInfo, index) => {
        return {
          ...farmsData.find(
            (farmData: Farm) => farmData && farmData.id.toLowerCase() === poolInfo.stakeToken.toLowerCase()
          ),
          ...poolInfo,
          rewardTokens,
          fairLaunchAddress: contract.address,
          userData: {
            stakedBalance: stakedBalances[index],
            rewards:
              poolInfo.fairLaunchVersion === FairLaunchVersion.V2
                ? pendingRewards[index].map((pendingReward: BigNumber, pendingRewardIndex: number) =>
                    pendingReward.div(poolInfo.rewardMultipliers[pendingRewardIndex])
                  )
                : pendingRewards[index]
          },
          isEnded:
            poolInfo.fairLaunchVersion === FairLaunchVersion.V2
              ? poolInfo.endTime <= currentTimestamp
              : poolInfo.endBlock <= (blockNumber || 0)
        }
      })

      const outsideFarm = OUTSIDE_FAIRLAUNCH_ADDRESSES[contract.address]
      if (outsideFarm) {
        const poolData = await fetch(outsideFarm.subgraphAPI, {
          method: 'POST',
          body: JSON.stringify({
            query: outsideFarm.query
          })
        }).then(res => res.json())

        // Defend data totalSupply from pancake greater than 18 decimals
        let totalSupply = poolData.data.pair.totalSupply

        const [a, b] = totalSupply.split('.')
        totalSupply = a + '.' + b.slice(0, 18)

        farms.push({
          ...poolData.data.pair,
          amp: 10000,
          vReserve0: poolData.data.pair.reserve0,
          vReserve1: poolData.data.pair.reserve1,
          token0: {
            ...poolData.data.pair.token0,
            derivedETH: poolData.data.pair.token0.derivedBNB
          },

          token1: {
            ...poolData.data.pair.token1,
            derivedETH: poolData.data.pair.token1.derivedBNB
          },
          trackedReserveETH: poolData.data.pair.trackedReserveBNB,
          totalSupply,

          ...poolInfos[0],
          rewardTokens,
          fairLaunchAddress: contract.address,
          userData: {
            stakedBalance: stakedBalances[0],
            rewards: pendingRewards[0]
          }
        })
      }

      return farms.filter(farm => !!farm.totalSupply)
    }

    async function checkForFarms(currentRenderTime: number) {
      try {
        if (!fairLaunchContracts) {
          dispatch(setFarmsData({}))
          return
        }

        dispatch(setLoading(true))

        const result: { [key: string]: Farm[] } = {}

        const fairLaunchAddresses = Object.keys(fairLaunchContracts)
        const promises: Promise<Farm[]>[] = []

        fairLaunchAddresses.forEach(address => {
          promises.push(getListFarmsForContract(fairLaunchContracts[address]))
        })

        const promiseResult = await Promise.all(promises)

        fairLaunchAddresses.forEach((address, index) => {
          result[address] = promiseResult[index]
        })

        currentRenderTime === latestRenderTime.current && dispatch(setFarmsData(result))
      } catch (err) {
        if (currentRenderTime === latestRenderTime.current) {
          console.error(err)
          dispatch(setYieldPoolsError((err as Error).message))
        }
      }

      dispatch(setLoading(false))
    }

    checkForFarms(latestRenderTime.current)

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      latestRenderTime.current++
    }
  }, [
    apolloClient,
    dispatch,
    ethPrice.currentPrice,
    chainId,
    fairLaunchContracts,
    account,
    blockNumber,
    allTokens,
    currentTimestamp
  ])

  return { loading, error, data: farmsData }
}

export const useActiveAndUniqueFarmsData = (): { loading: boolean; error: string; data: Farm[] } => {
  const farmsData = useFarmsData()

  const { loading, error, data: farms } = farmsData

  const existedPairs: { [key: string]: boolean } = {}
  const uniqueAndActiveFarms = Object.values(farms)
    .flat()
    .filter(farm => {
      if (existedPairs[`${farm.token0?.symbol}-${farm.token1?.symbol}`]) return false
      existedPairs[`${farm.token0?.symbol}-${farm.token1?.symbol}`] = true
      return true
    })
    .filter(farm => !farm.isEnded)

  return {
    loading,
    error,
    data: uniqueAndActiveFarms
  }
}

export const useYieldHistories = (isModalOpen: boolean) => {
  const { chainId, account } = useActiveWeb3React()
  const [histories, setHistories] = useState<FarmHistory[]>([])
  const [loading, setLoading] = useState(false)
  const apolloClient = useExchangeClient()

  useEffect(() => {
    async function fetchFarmHistories() {
      if (!account || !isModalOpen) {
        return
      }

      setLoading(true)

      try {
        const result = await apolloClient.query<FarmHistoriesSubgraphResult>({
          query: FARM_HISTORIES,
          variables: {
            user: account
          },
          fetchPolicy: 'network-only'
        })

        const historiesData: FarmHistory[] = []

        result.data.deposits.forEach(deposit => {
          historiesData.push({
            id: deposit.id,
            timestamp: deposit.timestamp,
            method: FarmHistoryMethod.DEPOSIT,
            amount: deposit.amount,
            stakeToken: deposit.stakeToken
          })
        })

        result.data.withdraws.forEach(withdraw => {
          historiesData.push({
            id: withdraw.id,
            timestamp: withdraw.timestamp,
            method: FarmHistoryMethod.WITHDRAW,
            amount: withdraw.amount,
            stakeToken: withdraw.stakeToken
          })
        })

        result.data.harvests.forEach(harvest => {
          const txHash = harvest.id.split('-')?.[0]

          const index = historiesData.findIndex(
            history =>
              history.method === FarmHistoryMethod.HARVEST &&
              history.rewardToken === harvest.rewardToken &&
              history.id.includes(txHash)
          )

          if (index < 0) {
            historiesData.push({
              id: harvest.id,
              timestamp: harvest.timestamp,
              method: FarmHistoryMethod.HARVEST,
              amount: harvest.amount,
              stakeToken: harvest.stakeToken,
              rewardToken: harvest.rewardToken
            })
          } else {
            historiesData[index].amount = BigNumber.from(historiesData[index].amount)
              .add(BigNumber.from(harvest.amount))
              .toString()
          }
        })

        result.data.vests.forEach(vest => {
          const txHash = vest.id.split('-')?.[0]

          const index = historiesData.findIndex(
            history =>
              history.method === FarmHistoryMethod.CLAIM &&
              history.rewardToken === vest.rewardToken &&
              history.id.includes(txHash)
          )

          if (index < 0) {
            historiesData.push({
              id: vest.id,
              timestamp: vest.timestamp,
              method: FarmHistoryMethod.CLAIM,
              amount: vest.amount,
              rewardToken: vest.rewardToken
            })
          } else {
            historiesData[index].amount = BigNumber.from(historiesData[index].amount)
              .add(BigNumber.from(vest.amount))
              .toString()
          }
        })

        historiesData.sort(function(a, b) {
          return parseInt(b.timestamp) - parseInt(a.timestamp)
        })

        setHistories(historiesData)
      } catch (err) {
        setHistories([])
      }

      setLoading(false)
    }

    fetchFarmHistories()
  }, [chainId, account, isModalOpen, apolloClient])

  return { loading, data: histories }
}

export const useTotalApr = (farm: Farm) => {
  const poolAddressChecksum = isAddressString(farm.id)
  const { decimals: lpTokenDecimals } = useTokenBalance(poolAddressChecksum)
  // Ratio in % of LP tokens that are staked in the MC, vs the total number in circulation
  const lpTokenRatio = new Fraction(
    farm.totalStake.toString(),
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals))
  ).divide(
    new Fraction(
      ethers.utils.parseUnits(farm.totalSupply, lpTokenDecimals).toString(),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals))
    )
  )
  const liquidity = parseFloat(lpTokenRatio.toSignificant(6)) * parseFloat(farm.reserveUSD)

  const farmAPR = useFarmApr(farm, liquidity.toString())
  const tradingFee = farm?.oneDayFeeUSD ? farm?.oneDayFeeUSD : farm?.oneDayFeeUntracked

  const tradingFeeAPR = getTradingFeeAPR(farm?.reserveUSD, tradingFee)
  const apr = farmAPR + (tradingFeeAPR < MAX_ALLOW_APY ? tradingFeeAPR : 0)

  return { tradingFeeAPR, farmAPR, apr }
}
