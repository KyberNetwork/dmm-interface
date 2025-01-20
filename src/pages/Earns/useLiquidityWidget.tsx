import { ChainId, LiquidityWidget, PoolType, ZapOut } from '@kyberswap/liquidity-widgets'
import '@kyberswap/liquidity-widgets/dist/style.css'
import { Dex, ChainId as MigrateChainId, ZapMigration } from '@kyberswap/zap-migration-widgets'
import '@kyberswap/zap-migration-widgets/dist/style.css'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreviousDistinct } from 'react-use'

import { NotificationType } from 'components/Announcement/type'
import Modal from 'components/Modal'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'

import useFilter from './PoolExplorer/useFilter'

interface AddLiquidityPureParams {
  poolAddress: string
  chainId: ChainId
  poolType: PoolType
  positionId?: string
}

interface AddLiquidityParams extends AddLiquidityPureParams {
  source: string
  connectedAccount: {
    address?: string | undefined
    chainId: number
  }
  onClose: () => void
  onConnectWallet: () => void
  onSwitchChain: () => void
  onOpenZapMigration?: (position: { exchange: string; poolId: string; positionId: string | number }) => void
  onSubmitTx: (txData: { from: string; to: string; value: string; data: string; gasLimit: string }) => Promise<string>
}

interface MigrateLiquidityPureParams {
  from: {
    dex: Dex
    poolId: string
    positionId: string | number
  }
  to: {
    dex: Dex
    poolId: string
    positionId?: string | number
  }
  chainId: MigrateChainId
  initialTick?: { tickUpper: number; tickLower: number }
}

interface MigrateLiquidityParams extends MigrateLiquidityPureParams {
  client: string
  connectedAccount: {
    address: string | undefined
    chainId: MigrateChainId
  }
  onClose: () => void
  onConnectWallet: () => void
  onSwitchChain: () => void
  onSubmitTx: (txData: { from: string; to: string; value: string; data: string }) => Promise<string>
}

enum SupporttedExchange {
  UniswapV3 = 'Uniswap V3',
  Pancakev3 = 'PancakeSwap V3',
  Sushiv3 = 'SushiSwap V3',
}

const dexFormatter = {
  [PoolType.DEX_UNISWAPV3]: Dex.Uniswapv3,
  [PoolType.DEX_PANCAKESWAPV3]: Dex.Pancakev3,
  [PoolType.DEX_SUSHISWAPV3]: Dex.Sushiv3,
  [PoolType.DEX_UNISWAPV2]: null,
  [PoolType.DEX_PANCAKESWAPV2]: null,
  [PoolType.DEX_SUSHISWAPV2]: null,
  [PoolType.DEX_QUICKSWAPV2]: null,
  [PoolType.DEX_PANGOLINSTANDARD]: null,
  [PoolType.DEX_THRUSTERV2]: null,
  [PoolType.DEX_SWAPMODEV2]: null,
  [PoolType.DEX_METAVAULTV3]: null,
  [PoolType.DEX_LINEHUBV3]: null,
  [PoolType.DEX_SWAPMODEV3]: null,
  [PoolType.DEX_KOICL]: null,
  [PoolType.DEX_THRUSTERV3]: null,
  [PoolType.DEX_QUICKSWAPV3UNI]: null,
  [SupporttedExchange.UniswapV3]: Dex.Uniswapv3,
  [SupporttedExchange.Pancakev3]: Dex.Pancakev3,
  [SupporttedExchange.Sushiv3]: Dex.Sushiv3,
}

