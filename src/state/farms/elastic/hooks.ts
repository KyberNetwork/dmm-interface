import { gql, useLazyQuery } from '@apollo/client'
import { defaultAbiCoder } from '@ethersproject/abi'
import { getCreate2Address } from '@ethersproject/address'
import { keccak256 } from '@ethersproject/solidity'
import { ChainId, Currency, CurrencyAmount, Token, TokenAmount, WETH } from '@kyberswap/ks-sdk-core'
import { FeeAmount, Pool, Position } from '@kyberswap/ks-sdk-elastic'
import { BigNumber } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { useCallback, useEffect, useMemo } from 'react'

import NFTPositionManagerABI from 'constants/abis/v2/ProAmmNFTPositionManager.json'
import ELASTIC_FARM_ABI from 'constants/abis/v2/farm.json'
import { ZERO_ADDRESS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { nativeOnChain } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useMulticallContract } from 'hooks/useContract'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { usePoolBlocks } from 'state/prommPools/hooks'
import { isAddressString } from 'utils'

import { ElasticFarm, NFTPosition, UserFarmInfo, setFarms, setLoading, setPoolFeeData, setUserFarmInfo } from '.'
import { addFailedNFTs } from '../promm/actions'

interface SubgraphToken {
  id: string
  name: string
  decimals: string
  symbol: string
}

interface SubgraphFarm {
  id: string
  rewardLocker: string

  farmingPools: Array<{
    id: string
    pid: string
    startTime: string
    endTime: string
    feeTarget: string
    vestingDuration: string
    rewardTokens: Array<{
      token: SubgraphToken
      amount: string
    }>
    joinedPositions: Array<{
      id: string
      user: string
      pid: string
      liquidity: string
      position: {
        id: string
        tickLower: {
          tickIdx: string
        }
        tickUpper: {
          tickIdx: string
        }
      }
    }>
    pool: {
      id: string
      feeTier: string
      sqrtPrice: string
      feesUSD: string
      liquidity: string
      tick: string
      totalValueLockedUSD: string
      reinvestL: string
      token0: SubgraphToken
      token1: SubgraphToken
    }
  }>
}

const POOL_FEE_HISTORY = gql`
  query poolFees($block: Int!, $poolIds: [String]!) {
    pools(block: { number: $block }, where: { id_in: $poolIds }) {
      id
      feesUSD
    }
  }
`

const ELASTIC_FARM_QUERY = gql`
  query getFarms {
    farms(first: 1000) {
      id
      rewardLocker
      farmingPools {
        id
        pid
        startTime
        endTime
        feeTarget
        vestingDuration
        rewardTokens {
          token {
            id
            symbol
            name
            decimals
          }
          amount
        }
        joinedPositions {
          id
          user
          pid
          liquidity
          position {
            id
            tickLower {
              tickIdx
            }
            tickUpper {
              tickIdx
            }
          }
        }
        pool {
          id
          feeTier
          tick
          totalValueLockedUSD
          liquidity
          feesUSD
          reinvestL
          sqrtPrice
          token0 {
            id
            symbol
            name
            decimals
          }
          token1 {
            id
            symbol
            name
            decimals
          }
        }
      }
    }
  }
`

const farmInterface = new Interface(ELASTIC_FARM_ABI)
const positionManagerInterface = new Interface(NFTPositionManagerABI.abi)

export const useElasticFarms = () => {
  const { chainId } = useActiveWeb3React()
  const defaultChainData = useMemo(
    () => ({
      loading: false,
      farms: null,
      poolFeeLast24h: {},
    }),
    [],
  )
  return useAppSelector(state => state.elasticFarm)[chainId || 1] || defaultChainData
}

