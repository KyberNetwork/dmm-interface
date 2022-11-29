import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { UnsupportedChainIdError } from '@web3-react/core'
import { stringify } from 'qs'
import { useCallback, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { NETWORKS_INFO, SUPPORTED_NETWORKS } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { updateChainIdWhenNotConnected } from 'state/application/actions'
import { NotificationType, useNotify } from 'state/application/hooks'
import { useAppDispatch } from 'state/hooks'

import useParsedQueryString from './useParsedQueryString'

const getAddNetworkParams = (chainId: ChainId) => ({
  chainId: '0x' + chainId.toString(16),
  chainName: NETWORKS_INFO[chainId].name,
  nativeCurrency: {
    name: NETWORKS_INFO[chainId].nativeToken.symbol,
    symbol: NETWORKS_INFO[chainId].nativeToken.symbol,
    decimals: NETWORKS_INFO[chainId].nativeToken.decimal,
  },
  rpcUrls: [NETWORKS_INFO[chainId].rpcUrl],
  blockExplorerUrls: [NETWORKS_INFO[chainId].etherscanUrl],
})

/**
 * Given a network string (e.g. from user agent), return the best match for corresponding SupportedNetwork
 * @param maybeSupportedNetwork the fuzzy network identifier, can be networkId (1, 137, ...) or networkName (ethereum, polygon, ...)
 */
function parseNetworkId(maybeSupportedNetwork: string): ChainId | undefined {
  return SUPPORTED_NETWORKS.find(chainId => {
    return chainId.toString() === maybeSupportedNetwork || NETWORKS_INFO[chainId].route === maybeSupportedNetwork
  })
}

export function useActiveNetwork() {
  const { chainId, library, error } = useActiveWeb3React()
  const navigate = useNavigate()
  const location = useLocation()
  const qs = useParsedQueryString()
  const dispatch = useAppDispatch()
  const notify = useNotify()

  const showError = useCallback(
    (chainId: ChainId) =>
      notify({
        title: t`Failed to switch network`,
        type: NotificationType.ERROR,
        summary: t`In order to use KyberSwap on ${NETWORKS_INFO[chainId].name}, you must change the network in your wallet.`,
      }),
    [notify],
  )

  const locationWithoutNetworkId = useMemo(() => {
    // Delete networkId from qs object
    const { networkId, ...qsWithoutNetworkId } = qs
    return { ...location, search: stringify({ ...qsWithoutNetworkId }) }
  }, [location, qs])

  const changeNetwork = useCallback(
    async (desiredChainId: ChainId, successCallback?: () => void, failureCallback?: () => void) => {
      const switchNetworkParams = {
        chainId: '0x' + Number(desiredChainId).toString(16),
      }
      const addNetworkParams = getAddNetworkParams(desiredChainId)

      const isNotConnected = !(library && library.provider)
      const isWrongNetwork = error instanceof UnsupportedChainIdError
      if (isNotConnected && !isWrongNetwork) {
        dispatch(updateChainIdWhenNotConnected(desiredChainId))
        successCallback && successCallback()
        return
      }

      navigate(locationWithoutNetworkId)
      const activeProvider = library?.provider ?? window.ethereum
      if (activeProvider && activeProvider.request) {
        try {
          await activeProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [switchNetworkParams],
          })
          successCallback?.()
        } catch (switchError) {
          // This is a workaround solution for Coin98
          const isSwitchError = typeof switchError === 'object' && switchError && Object.keys(switchError)?.length === 0
          // This error code indicates that the chain has not been added to MetaMask.
          if ([4902, -32603, -32002].includes(switchError?.code) || isSwitchError) {
            try {
              await activeProvider.request({ method: 'wallet_addEthereumChain', params: [addNetworkParams] })
              try {
                await activeProvider.request({
                  method: 'wallet_switchEthereumChain',
                  params: [switchNetworkParams],
                })
              } catch {
                showError(desiredChainId)
              }
              successCallback?.()
            } catch (addError) {
              console.error('retry switch network error', addError)
              // user deny
              if (addError?.code === 4001) {
                showError(desiredChainId)
              }
              failureCallback?.()
            }
          } else {
            // handle other "switch" errors
            console.error('switch network error', switchError)
            failureCallback?.()
            showError(desiredChainId)
          }
        }
      }
    },
    [dispatch, navigate, library, locationWithoutNetworkId, error, showError],
  )

  useEffect(() => {
    const urlNetworkId = typeof qs.networkId === 'string' ? parseNetworkId(qs.networkId) : undefined
    if (urlNetworkId && urlNetworkId !== chainId) {
      changeNetwork(urlNetworkId)
    }
  }, [chainId, changeNetwork, qs.networkId])

  return { changeNetwork }
}
