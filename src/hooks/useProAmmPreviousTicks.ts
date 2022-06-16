import { Pool, Position, TickMath } from '@kyberswap/ks-sdk-elastic'
import { PRO_AMM_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import { useMemo, useState, useEffect } from 'react'
import { Result, useSingleContractMultipleData } from 'state/multicall/hooks'
import { useProAmmTickReader } from './useContract'
import useProAmmPoolInfo from './useProAmmPoolInfo'
import { BigNumber } from 'ethers'

const isNullOrUndefined = <T>(value: T) => value === null || value === undefined

export default function useProAmmPreviousTicks(
  pool: Pool | null | undefined,
  position: Position | undefined,
): number[] | undefined {
  const tickReader = useProAmmTickReader()

  const poolAddress = useProAmmPoolInfo(position?.pool.token0, position?.pool.token1, position?.pool.fee)

  const results = useSingleContractMultipleData(
    tickReader,
    'getNearestInitializedTicks',
    [
      [poolAddress, position?.tickLower],
      [poolAddress, position?.tickUpper],
    ].filter(item => !!pool && !isNullOrUndefined(item[0]) && !isNullOrUndefined(item[1])),
  )

  const loading = useMemo(() => results.some(({ loading }) => loading), [results])
  const error = useMemo(() => results.some(({ error }) => error), [results])
  return useMemo(() => {
    if (!pool) return [TickMath.MIN_TICK, TickMath.MIN_TICK]
    if (!loading && !error && !!pool) {
      return results.map(call => {
        const result = call.result as Result
        return result.previous
      })
    }
    return undefined
  }, [results, loading, error, pool])
}

export function useProAmmTotalFeeOwedByPosition(
  pool: Pool | null | undefined,
  tokenID: string | null | undefined,
): BigNumber[] {
  const tickReader = useProAmmTickReader()
  const poolAddress = useProAmmPoolInfo(pool?.token0, pool?.token1, pool?.fee)
  const { chainId } = useActiveWeb3React()

  const [res, setRes] = useState<[BigNumber, BigNumber]>([BigNumber.from(0), BigNumber.from(0)])

  useEffect(() => {
    if (chainId && tickReader && tokenID) {
      tickReader
        .getTotalFeesOwedToPosition(PRO_AMM_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId], poolAddress, tokenID)
        .then((res: [BigNumber, BigNumber]) => {
          setRes([res[0], res[1]])
        })
        .catch((e: any) => {
          console.error('failed to get fee', e)
        })
    }
  }, [tickReader, chainId, tokenID, poolAddress])

  // const result = useSingleContractMultipleData(
  //   tickReader,
  //   'getTotalFeesOwedToPosition',
  //   [[chainId && PRO_AMM_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId], poolAddress, tokenID!!]].filter(
  //     item => !!item[0] && !!item[1] && !!item[2],
  //   ),
  // )?.[0]?.result
  // return result ? [result[0], result[1]] : [0, 0]
  return res
}
