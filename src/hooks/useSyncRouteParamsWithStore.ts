import { isEVM, isSolana, NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useEagerConnect } from 'hooks'
import { useEffect, useRef } from 'react'
import { useHistory, useParams, useRouteMatch } from 'react-router-dom'
import { useChangeNetwork } from './useChangeNetwork'

export function useSyncRouteParamsWithStore() {
  const params = useParams<{ network?: string }>()
  const changeNetwork = useChangeNetwork()
  const { networkInfo, walletEVM, walletSolana } = useActiveWeb3React()
  const isOnInit = useRef(true)
  const history = useHistory()
  const match = useRouteMatch()
  const triedEager = useEagerConnect()

  useEffect(() => {
    if (!params?.network) {
      isOnInit.current = false
      return
    }
    const paramChainId = Object.values(NETWORKS_INFO).find(n => n.route === params?.network)?.chainId
    if (isOnInit.current) {
      /**
       * Try to change to network on route param on init. Exp: /swap/ethereum => try to connect to ethereum on init
       * @param isOnInit.current: make sure only run 1 time after init
       * @param triedEager: only run after tried to connect injected wallet
       */
      ;(async () => {
        if (paramChainId && isEVM(paramChainId)) {
          await changeNetwork(paramChainId, undefined, () => {
            history.replace({ pathname: match.path.replace(':network', networkInfo.route) })
          })
          isOnInit.current = false
        } else if (paramChainId && isSolana(paramChainId)) {
          await changeNetwork(paramChainId, () => {
            isOnInit.current = false
          })
        }
      })()
    }
  }, [
    changeNetwork,
    history,
    params?.network,
    match.path,
    networkInfo.route,
    walletEVM.isConnected,
    walletSolana.isConnected,
  ])

  useEffect(() => {
    /**
     * Sync network route param on with current active network, only after eager tried
     */
    if (networkInfo.route !== params?.network && !isOnInit.current && triedEager) {
      history.replace({ pathname: match.path.replace(':network', networkInfo.route) })
    }
  }, [networkInfo.route, history, triedEager, match.path, params?.network])
}
