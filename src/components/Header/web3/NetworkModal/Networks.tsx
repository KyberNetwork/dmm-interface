import { ChainId, getChainType } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { darken, rgba } from 'polished'
import { stringify } from 'querystring'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonEmpty } from 'components/Button'
import { MouseoverTooltip } from 'components/Tooltip'
import { NetworkInfo } from 'constants/networks/type'
import { Z_INDEXS } from 'constants/styles'
import { SUPPORTED_WALLETS } from 'constants/wallets'
import { useActiveWeb3React } from 'hooks'
import useChainsConfig, { ChainState } from 'hooks/useChainsConfig'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'

const NewLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.red};
  margin-left: 2px;
  margin-top: -10px;
`

const MaintainLabel = styled.span`
  font-size: 8px;
  color: ${({ theme }) => theme.red};
  margin-left: 2px;
  margin-top: -10px;
`

const ListItem = styled.div<{ selected?: boolean }>`
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 10px 8px;
  border-radius: 999px;
  overflow: hidden;
  white-space: nowrap;
  font-size: 14px;
  height: 36px;
  ${({ theme, selected }) =>
    selected &&
    css`
      background-color: ${theme.buttonBlack};
      & > div {
        color: ${theme.text};
      }
    `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 12px;
  `}
`

const SelectNetworkButton = styled(ButtonEmpty)<{ disabled: boolean }>`
  color: ${({ theme }) => theme.primary};
  background-color: ${({ theme }) => theme.tableHeader};
  display: flex;
  justify-content: center;
  align-items: center;
  height: fit-content;
  text-decoration: none;
  transition: all 0.1s ease;
  &:hover {
    background-color: ${({ theme }) => darken(0.1, theme.tableHeader)};
    color: ${({ theme }) => theme.text} !important;
  }
  &:disabled {
    opacity: 50%;
    cursor: not-allowed;
    &:hover {
      border: 1px solid transparent;
    }
  }
`
const gap = '1rem'
const NetworkList = styled.div<{ mt: number; mb: number }>`
  display: flex;
  align-items: center;
  gap: ${gap};
  flex-wrap: wrap;
  width: 100%;
  margin-top: ${({ mt }) => mt}px;
  margin-bottom: ${({ mb }) => mb}px;
  & > * {
    width: calc(33.33% - ${gap} * 2 / 3);
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
    & > * {
      width: calc(50% - ${gap} / 2);
    }
  `}
`

const CircleGreen = styled.div`
  height: 16px;
  width: 16px;
  background-color: ${({ theme }) => theme.primary};
  background-clip: content-box;
  border: solid 2px ${({ theme }) => rgba(theme.primary, 0.3)};
  border-radius: 8px;
  margin-left: auto;
`
const WalletWrapper = styled.div`
  height: 18px;
  width: 18px;
  margin-left: auto;
  margin-right: 4px;
  > img {
    height: 18px;
    width: 18px;
  }
`

const Networks = ({
  onChangedNetwork,
  mt = 30,
  mb = 0,
  isAcceptedTerm = true,
  activeChainIds,
  selectedId,
  customOnSelectNetwork,
  customToggleModal,
  disabledMsg,
}: {
  onChangedNetwork?: () => void
  mt?: number
  mb?: number
  isAcceptedTerm?: boolean
  activeChainIds?: ChainId[]
  selectedId?: ChainId
  customOnSelectNetwork?: (chainId: ChainId) => void
  customToggleModal?: () => void
  disabledMsg?: string
}) => {
  const { chainId: currentChainId, isWrongNetwork, walletEVM, walletSolana } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const qs = useParsedQueryString()
  const navigate = useNavigate()
  const theme = useTheme()
  const onSelect = (chainId: ChainId) => {
    customToggleModal?.()
    if (customOnSelectNetwork) {
      customOnSelectNetwork(chainId)
    } else if (getChainType(currentChainId) === getChainType(chainId)) {
      changeNetwork(chainId, () => {
        const { inputCurrency, outputCurrency, ...rest } = qs
        navigate(
          {
            search: stringify(rest),
          },
          { replace: true },
        )
        onChangedNetwork?.()
      })
    } else {
      changeNetwork(chainId, () => {
        navigate(
          {
            search: '',
          },
          { replace: true },
        )
        onChangedNetwork?.()
      })
    }
  }

  const { supportedChains } = useChainsConfig()

  return (
    <NetworkList mt={mt} mb={mb}>
      {supportedChains.map(({ chainId: itemChainId, icon, name, state }: NetworkInfo, i: number) => {
        const isMaintenance = state === ChainState.MAINTENANCE
        const disabled =
          !isAcceptedTerm || (activeChainIds ? !activeChainIds?.includes(itemChainId) : false) || isMaintenance
        const selected = selectedId === itemChainId && !isWrongNetwork

        const imgSrc = icon
        const walletKey =
          itemChainId === ChainId.SOLANA
            ? walletSolana.walletKey
            : walletEVM.chainId === itemChainId
            ? walletEVM.walletKey
            : null
        return (
          <MouseoverTooltip
            style={{ zIndex: Z_INDEXS.MODAL + 1 }}
            key={itemChainId}
            text={
              disabled
                ? isMaintenance
                  ? t`Chain under maintenance. We will be back as soon as possible.`
                  : disabledMsg
                : ''
            }
            width="fit-content"
          >
            <SelectNetworkButton
              key={i}
              padding="0"
              onClick={() => !selected && onSelect(itemChainId)}
              data-testid="network-button"
              disabled={disabled}
            >
              <ListItem selected={selected}>
                <img src={imgSrc} alt="Switch Network" style={{ height: '20px', width: '20px', marginRight: '8px' }} />
                <Flex
                  sx={{
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                  }}
                >
                  <Text color={theme.subText} as="span" textAlign="left">
                    {name}
                  </Text>
                </Flex>
                {state === ChainState.NEW && (
                  <NewLabel>
                    <Trans>New</Trans>
                  </NewLabel>
                )}
                {isMaintenance && (
                  <MaintainLabel>
                    <Trans>Maintainance</Trans>
                  </MaintainLabel>
                )}
                {selected && !walletKey && <CircleGreen />}
                {walletKey && (
                  <WalletWrapper>
                    <img src={SUPPORTED_WALLETS[walletKey].icon} alt={SUPPORTED_WALLETS[walletKey].name + ' icon'} />
                  </WalletWrapper>
                )}
              </ListItem>
            </SelectNetworkButton>
          </MouseoverTooltip>
        )
      })}
    </NetworkList>
  )
}

export default React.memo(Networks)
