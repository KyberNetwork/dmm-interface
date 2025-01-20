import { Token } from '@kyberswap/ks-sdk-core'
import cytoscape from 'cytoscape'
import dagre from 'cytoscape-dagre'
import cytoscapeHTML from 'cytoscape-html'
import { useEffect } from 'react'

import useTheme from 'hooks/useTheme'
import { SwapRouteV3 } from 'utils/aggregationRouting'

cytoscape.use(dagre)
cytoscape.use(cytoscapeHTML)

type Node = {
  id: string
  data: {
    label: string
  }
}

type Edge = {
  id: string
  source: string
  target: string
  animated: boolean
}

export const RouteRowV3 = ({
  tradeComposition,
  tokenIn,
  tokenOut,
}: {
  tradeComposition: SwapRouteV3[]
  tokenIn: Token | undefined
  tokenOut: Token | undefined
}) => {
  const theme = useTheme()
  useEffect(() => {
    if (!tokenIn || !tokenOut) return
    const tokens: { [key: string]: Token } = {}
    tradeComposition.forEach(trade => {
      tokens[trade.tokenIn.address.toLowerCase()] = trade.tokenIn
      tokens[trade.tokenOut.address.toLowerCase()] = trade.tokenOut
    })

    const initNodes: Node[] = [
      {
        id: tokenIn.address.toLowerCase(),
        data: { label: tokenIn.symbol || '' },
      },
      ...Object.keys(tokens)
        .filter(
          addr =>
            addr.toLowerCase() !== tokenIn.address.toLowerCase() &&
            addr.toLowerCase() !== tokenOut.address.toLowerCase(),
        )
        .map(addr => ({
          id: addr,
          type: '',
          data: { label: tokens[addr].symbol || '' },
        })),
      {
        id: tokenOut.address.toLowerCase(),
        data: { label: tokenOut.symbol || '' },
      },
    ]

    const initEdges: Edge[] = []
    for (let i = 0; i < initNodes.length; i++) {
      for (let j = 0; j < initNodes.length; j++) {
        const swaps = tradeComposition.filter(
          swap =>
            swap.tokenIn.address.toLowerCase() === initNodes[i].id &&
            swap.tokenOut.address.toLowerCase() === initNodes[j].id,
        )

        if (swaps.length) {
          initEdges.push({
            id: `${initNodes[i].id}-${initNodes[j].id}`,
            source: initNodes[i].id,
            target: initNodes[j].id,
            animated: true,
          })
        }
      }
    }

    const cy = cytoscape({
      container: document.getElementById('cy'), // Specify the container ID
      elements: [
        ...initNodes.map(item => ({
          data: { id: item.id, label: item.data.label },
        })),

        ...initEdges.map(item => ({
          data: { id: item.id, source: item.source, target: item.target },
        })),
      ],
      layout: {
        name: 'dagre',
        rankDir: 'LR',
      } as any,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': theme.background,
            color: theme.subText,
            'border-color': theme.border,
            'border-width': 1,
            'padding-top': '8px',
            'padding-left': '8px',
            'padding-bottom': '8px',
            'padding-right': '8px',
            'font-size': 12,
            label: 'data(label)',
            'text-wrap': 'wrap',
            'text-valign': 'center',
            'text-halign': 'center',
            width: 'max-content',
            shape: 'roundrectangle',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 1,
            'line-color': '#505050',
            'target-arrow-color': theme.primary,
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier', // Taxi edge style
            'arrow-scale': 0.8,
          },
        },
      ],
    })

    // Clean up Cytoscape instance on unmount
    return () => cy.destroy()

    // eslint-disable-next-line
  }, [tradeComposition])

  if (!tokenIn || !tokenOut) return null

  return <div style={{ height: '500px' }} id="cy"></div>
}
