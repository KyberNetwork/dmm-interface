import React, { CSSProperties, Dispatch, SetStateAction, useRef, useState } from 'react'
import { Flex, Image, Text } from 'rebass'
import { Trans } from '@lingui/macro'
import useTheme from 'hooks/useTheme'
import { ChevronDown, X } from 'react-feather'
import styled from 'styled-components'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { OptionsContainer } from 'pages/TrueSight/styled'
import { ChainId } from '@dynamic-amm/sdk'
import { NETWORK_ICON, NETWORK_LABEL } from 'constants/networks'
import Kyber from 'components/Icons/Kyber'
import { TRENDING_SOON_SUPPORTED_NETWORKS } from 'constants/index'
import { TrueSightFilter } from 'pages/TrueSight/index'

const NetworkSelectContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 10px 12px;
  position: relative;
  border-radius: 4px;
  background: ${({ theme }) => theme.background};
  min-width: 160px;
  cursor: pointer;
`

const NetworkSelect = ({
  filter,
  setFilter,
  style,
}: {
  filter: TrueSightFilter
  setFilter: Dispatch<SetStateAction<TrueSightFilter>>
  style?: CSSProperties
}) => {
  const theme = useTheme()

  const { selectedNetwork } = filter
  const [isShowOptions, setIsShowOptions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useOnClickOutside(containerRef, () => setIsShowOptions(false))

  return (
    <NetworkSelectContainer onClick={() => setIsShowOptions(prev => !prev)} ref={containerRef} style={style}>
      <Flex alignItems="center" style={{ gap: '4px' }}>
        {selectedNetwork ? (
          <Image minHeight={16} minWidth={16} height={16} width={16} src={NETWORK_ICON[selectedNetwork]} />
        ) : (
          <Kyber size={16} style={{ filter: 'grayscale(1)' }} />
        )}
        <Text color={selectedNetwork ? theme.subText : theme.disableText} fontSize="12px">
          {selectedNetwork ? NETWORK_LABEL[selectedNetwork] : <Trans>All Chains</Trans>}
        </Text>
      </Flex>
      <Flex alignItems="center">
        {selectedNetwork && (
          <X
            size={16}
            color={theme.disableText}
            onClick={e => {
              e.stopPropagation()
              setFilter(prev => ({ ...prev, selectedNetwork: undefined }))
            }}
          />
        )}
        <ChevronDown size={16} color={theme.disableText} />
      </Flex>
      {isShowOptions && (
        <OptionsContainer>
          {Object.values(TRENDING_SOON_SUPPORTED_NETWORKS).map((network, index) => (
            <Flex
              key={index}
              alignItems="center"
              style={{ gap: '4px' }}
              onClick={() => {
                setFilter(prev => ({ ...prev, selectedNetwork: network }))
              }}
            >
              <Image minHeight={16} minWidth={16} height={16} width={16} src={NETWORK_ICON[network]} />
              <Text key={index} color={theme.subText} fontSize="12px">
                <Trans>{NETWORK_LABEL[network]}</Trans>
              </Text>
            </Flex>
          ))}
        </OptionsContainer>
      )}
    </NetworkSelectContainer>
  )
}

export default NetworkSelect
