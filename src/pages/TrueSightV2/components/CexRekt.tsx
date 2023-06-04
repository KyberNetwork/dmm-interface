import { useParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled from 'styled-components'

import Row from 'components/Row'
import { MEDIA_WIDTHS } from 'theme'

import { useCexesLiquidationQuery } from '../hooks/useKyberAIData'

const Card = styled.div`
  padding: 20px;
  border-radius: 16px;
  height: 104px;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;

  background: ${({ theme }) => theme.buttonBlack};
  color: ${({ theme }) => theme.text};
`

const formatNum = (num: number) => {
  if (!num) return
  let formattedNum = ''
  if (num > 1000000) {
    formattedNum = (num / 1000000).toFixed(2) + 'M'
  } else if (num > 1000) {
    formattedNum = (num / 1000).toFixed(2) + 'K'
  } else {
    formattedNum = num.toFixed(2)
  }
  return formattedNum
}

export default function CexRekt() {
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)
  const { address, chain } = useParams()
  const { data } = useCexesLiquidationQuery({
    tokenAddress: address,
    chartSize: '1m',
    chain,
  })

  return (
    <>
      {data ? (
        <Row gap="24px" flexDirection={above768 ? 'row' : 'column'} align="stretch">
          <Card>
            <Text fontSize={14}>4H Rekt</Text>
            <Text fontSize={28}>${formatNum(data?.totalVolUsd?.h4TotalVolUsd || 0)}</Text>
          </Card>
          <Card>
            <Text fontSize={14}>12H Rekt</Text>
            <Text fontSize={28}>${formatNum(data?.totalVolUsd?.h12TotalVolUsd || 0)}</Text>
          </Card>
          <Card>
            <Text fontSize={14}>24H Rekt</Text>
            <Text fontSize={28}>${formatNum(data?.totalVolUsd?.h24TotalVolUsd || 0)}</Text>
          </Card>
        </Row>
      ) : (
        <></>
      )}
    </>
  )
}
