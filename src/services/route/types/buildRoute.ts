import { RouteSummary as RawRouteSummary } from 'services/route/types/getRoute'

export type BuildRoutePayload = {
  routeSummary: RawRouteSummary
  deadline: number
  slippageTolerance: number
  sender: string
  recipient: string
  source: 'kyberswap'
  permit?: string
}

export type BuildRouteData = {
  data: string
  amountIn: string
  amountInUsd: string
  amountOut: string
  amountOutUsd: string
  outputChange?: {
    percent: number
  }
  gas: string
  gasUsd: string
  routerAddress: string
}

export type BuildRouteResponse = {
  code: number
  message: string
  data?: BuildRouteData
}