export const FarmUpdater = ({ interval = true }: { interval?: boolean }) => {
  const dispatch = useAppDispatch()
  const { chainId, account } = useActiveWeb3React()
  const defaultChainData = useMemo(
    () => ({
      loading: false,
      farms: null,
      poolFeeLast24h: {},
    }),
    [],
  )
  const elasticFarm = useAppSelector(state => state.elasticFarm)[chainId || 1] || defaultChainData

  const [getElasticFarms, { data, error }] = useLazyQuery(ELASTIC_FARM_QUERY, {
    client: NETWORKS_INFO[chainId || ChainId.MAINNET].elasticClient,
    fetchPolicy: 'network-only',
  })

  useEffect(() => {
    if (!elasticFarm.farms && !elasticFarm.loading) {
      console.time('getFarmFromSubgraph')
      dispatch(setLoading({ chainId, loading: true }))
      getElasticFarms().finally(() => {
        console.timeEnd('getFarmFromSubgraph')
        dispatch(setLoading({ chainId, loading: false }))
      })
    }
  }, [elasticFarm, getElasticFarms, dispatch, chainId])

  useEffect(() => {
    const i = interval
      ? setInterval(() => {
          getElasticFarms()
        }, 15_000)
      : undefined
    return () => {
      i && clearInterval(i)
    }
  }, [interval, getElasticFarms])

  useEffect(() => {
    if (error && chainId) {
      dispatch(setFarms({ chainId, farms: [] }))
      dispatch(setLoading({ chainId, loading: false }))
    }
  }, [error, dispatch, chainId])

  useEffect(() => {
    if (data?.farms && chainId) {
      // transform farm data
      const formattedData: ElasticFarm[] = data.farms.map((farm: SubgraphFarm) => {
        return {
          id: farm.id,
          rewardLocker: isAddressString(farm.rewardLocker),
          pools: farm.farmingPools.map(pool => {
            const token0Address = isAddressString(pool.pool.token0.id)
            const token1Address = isAddressString(pool.pool.token1.id)

            const token0 =
              token0Address === WETH[chainId].address
                ? nativeOnChain(chainId)
                : new Token(
                    chainId,
                    token0Address,
                    Number(pool.pool.token0.decimals),
                    pool.pool.token0.symbol.toLowerCase() === 'mimatic' ? 'MAI' : pool.pool.token0.symbol,
                    pool.pool.token0.name,
                  )

            const token1 =
              token1Address === WETH[chainId].address
                ? nativeOnChain(chainId)
                : new Token(
                    chainId,
                    token1Address,
                    Number(pool.pool.token1.decimals),
                    pool.pool.token1.symbol.toLowerCase() === 'mimatic' ? 'MAI' : pool.pool.token1.symbol,
                    pool.pool.token1.name,
                  )

            const p = new Pool(
              token0.wrapped,
              token1.wrapped,
              Number(pool.pool.feeTier) as FeeAmount,
              pool.pool.sqrtPrice,
              pool.pool.liquidity,
              pool.pool.reinvestL,
              Number(pool.pool.tick),
            )

            let tvlToken0 = TokenAmount.fromRawAmount(token0.wrapped, 0)
            let tvlToken1 = TokenAmount.fromRawAmount(token1.wrapped, 0)
            pool.joinedPositions.forEach(pos => {
              const position = new Position({
                pool: p,
                liquidity: pos.liquidity,
                tickLower: Number(pos.position.tickLower.tickIdx),
                tickUpper: Number(pos.position.tickUpper.tickIdx),
              })
              tvlToken0 = tvlToken0.add(position.amount0)
              tvlToken1 = tvlToken1.add(position.amount1)
            })

            return {
              startTime: Number(pool.startTime),
              endTime: Number(pool.endTime),
              pid: pool.pid,
              id: pool.id,
              feeTarget: pool.feeTarget,
              vestingDuration: Number(pool.vestingDuration),
              token0,
              token1,
              poolAddress: pool.pool.id,
              feesUSD: Number(pool.pool.feesUSD),
              pool: p,
              poolTvl: Number(pool.pool.totalValueLockedUSD),
              rewardTokens: pool.rewardTokens.map(({ token }) => {
                return token.id === ZERO_ADDRESS
                  ? nativeOnChain(chainId)
                  : new Token(chainId, token.id, Number(token.decimals), token.symbol, token.name)
              }),
              totalRewards: pool.rewardTokens.map(({ token, amount }) => {
                const t =
                  token.id === ZERO_ADDRESS
                    ? nativeOnChain(chainId)
                    : new Token(chainId, token.id, Number(token.decimals), token.symbol, token.name)
                return CurrencyAmount.fromRawAmount(t, amount)
              }),
              tvlToken0,
              tvlToken1,
            }
          }),
        }
      })
      dispatch(setFarms({ chainId, farms: formattedData }))
    }
  }, [data, dispatch, chainId])

  const multicallContract = useMulticallContract()

  const getUserFarmInfo = useCallback(async () => {
    const farmAddresses = elasticFarm.farms?.map(farm => farm.id)

    if (chainId && account && farmAddresses?.length && multicallContract) {
      console.time('getUserFarmInfo')
      // get userDepositedNFTs
      const userDepositedNFTsFragment = farmInterface.getFunction('getDepositedNFTs')
      const callData = farmInterface.encodeFunctionData(userDepositedNFTsFragment, [account])

      const chunks = farmAddresses.map(address => ({
        target: address,
        callData,
      }))

      const multicallRes = await multicallContract.callStatic.tryBlockAndAggregate(false, chunks)
      const returnData = multicallRes.returnData
      // listNFTs by contract
      const nftResults: Array<Array<BigNumber>> = returnData.map((data: [boolean, string]) =>
        data[0] ? farmInterface.decodeFunctionResult(userDepositedNFTsFragment, data[1]).listNFTs : [],
      )

      /*
       * GET DETAIL NFT
       */
      const allNFTs = nftResults.flat()
      const nftDetailFragment = positionManagerInterface.getFunction('positions')
      const nftDetailChunks = allNFTs.map(id => ({
        target: NETWORKS_INFO[chainId].elastic.nonfungiblePositionManager,
        callData: positionManagerInterface.encodeFunctionData(nftDetailFragment, [id]),
      }))

      const detailNFTMultiCallData = (await multicallContract.callStatic.tryBlockAndAggregate(false, nftDetailChunks))
        .returnData

      const nftDetailResult = detailNFTMultiCallData.map((data: [boolean, string]) =>
        data[0] ? positionManagerInterface.decodeFunctionResult(nftDetailFragment, data[1]) : null,
      )

      type NFT_INFO = {
        [id: string]: {
          poolAddress: string
          liquidity: BigNumber
          tickLower: BigNumber
          tickUpper: BigNumber
        }
      }
      const nftInfos = nftDetailResult.reduce((acc: NFT_INFO, item: any, index: number) => {
        if (!item) return acc
        return {
          ...acc,
          [allNFTs[index].toString()]: {
            poolAddress: getCreate2Address(
              NETWORKS_INFO[chainId].elastic.coreFactory,
              keccak256(
                ['bytes'],
                [
                  defaultAbiCoder.encode(
                    ['address', 'address', 'uint24'],
                    [item.info.token0, item.info.token1, item.info.fee],
                  ),
                ],
              ),
              NETWORKS_INFO[chainId].elastic.initCodeHash,
            ),
            liquidity: item.pos.liquidity,
            tickLower: item.pos.tickLower,
            tickUpper: item.pos.tickUpper,
          },
        }
      }, {} as NFT_INFO)

      const promises =
        elasticFarm.farms?.map(async (farm, index) => {
          const nfts = nftResults[index]

          const depositedPositions: NFTPosition[] = []
          const joinedPositions: { [pid: string]: NFTPosition[] } = {}
          const rewardPendings: { [pid: string]: CurrencyAmount<Currency>[] } = {}
          // nft got underflow issue from contract and need to emergencyWithdraw
          const errorNFTs: string[] = []

          const userInfoParams: Array<[BigNumber, string]> = []
          nfts.forEach(id => {
            const matchedPools = farm.pools.filter(
              p => p.poolAddress.toLowerCase() === nftInfos[id.toString()]?.poolAddress.toLowerCase(),
            )

            matchedPools.forEach(pool => {
              userInfoParams.push([id, pool.pid])
            })

            if (matchedPools?.[0]) {
              const pos = new NFTPosition({
                nftId: id,
                pool: matchedPools[0].pool,
                liquidity: nftInfos[id.toString()].liquidity,
                tickLower: nftInfos[id.toString()].tickLower,
                tickUpper: nftInfos[id.toString()].tickUpper,
              })
              depositedPositions.push(pos)
            }
          })

          const getUserInfoFragment = farmInterface.getFunction('getUserInfo')
          if (nfts.length) {
            const returnData = (
              await multicallContract.callStatic.tryBlockAndAggregate(
                false,
                userInfoParams.map(params => {
                  return {
                    target: farm.id,
                    callData: farmInterface.encodeFunctionData(getUserInfoFragment, params),
                  }
                }),
              )
            ).returnData.map((item: [boolean, string]) => item[1])

            const result = returnData.map((data: string, i: number) => {
              try {
                return farmInterface.decodeFunctionResult(getUserInfoFragment, data)
              } catch (e) {
                if (JSON.stringify(e).includes('Panic')) {
                  errorNFTs.push(userInfoParams[i][0].toString())
                }
                return e
              }
            })
            userInfoParams.forEach((param, index) => {
              const pid = param[1].toString()
              const nftId = param[0]
              if (!(result[index] instanceof Error)) {
                if (!joinedPositions[pid]) {
                  joinedPositions[pid] = []
                }

                const depositedPos = depositedPositions.find(pos => pos.nftId.eq(nftId))
                const farmingPool = farm.pools.find(p => p.pid === pid)

                if (depositedPos && farmingPool) {
                  const pos = new NFTPosition({
                    nftId,
                    liquidity: result[index].liquidity,
                    tickLower: depositedPos.tickLower,
                    tickUpper: depositedPos.tickUpper,
                    pool: depositedPos.pool,
                  })
                  joinedPositions[pid].push(pos)

                  if (!rewardPendings[pid]) {
                    rewardPendings[pid] = []
                  }
                  farmingPool.rewardTokens.forEach((currency, i) => {
                    const amount = CurrencyAmount.fromRawAmount(currency, result[index].rewardPending[i])
                    if (!rewardPendings[pid][i]) {
                      rewardPendings[pid][i] = amount
                    } else {
                      rewardPendings[pid][i] = rewardPendings[pid][i].add(amount)
                    }
                  })
                }
              }
            })
          }
          return {
            depositedPositions,
            joinedPositions,
            rewardPendings,
            errorNFTs,
          }
        }) || []

      const res = await Promise.all(promises)
      const errorNFTs = res.map(r => r.errorNFTs).flat()
      dispatch(addFailedNFTs(errorNFTs))

      const userInfo = elasticFarm.farms?.reduce((userInfo, farm, index) => {
        return {
          ...userInfo,
          [farm.id]: res[index],
        }
      }, {} as UserFarmInfo)

      if (userInfo) dispatch(setUserFarmInfo({ chainId, userInfo }))
      console.timeEnd('getUserFarmInfo')
    }
  }, [account, multicallContract, chainId, dispatch, elasticFarm.farms])

  useEffect(() => {
    getUserFarmInfo()

    const i = interval
      ? setInterval(() => {
          getUserFarmInfo()
        }, 10_000)
      : undefined
    return () => {
      i && clearInterval(i)
    }
  }, [getUserFarmInfo, interval])

  const { block24 } = usePoolBlocks()
  const [getPoolInfo, { data: poolFeeData }] = useLazyQuery(POOL_FEE_HISTORY, {
    client: NETWORKS_INFO[chainId || ChainId.MAINNET].elasticClient,
    fetchPolicy: 'network-only',
  })

  useEffect(() => {
    if (poolFeeData?.pools?.length) {
      const poolFeeMap = poolFeeData.pools.reduce(
        (acc: { [id: string]: number }, cur: { id: string; feesUSD: string }) => {
          return {
            ...acc,
            [cur.id]: Number(cur.feesUSD),
          }
        },
        {} as { [id: string]: number },
      )

      dispatch(setPoolFeeData({ chainId, data: poolFeeMap }))
    }
  }, [poolFeeData, chainId, dispatch])

  useEffect(() => {
    const poolIds = elasticFarm.farms?.map(item => item.pools.map(p => p.poolAddress.toLowerCase())).flat()

    if (block24 && poolIds?.length) {
      getPoolInfo({
        variables: {
          block: Number(block24),
          poolIds,
        },
      })
    }
  }, [elasticFarm.farms, block24, getPoolInfo])

  return null
}
