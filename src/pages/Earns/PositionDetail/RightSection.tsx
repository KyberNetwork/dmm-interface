import { t } from '@lingui/macro'
import { useState } from 'react'
import { Flex, Text } from 'rebass'

import { Swap as SwapIcon } from 'components/Icons'
import useTheme from 'hooks/useTheme'
import { formatDisplayNumber } from 'utils/numbers'

import { ParsedPosition } from '.'
import { InfoRightColumn, InfoSection, InfoSectionSecondFormat, RevertIconWrapper } from './styles'

const RightSection = ({ position }: { position: ParsedPosition }) => {
  const theme = useTheme()
  const [revert, setRevert] = useState(false)

  return (
    <InfoRightColumn>
      <InfoSection>
        <Flex alignItems={'center'} sx={{ gap: 1 }}>
          <Text fontSize={14} color={theme.subText}>
            {t`Current Price`}
          </Text>
          <Text fontSize={14}>
            {formatDisplayNumber(!revert ? position.pairRate : 1 / position.pairRate, {
              significantDigits: 6,
            })}
          </Text>
          <Text fontSize={14} color={theme.subText}>
            {!revert ? position.token0Symbol : position.token1Symbol} per{' '}
            {!revert ? position.token1Symbol : position.token0Symbol}
          </Text>
          <RevertIconWrapper onClick={() => setRevert(!revert)}>
            <SwapIcon rotate={90} size={18} />
          </RevertIconWrapper>
        </Flex>
      </InfoSection>
      <Flex sx={{ gap: '16px' }}>
        <InfoSectionSecondFormat>
          <Text fontSize={14} color={theme.subText}>
            {t`Min Price`}
          </Text>
          <Text fontSize={18} marginBottom={2} marginTop={2}>
            {formatDisplayNumber(!revert ? position.minPrice : 1 / position.maxPrice, {
              significantDigits: 6,
            })}
          </Text>
          <Text fontSize={14} color={theme.subText}>
            {!revert ? position.token0Symbol : position.token1Symbol}/
            {!revert ? position.token1Symbol : position.token0Symbol}
          </Text>
        </InfoSectionSecondFormat>
        <InfoSectionSecondFormat>
          <Text fontSize={14} color={theme.subText}>
            {t`Max Price`}
          </Text>
          <Text fontSize={18} marginBottom={2} marginTop={2}>
            {formatDisplayNumber(!revert ? position.maxPrice : 1 / position.minPrice, {
              significantDigits: 6,
            })}
          </Text>
          <Text fontSize={14} color={theme.subText}>
            {!revert ? position.token0Symbol : position.token1Symbol}/
            {!revert ? position.token1Symbol : position.token0Symbol}
          </Text>
        </InfoSectionSecondFormat>
      </Flex>
    </InfoRightColumn>
  )
}

export default RightSection
