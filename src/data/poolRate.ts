import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import weekOfYear from 'dayjs/plugin/weekOfYear'

import { HOURLY_POOL_RATES } from 'apollo/queries'
import { EVMNetworkInfo } from 'constants/networks/type'
import { getBlocksFromTimestamps, splitQuery } from 'utils'

import { Block, PoolRatesEntry } from './type'

// format dayjs with the libraries that we need
dayjs.extend(utc)
dayjs.extend(weekOfYear)

interface ChartResults {
  token0Price: string
  token1Price: string
}

export const getHourlyRateData = async (
  poolAddress: string,
  startTime: number,
  frequency: number,
  networkInfo: EVMNetworkInfo,
  abortSignal: AbortSignal,
): Promise<[PoolRatesEntry[], PoolRatesEntry[]] | undefined> => {
  try {
    const utcEndTime = dayjs.utc()
    let time = startTime

    // create an array of hour start times until we reach current hour
    const timestamps = []
    while (time <= utcEndTime.unix() - frequency) {
      timestamps.push(time)
      time += frequency
    }

    // backout if invalid timestamp format
    if (timestamps.length === 0) {
      return
    }

    // once you have all the timestamps, get the blocks for each timestamp in a bulk query
    let blocks = await getBlocksFromTimestamps(timestamps, networkInfo.chainId)
    if (abortSignal.aborted) return
    // catch failing case
    if (!blocks || blocks?.length === 0) {
      return
    }
    blocks = blocks.filter(b => b.number >= networkInfo.elastic.startBlock)

    const result = await splitQuery<ChartResults, Block, string>(
      HOURLY_POOL_RATES,
      networkInfo.elastic.client,
      blocks,
      [poolAddress],
      100,
    )
    if (abortSignal.aborted) return

    // format token ETH price results
    const values: {
      timestamp: number
      rate0: number
      rate1: number
    }[] = []
    for (const row in result) {
      const timestamp = parseFloat(row.split('t')[1])
      if (timestamp && result[row]) {
        values.push({
          timestamp,
          rate0: parseFloat(result[row]?.token0Price),
          rate1: parseFloat(result[row]?.token1Price),
        })
      }
    }

    const formattedHistoryRate0: PoolRatesEntry[] = []
    const formattedHistoryRate1: PoolRatesEntry[] = []

    // for each hour, construct the open and close price
    for (let i = 0; i < values.length - 1; i++) {
      formattedHistoryRate0.push({
        time: values[i].timestamp,
        open: values[i].rate0,
        close: values[i + 1].rate0,
      })
      formattedHistoryRate1.push({
        time: values[i].timestamp,
        open: values[i].rate1,
        close: values[i + 1].rate1,
      })
    }

    return [formattedHistoryRate0, formattedHistoryRate1]
  } catch (e) {
    console.log(e)
    return
  }
}
