import { t } from '@lingui/macro'
import { ChainId } from '@namgold/ks-sdk-core'
import { UnsupportedChainIdError } from '@web3-react/core'
import { useCallback, useEffect } from 'react'

import { EVM_NETWORK, NETWORKS_INFO, SUPPORTED_NETWORKS, isEVM, isSolana } from 'constants/networks'
import { SUPPORTED_WALLETS } from 'constants/wallets'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { NotificationType, useNotify } from 'state/application/hooks'
import { useAppDispatch } from 'state/hooks'
import { updateChainId } from 'state/user/actions'
import { isEVMWallet, isSolanaWallet } from 'utils'

import { useActivationWallet } from './useActivationWallet'
import useParsedQueryString from './useParsedQueryString'

const getEVMAddNetworkParams = (chainId: EVM_NETWORK) => ({
  chainId: '0x' + chainId.toString(16),
  chainName: NETWORKS_INFO[chainId].name,
  nativeCurrency: {
    name: NETWORKS_INFO[chainId].nativeToken.name,
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

export function useChangeNetwork() {
  const { chainId, walletKey, walletEVM } = useActiveWeb3React()
  const { library, error } = useWeb3React()
  const { tryActivationEVM, tryActivationSolana } = useActivationWallet()

  const qs = useParsedQueryString<{ networkId: string }>()
  const dispatch = useAppDispatch()
  const notify = useNotify()

  const changeNetworkHandler = useCallback(
    (desiredChainId: ChainId, successCallback?: () => void) => {
      dispatch(updateChainId(desiredChainId))
      successCallback?.()
    },
    [dispatch],
  )

  const changeNetwork = useCallback(
    async (desiredChainId: ChainId, successCallback?: () => void, failureCallback?: () => void) => {
      if (desiredChainId === chainId) return
      const wallet = walletKey && SUPPORTED_WALLETS[walletKey]
      if (wallet && isEVMWallet(wallet) && !isSolana(desiredChainId)) {
        tryActivationEVM(wallet.connector)
      }
      if (wallet && isSolanaWallet(wallet) && !isEVM(desiredChainId)) {
        tryActivationSolana(wallet.adapter)
      }
      if (isEVM(desiredChainId)) {
        const switchNetworkParams = {
          chainId: '0x' + Number(desiredChainId).toString(16),
        }
        const isWrongNetwork = error instanceof UnsupportedChainIdError
        // If not connected EVM wallet, or connected EVM wallet and want to switch back to EVM network
        if (
          (!walletEVM.isConnected && !isWrongNetwork) ||
          (walletEVM.isConnected && walletEVM.chainId === desiredChainId)
        ) {
          changeNetworkHandler(desiredChainId, successCallback)
          return
        }

        //history.push(locationWithoutNetworkId)
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
            const isSwitchError =
              typeof switchError === 'object' && switchError && Object.keys(switchError)?.length === 0
            // This error code indicates that the chain has not been added to MetaMask.
            if (switchError?.code === 4902 || switchError?.code === -32603 || isSwitchError) {
              try {
                const addNetworkParams = getEVMAddNetworkParams(desiredChainId)
                await activeProvider.request({ method: 'wallet_addEthereumChain', params: [addNetworkParams] })
              } catch (addError) {
                notify({
                  title: t`Failed to switch network`,
                  type: NotificationType.ERROR,
                  summary: t`In order to use KyberSwap on ${NETWORKS_INFO[desiredChainId].name}, you must accept the network in your wallet.`,
                })
                failureCallback?.()
              }
            } else {
              // handle other "switch" errors
              failureCallback?.()
              notify({
                title: t`Failed to switch network`,
                type: NotificationType.ERROR,
                summary: t`In order to use KyberSwap on ${NETWORKS_INFO[desiredChainId].name}, you must change the network in your wallet.`,
              })
            }
          }
        }
      } else {
        changeNetworkHandler(desiredChainId, successCallback)
      }
    },
    [
      library,
      error,
      notify,
      changeNetworkHandler,
      tryActivationEVM,
      tryActivationSolana,
      walletKey,
      walletEVM.isConnected,
      walletEVM.chainId,
      chainId,
    ],
  )

  useEffect(() => {
    const urlNetworkId = typeof qs.networkId === 'string' ? parseNetworkId(qs.networkId) : undefined
    if (urlNetworkId && urlNetworkId !== chainId) {
      changeNetwork(urlNetworkId)
    }
  }, [chainId, changeNetwork, qs.networkId])

  return changeNetwork
}