const useLiquidityWidget = () => {
  const toggleWalletModal = useWalletModalToggle()
  const notify = useNotify()
  const { library } = useWeb3React()
  const { account, chainId } = useActiveWeb3React()
  const { filters } = useFilter()

  const [addLiquidityPureParams, setAddLiquidityPureParams] = useState<AddLiquidityPureParams | null>(null)
  const [migrateLiquidityPureParams, setMigrateLiquidityPureParams] = useState<MigrateLiquidityPureParams | null>(null)

  const handleOpenZapMigrationWidget = useCallback(
    (
      position: { exchange: string; poolId: string; positionId: string | number },
      initialTick?: { tickUpper: number; tickLower: number },
    ) => {
      if (!addLiquidityPureParams) return
      if (!dexFormatter[position.exchange as SupporttedExchange]) {
        notify(
          {
            title: `Open liquidity migration widget failed`,
            summary: `Protocol ${position.exchange} is not supported`,
            type: NotificationType.ERROR,
          },
          8000,
        )
        return
      }
      if (!dexFormatter[addLiquidityPureParams.poolType]) {
        notify(
          {
            title: `Open liquidity migration widget failed`,
            summary: `Protocol ${addLiquidityPureParams.poolType} is not supported`,
            type: NotificationType.ERROR,
          },
          8000,
        )
        return
      }
      const paramsToSet = {
        from: {
          dex: dexFormatter[position.exchange as SupporttedExchange],
          poolId: position.poolId,
          positionId: position.positionId,
        },
        to: {
          dex: dexFormatter[addLiquidityPureParams.poolType] as Dex,
          poolId: addLiquidityPureParams.poolAddress,
          positionId: addLiquidityPureParams.positionId,
        },
        chainId: addLiquidityPureParams.chainId as MigrateChainId,
        initialTick,
      }
      setMigrateLiquidityPureParams(paramsToSet)
    },
    [addLiquidityPureParams, notify],
  )

  const handleOpenZapInWidget = (
    pool: { exchange: string; chainId?: number; address: string },
    positionId?: string,
  ) => {
    const supportedDexs = Object.keys(PoolType).map(item => item.replace('DEX_', '').replace('V3', '').toLowerCase())
    const formattedExchange = pool.exchange.toLowerCase().replaceAll('_', '').replaceAll('-', '').replaceAll('v3', '')
    const dex = supportedDexs.find(item => formattedExchange.includes(item) || item.includes(formattedExchange))
    if (!dex) {
      notify(
        {
          title: `Open pool detail failed`,
          summary: `Protocol ${pool.exchange} on ${
            NETWORKS_INFO[String(pool?.chainId || filters.chainId) as unknown as keyof typeof NETWORKS_INFO]?.name ||
            'this network'
          } is not supported`,
          type: NotificationType.ERROR,
        },
        8000,
      )
      return
    }
    setAddLiquidityPureParams({
      poolAddress: pool.address,
      chainId: (pool.chainId || filters.chainId) as ChainId,
      poolType: PoolType[`DEX_${dex.toUpperCase()}V3` as keyof typeof PoolType],
      positionId,
    })
  }

  const { changeNetwork } = useChangeNetwork()
  const navigate = useNavigate()

  const addLiquidityParams: AddLiquidityParams | null = useMemo(
    () =>
      addLiquidityPureParams
        ? {
            ...addLiquidityPureParams,
            source: 'KyberSwap-Earn',
            onViewPosition: () => {
              setAddLiquidityPureParams(null)
              navigate(`/earns/positions`)
            },
            connectedAccount: {
              address: account,
              chainId: chainId,
            },
            onClose: () => setAddLiquidityPureParams(null),
            onConnectWallet: toggleWalletModal,
            onSwitchChain: () => changeNetwork(addLiquidityPureParams.chainId as number),
            onOpenZapMigration: handleOpenZapMigrationWidget,
            onSubmitTx: async (txData: { from: string; to: string; data: string; value: string; gasLimit: string }) => {
              try {
                if (!library) throw new Error('Library is not ready!')
                const res = await library?.getSigner().sendTransaction(txData)
                if (!res) throw new Error('Transaction failed')
                return res.hash
              } catch (e) {
                console.log(e)
                throw e
              }
            },
          }
        : null,
    [
      addLiquidityPureParams,
      account,
      chainId,
      toggleWalletModal,
      handleOpenZapMigrationWidget,
      library,
      changeNetwork,
      navigate,
    ],
  )

  const migrateLiquidityParams: MigrateLiquidityParams | null = useMemo(
    () =>
      migrateLiquidityPureParams
        ? {
            ...migrateLiquidityPureParams,
            client: 'KyberSwap-Earn',
            connectedAccount: {
              address: account,
              chainId: chainId as unknown as MigrateChainId,
            },
            onViewPosition: () => {
              setMigrateLiquidityPureParams(null)
              navigate(`/earns/positions`)
            },

            onClose: () => {
              setMigrateLiquidityPureParams(null)
              setAddLiquidityPureParams(null)
            },
            onBack: () => setMigrateLiquidityPureParams(null),
            onConnectWallet: toggleWalletModal,
            onSwitchChain: () => changeNetwork(migrateLiquidityPureParams.chainId as number),
            onSubmitTx: async (txData: { from: string; to: string; value: string; data: string }) => {
              try {
                if (!library) throw new Error('Library is not ready!')
                const res = await library?.getSigner().sendTransaction(txData)
                if (!res) throw new Error('Transaction failed')
                return res.hash
              } catch (e) {
                console.log(e)
                throw e
              }
            },
          }
        : null,
    [account, chainId, library, migrateLiquidityPureParams, changeNetwork, toggleWalletModal, navigate],
  )

  const [zapOutPureParams, setZapOutPureParams] = useState<{
    positionId: string
    poolType: PoolType
    poolAddress: string
    chainId: ChainId
  } | null>(null)
  const zapOutParams = useMemo(
    () =>
      zapOutPureParams
        ? {
            ...zapOutPureParams,
            source: 'KyberSwap-Earn',
            connectedAccount: {
              address: account,
              chainId: chainId as unknown as MigrateChainId,
            },
            onClose: () => setZapOutPureParams(null),
            onConnectWallet: toggleWalletModal,
            onSwitchChain: () => changeNetwork(zapOutPureParams.chainId as number),
            onSubmitTx: async (txData: { from: string; to: string; value: string; data: string }) => {
              try {
                if (!library) throw new Error('Library is not ready!')
                const res = await library?.getSigner().sendTransaction(txData)
                if (!res) throw new Error('Transaction failed')
                return res.hash
              } catch (e) {
                console.log(e)
                throw e
              }
            },
          }
        : null,
    [account, chainId, changeNetwork, library, toggleWalletModal, zapOutPureParams],
  )

  const handleOpenZapOut = (position: { dex: string; chainId: number; poolAddress: string; id: string }) => {
    const poolType = (() => {
      switch (position?.dex) {
        case 'Uniswap V3':
          return PoolType.DEX_UNISWAPV3
        case 'SushiSwap V3':
          return PoolType.DEX_SUSHISWAPV3
        case 'PancakeSwap V3':
          return PoolType.DEX_PANCAKESWAPV3
        default:
          return null
      }
    })()
    if (!poolType) {
      notify(
        {
          type: NotificationType.ERROR,
          title: 'Pool Type is supported',
        },
        5_000,
      )
      return
    }

    setZapOutPureParams({
      poolType,
      chainId: position.chainId as ChainId,
      poolAddress: position.poolAddress,
      positionId: position.id,
    })
  }

  const previousAccount = usePreviousDistinct(account)
  useEffect(() => {
    if (account && previousAccount) {
      setAddLiquidityPureParams(null)
      setMigrateLiquidityPureParams(null)
      setZapOutPureParams(null)
    }
  }, [account, previousAccount])

  const liquidityWidget = (
    <>
      {addLiquidityParams && (
        <Modal isOpen mobileFullWidth maxWidth={760} width={'760px'} onDismiss={() => setAddLiquidityPureParams(null)}>
          <LiquidityWidget {...addLiquidityParams} />
        </Modal>
      )}
      {migrateLiquidityParams && (
        <Modal
          isOpen
          mobileFullWidth
          maxWidth={760}
          width={'760px'}
          onDismiss={() => {
            setMigrateLiquidityPureParams(null)
            setAddLiquidityPureParams(null)
          }}
          zindex={9999}
        >
          <ZapMigration {...migrateLiquidityParams} />
        </Modal>
      )}
      {zapOutParams && (
        <Modal isOpen mobileFullWidth maxWidth={760} width={'760px'} onDismiss={() => setZapOutPureParams(null)}>
          <ZapOut {...zapOutParams} />
        </Modal>
      )}
    </>
  )

  return { liquidityWidget, handleOpenZapInWidget, handleOpenZapOut }
}

export default useLiquidityWidget
