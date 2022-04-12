import React, { ReactNode, useRef, useState } from 'react'
import { CheckCircle, ChevronDown, Copy } from 'react-feather'
import styled from 'styled-components'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { OptionsContainer } from 'pages/TrueSight/styled'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { Box, Flex } from 'rebass'
import useTheme from 'hooks/useTheme'
import { isAddress, shortenAddress } from 'utils'
import { NETWORK_ICON, TRUESIGHT_NETWORK_TO_CHAINID } from 'constants/networks'

function AddressButtonItself({
  network,
  address,
  isInOptionContainer,
  isDisableChevronDown,
  optionRender,
  toggleShowOptions,
}: {
  network: string
  address: string
  isInOptionContainer?: boolean
  isDisableChevronDown?: boolean
  optionRender?: ReactNode
  toggleShowOptions?: () => void
}) {
  const theme = useTheme()
  const [isCopied, setCopied] = useCopyClipboard()

  const onCopy = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.stopPropagation()
    setCopied(isAddress(address) || address)
  }

  const mappedChainId = network ? TRUESIGHT_NETWORK_TO_CHAINID[network] : undefined

  const getShortenAddress = (address: string) => {
    try {
      return shortenAddress(address)
    } catch (err) {
      return address.length > 13 ? address.substr(0, 6) + '...' + address.slice(-4) : address
    }
  }

  return (
    <StyledAddressButton isInOptionContainer={isInOptionContainer}>
      {address && mappedChainId && (
        <>
          <img src={NETWORK_ICON[mappedChainId]} alt="Network" style={{ minWidth: '16px', width: '16px' }} />
          <AddressCopyContainer onClick={onCopy}>
            <div style={{ width: '90px' }}>{getShortenAddress(address)}</div>
            {isCopied ? <CheckCircle size={'14'} /> : <Copy size={'14'} />}
          </AddressCopyContainer>
          <ChevronDownWrapper
            style={{
              visibility: isInOptionContainer ? 'hidden' : 'visible',
            }}
            onClick={() => !isDisableChevronDown && toggleShowOptions && toggleShowOptions()}
          >
            <ChevronDown
              size="16px"
              cursor="pointer"
              color={isDisableChevronDown ? theme.disableText : theme.subText}
              style={{
                cursor: isDisableChevronDown ? 'not-allowed' : 'pointer',
              }}
            />
          </ChevronDownWrapper>
        </>
      )}
      {optionRender}
    </StyledAddressButton>
  )
}

export default function AddressButton({ platforms }: { platforms: Map<string, string> }) {
  const [isShowOptions, setIsShowOptions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const toggleShowOptions = () => platforms.size >= 2 && setIsShowOptions(prev => !prev)

  useOnClickOutside(containerRef, () => setIsShowOptions(false))

  const defaultNetwork = platforms.size ? platforms.keys().next().value : ''
  const defaultAddress = defaultNetwork ? platforms.get(defaultNetwork) ?? '' : ''

  const optionRender = isShowOptions ? (
    <OptionsContainer>
      {Array.from(platforms.keys())
        .slice(1)
        .map(network => (
          <AddressButtonItself
            key={network}
            network={network}
            address={platforms.get(network) ?? ''}
            isInOptionContainer={true}
            isDisableChevronDown={false}
          />
        ))}
    </OptionsContainer>
  ) : null

  if (platforms.size === 0) return null

  return (
    <Box ref={containerRef}>
      <AddressButtonItself
        network={defaultNetwork}
        address={defaultAddress}
        isInOptionContainer={false}
        isDisableChevronDown={platforms.size < 2}
        optionRender={optionRender}
        toggleShowOptions={toggleShowOptions}
      />
    </Box>
  )
}

const AddressCopyContainer = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    color: ${({ theme }) => theme.disableText};
  }
`

const ChevronDownWrapper = styled.div`
  &:hover {
    color: ${({ theme }) => theme.disableText};
  }
`

export const StyledAddressButton = styled(Flex)<{ isInOptionContainer?: boolean }>`
  align-items: center;
  padding: 4.5px 12px;
  gap: 4px;
  width: fit-content;
  font-size: 12px;
  line-height: 14px;
  color: ${({ theme }) => theme.subText};
  background: ${({ theme, isInOptionContainer }) => (isInOptionContainer ? 'transparent' : theme.buttonBlack)};
  border-radius: ${({ isInOptionContainer }) => (isInOptionContainer ? '0' : '4px')};
  position: relative;
`
