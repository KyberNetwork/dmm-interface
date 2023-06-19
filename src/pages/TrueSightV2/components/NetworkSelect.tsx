import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useRef, useState } from 'react'
import { X } from 'react-feather'
import { Flex, Image, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as ChevronDown } from 'assets/svg/down.svg'
import { OptionsContainer } from 'components'
import Kyber from 'components/Icons/Kyber'
import { NETWORKS_INFO } from 'constants/networks'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'

import { SUPPORTED_NETWORK_KYBERAI } from '../constants'

const NetworkSelectContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  position: relative;
  border-radius: 999px;
  background: ${({ theme }) => theme.background};
  min-width: 160px;
  cursor: pointer;
`

const NetworkSelect = ({ filter, setFilter }: { filter?: ChainId; setFilter: (c?: ChainId) => void }) => {
  const theme = useTheme()

  const [isShowOptions, setIsShowOptions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useOnClickOutside(containerRef, () => setIsShowOptions(false))

  return (
    <NetworkSelectContainer
      role="button"
      onClick={() => {
        setIsShowOptions(prev => !prev)
      }}
      ref={containerRef}
    >
      <Flex alignItems="center" style={{ gap: '8px' }}>
        {filter ? (
          <Image minHeight={20} minWidth={20} height={20} width={20} src={NETWORKS_INFO[filter].icon} />
        ) : (
          <Kyber size={24} color={theme.subText} />
        )}
        <Text color={theme.subText} fontSize="14px" lineHeight="24px">
          {filter ? NETWORKS_INFO[filter].name : <Trans>All Chains</Trans>}
        </Text>
      </Flex>
      <Flex alignItems="center">
        {filter ? (
          <X
            size={16}
            color={theme.subText}
            onClick={e => {
              e.stopPropagation()
              setFilter()
            }}
          />
        ) : (
          <ChevronDown
            color={theme.border}
            style={{ transform: `rotate(${isShowOptions ? '180deg' : 0})`, transition: 'transform 0.2s' }}
          />
        )}
      </Flex>

      {isShowOptions && (
        <OptionsContainer>
          {Object.keys(SUPPORTED_NETWORK_KYBERAI).map((network, index) => (
            <Flex
              key={index}
              alignItems="center"
              style={{ gap: '4px' }}
              onClick={() => {
                setFilter(+network as ChainId)
              }}
            >
              <Image
                minHeight={16}
                minWidth={16}
                height={16}
                width={16}
                src={NETWORKS_INFO[+network as ChainId].icon}
              />
              <Text key={index} color={theme.subText} fontSize="12px">
                {NETWORKS_INFO[+network as ChainId].name}
              </Text>
            </Flex>
          ))}
        </OptionsContainer>
      )}
    </NetworkSelectContainer>
  )
}

export default NetworkSelect
