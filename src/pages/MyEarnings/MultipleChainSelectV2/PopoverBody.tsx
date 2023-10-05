import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { MouseEventHandler, useEffect, useRef, useState } from 'react'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as LogoKyber } from 'assets/svg/logo_kyber.svg'
import { ButtonPrimary } from 'components/Button'
import Checkbox from 'components/CheckBox'
import { MouseoverTooltip } from 'components/Tooltip'
import { NETWORKS_INFO } from 'constants/networks'
import useChainsConfig from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'

import { MultipleChainSelectProps, StyledLogo } from '.'

const ChainListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 180px;
  overflow: auto;

  /* width */
  ::-webkit-scrollbar {
    display: unset;
    width: 8px;
    border-radius: 999px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 999px;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => rgba(theme.subText, 0.4)};
    border-radius: 999px;
  }
`

type ApplyButtonProps = {
  disabled: boolean
  onClick: MouseEventHandler<HTMLButtonElement>
  numOfChains: number
}

export const ApplyButton: React.FC<ApplyButtonProps> = ({ disabled, onClick, numOfChains }) => {
  const theme = useTheme()
  return (
    <ButtonPrimary
      disabled={disabled}
      style={{
        height: '40px',
        padding: '0 12px',
      }}
      onClick={onClick}
    >
      <Flex
        as="span"
        sx={{
          width: '100%',
          display: 'inline-flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <Trans>View Selected Chains</Trans>
        <Flex
          as="span"
          sx={{
            width: '22px',
            height: '22px',
            borderRadius: '999px',
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: disabled ? undefined : theme.darkText,
            color: disabled ? theme.border : theme.primary,
          }}
        >
          {numOfChains ? String(numOfChains).padStart(2, '0') : 0}
        </Flex>
      </Flex>
    </ButtonPrimary>
  )
}

const PopoverBody: React.FC<MultipleChainSelectProps & { onClose: () => void }> = ({
  onClose,
  comingSoonList = [],
  chainIds,
  selectedChainIds,
  handleChangeChains,
  onTracking,
  menuStyle,
}) => {
  const theme = useTheme()
  const selectAllRef = useRef<HTMLInputElement>(null)

  const { activeChains } = useChainsConfig()
  const selectedChains = selectedChainIds.filter(item => !comingSoonList.includes(item))

  const [localSelectedChains, setLocalSelectedChains] = useState(() => selectedChains)

  const networkList = chainIds.filter(
    item => !comingSoonList.includes(item) && activeChains.some(e => e.chainId === item),
  )

  const isAllSelected = localSelectedChains.length === networkList.length

  useEffect(() => {
    setLocalSelectedChains(selectedChains)
    // eslint-disable-next-line
  }, [selectedChains.length])

  useEffect(() => {
    if (!selectAllRef.current) {
      return
    }

    const indeterminate = 0 < localSelectedChains.length && localSelectedChains.length < networkList.length
    selectAllRef.current.indeterminate = indeterminate
  }, [localSelectedChains, networkList.length])

  const allNetworks = [...networkList, ...comingSoonList]

  const onChangeChain = () => {
    if (isAllSelected) {
      setLocalSelectedChains([])
    } else {
      onTracking?.()
      setLocalSelectedChains(networkList)
    }
  }

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        borderRadius: '20px',
        background: theme.tableHeader,
        width: '250px',
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: '0',
        ...menuStyle,
      }}
    >
      <Flex
        sx={{
          alignItems: 'center',
          gap: '8px',
          padding: '4px',
        }}
      >
        <Checkbox type="checkbox" checked={isAllSelected} ref={selectAllRef} onChange={onChangeChain} />

        <Flex width="20px" alignItems="center" justifyContent="center">
          <LogoKyber width="14px" height="auto" color={theme.primary} />
        </Flex>

        <Text
          as="span"
          sx={{
            fontWeight: 500,
            fontSize: '14px',
            lineHeight: '20px',
            color: theme.text,
          }}
        >
          <Trans>All Chains</Trans>
        </Text>
      </Flex>

      <ChainListWrapper>
        {allNetworks.map((network, i) => {
          const config = NETWORKS_INFO[network]

          const isComingSoon = comingSoonList.includes(network)
          const isSelected = isComingSoon ? false : localSelectedChains.includes(network)

          const handleClick = () => {
            if (isComingSoon) return
            if (isSelected) {
              setLocalSelectedChains(localSelectedChains.filter(chain => chain !== network))
            } else {
              setLocalSelectedChains([...localSelectedChains, network])
            }
          }

          return (
            <MouseoverTooltip
              key={i}
              text={isComingSoon ? 'Coming soon' : ''}
              width="fit-content"
              placement="top"
              containerStyle={{ width: 'fit-content' }}
            >
              <Flex
                onClick={handleClick}
                sx={{
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px',
                  cursor: isComingSoon ? 'not-allowed' : 'pointer',
                  userSelect: 'none',
                  opacity: isComingSoon ? 0.6 : 1,
                }}
              >
                <Checkbox type="checkbox" checked={isSelected} onChange={handleClick} />

                <StyledLogo src={theme.darkMode && config.iconDark ? config.iconDark : config.icon} />

                <Text
                  as="span"
                  sx={{
                    fontWeight: 500,
                    fontSize: '14px',
                    lineHeight: '20px',
                    color: theme.text,
                  }}
                >
                  {config.name}
                </Text>
              </Flex>
            </MouseoverTooltip>
          )
        })}
      </ChainListWrapper>

      <Box
        sx={{
          width: '100%',
          height: '0',
          borderBottom: `1px solid ${theme.border}`,
        }}
      />

      <ApplyButton
        disabled={!localSelectedChains.length}
        onClick={() => {
          handleChangeChains(localSelectedChains)
          onClose()
        }}
        numOfChains={localSelectedChains.length}
      />
    </Flex>
  )
}

export default PopoverBody
