import { ZERO } from '@kyberswap/ks-sdk-classic'
import { ChainId, Currency, CurrencyAmount, Percent, Rounding, Token, WETH } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'

import { ETHER_ADDRESS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { isAddressString } from 'utils'

export interface SwapPool {
  id: string
  exchange: string
  swapAmount?: JSBI
  swapPercentage?: number
}

type PathItem = Token

type Swap = {
  pool: string
  tokenIn: string
  tokenOut: string
  swapAmount: string
  amountOut: string
  exchange: string
}

interface SwapRoute {
  slug: string
  pools: SwapPool[]
  path: PathItem[]
  id: string
}

export interface SwapRouteV2 {
  swapPercentage?: number
  path: PathItem[]
  subRoutes: SwapPool[][]
  id: string
}

function formatRoutesV2(routes: SwapRoute[]): SwapRouteV2[] {
  if (!routes.length) {
    return []
  }
  try {
    let itemIndex = -1
    const routesGroup = routes.reduce((a, b) => {
      let index: number
      let subRoutes: SwapPool[][] = []
      let swapPercentage: number = (b.pools && b.pools[0]?.swapPercentage) || 0
      if (a[b.slug]) {
        const route: any = a[b.slug] || {}
        index = route.index
        const temp = route.subRoutes || []
        swapPercentage += route.swapPercentage || 0
        temp.forEach((sub: SwapPool[], ind: number) => {
          const swapPool: SwapPool = (b.pools && b.pools[ind]) || ({} as any)
          const totalSwapAmount = JSBI.add(
            sub.reduce((sum, x2) => JSBI.add(sum, x2.swapAmount || ZERO), ZERO),
            swapPool.swapAmount || ZERO,
          )
          // merge hop with same pools
          let existed = false
          const newSub: any[] = sub.map(pool => {
            const p2: any = { ...pool }
            const same = p2.id === swapPool.id
            let swapAmount = p2.swapAmount || ZERO
            if (same) {
              existed = true
              swapAmount = JSBI.add(swapAmount, swapPool.swapAmount || ZERO)
            }
            const percent = new Percent(swapAmount, totalSwapAmount).toFixed(0, undefined, Rounding.ROUND_HALF_UP)
            p2.swapPercentage = parseInt(percent)
            p2.total = totalSwapAmount.toString()
            return p2
          })
          if (!existed) {
            const percent = new Percent(swapPool.swapAmount || ZERO, totalSwapAmount).toFixed(
              0,
              undefined,
              Rounding.ROUND_HALF_UP,
            )
            newSub.push({ ...swapPool, swapPercentage: parseInt(percent) })
          }
          subRoutes[ind] = newSub
        })
      } else {
        itemIndex += 1
        index = itemIndex
        subRoutes = b.pools.map(p => [{ ...p, swapPercentage: 100 }])
      }
      return Object.assign({}, a, {
        [b.slug]: { index, swapPercentage, path: b.path, subRoutes },
      })
    }, {} as any)

    const routesV2Length = Object.keys(routesGroup).length
    const routesV2: SwapRouteV2[] = new Array(routesV2Length).map(() => ({} as SwapRouteV2))

    Object.values(routesGroup).forEach((route: any) => {
      if (route.index > routesV2Length) return
      routesV2.splice(route.index, 1, {
        swapPercentage: route.swapPercentage,
        path: route.path,
        subRoutes: route.subRoutes,
        id: route.subRoutes
          .flat()
          .map((route: SwapPool) => route.id)
          .join('-'),
      })
    })
    return routesV2
  } catch (e) {
    console.error('[error_routesV2]', e)
    return []
  }
}

export interface SwapRouteV3 {
  tokenIn: PathItem
  tokenOut: PathItem
  pool: string
  swapAmount: string
  amountOut: string
  exchange: string
  depth: number
}

export function getTradeComposition(
  chainId: ChainId,
  inputAmount: CurrencyAmount<Currency> | undefined,
  involvingTokens: { [address: string]: Token | undefined } | undefined,
  swaps: Swap[][] | undefined,
  allTokens: { [address: string]: Token } | undefined,
): SwapRouteV2[] | SwapRouteV3[] | undefined {
  if (!inputAmount || !swaps) {
    return undefined
  }

  const inputTokenAmount = inputAmount.wrapped
  const tokens = involvingTokens || {}
  const defaultToken = new Token(chainId, WETH[chainId].address, 0, '--', '--')
  const routes: SwapRoute[] = []

  const getTokenFromAddress = (address: string): PathItem => {
    if (address.toLowerCase() === ETHER_ADDRESS.toLowerCase()) {
      return NativeCurrencies[chainId].wrapped
    }

    return (
      allTokens?.[isAddressString(address)] ||
      tokens[address] ||
      (isAddressString(address) ? new Token(chainId, isAddressString(address), 0, '--', '--') : defaultToken)
    )
  }

  if (swaps.every(swap => swap.length === 1)) {
    const tokenIn = inputAmount.currency.wrapped.address
    const swapsWithDepth = swaps.map(s => ({
      ...s[0],
      depth: s[0].tokenIn.toLowerCase() === tokenIn.toLowerCase() ? 1 : -1,
    }))

    let currentLevel = 1
    while (swapsWithDepth.some(m => m.depth === -1)) {
      const nextInputs = swapsWithDepth.filter(s => s.depth === currentLevel).map(item => item.tokenOut)

      for (const inputToken of nextInputs) {
        for (let i = 0; i < swapsWithDepth.length; i++) {
          if (swapsWithDepth[i].depth !== -1) continue
          if (swapsWithDepth[i].tokenIn.toLowerCase() === inputToken.toLowerCase()) {
            swapsWithDepth[i].depth = currentLevel + 1
          }
        }
      }
      currentLevel++
    }

    return swapsWithDepth.map(swap => ({
      ...swap,
      tokenIn: getTokenFromAddress(swap.tokenIn),
      tokenOut: getTokenFromAddress(swap.tokenOut),
    }))
  }
  const calcSwapPercentage = function (tokenIn: string, amount: string): number | undefined {
    if (!tokenIn || !amount) {
      return undefined
    }
    const exactTokenIn = tokenIn?.toLowerCase() === inputTokenAmount?.currency.address?.toLowerCase()
    if (exactTokenIn && inputAmount.greaterThan(JSBI.BigInt(0))) {
      const percent = new Percent(JSBI.BigInt(amount || 0), inputAmount.quotient).toFixed(0)
      return parseInt(percent)
    }
    return undefined
  }

  // Convert all Swaps to ChartSwaps
  swaps.forEach(sorMultiSwap => {
    if (!sorMultiSwap.length || sorMultiSwap.length < 1) {
      return
    }

    if (sorMultiSwap.length === 1) {
      const hop = sorMultiSwap[0]
      const path = [getTokenFromAddress(hop.tokenIn), getTokenFromAddress(hop.tokenOut)]

      routes.push({
        slug: hop.tokenOut?.toLowerCase(),
        pools: [
          {
            id: hop.pool,
            exchange: hop.exchange,
            swapAmount: JSBI.BigInt(hop.swapAmount),
            swapPercentage: calcSwapPercentage(hop.tokenIn, hop.swapAmount),
          },
        ],
        path,
        id: hop.pool,
      })

      return
    }

    const path: PathItem[] = []
    const pools: SwapPool[] = []
    sorMultiSwap.forEach((hop: any, index: number) => {
      pools.push({
        id: hop.pool + '-' + hop.tokenIn + '-' + hop.tokenOut,
        exchange: hop.exchange,
        swapAmount: JSBI.BigInt(hop.swapAmount),
        swapPercentage: index === 0 ? calcSwapPercentage(hop.tokenIn, hop.swapAmount) : 100,
      })

      if (index === 0) {
        const token = getTokenFromAddress(hop.tokenIn)
        path.push(token)
      }

      const token = getTokenFromAddress(hop.tokenOut)
      path.push(token)
    })
    routes.push({
      slug: path
        .slice(1)
        .map(t => t.address)
        .join('-')
        .toLowerCase(),
      path,
      pools,
      id: pools.map(p => p.id).join('-'),
    })
  })

  // Convert to ChartSwaps v2
  return formatRoutesV2(routes)
}
