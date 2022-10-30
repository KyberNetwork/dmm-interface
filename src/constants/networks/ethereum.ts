import { ChainId } from '@namgold/ks-sdk-core'

import EthereumLogo from 'assets/images/ethereum-logo.png'
import Mainnet from 'assets/networks/mainnet-network.svg'
import { KS_SETTING_API, META_AGGREGATOR_API } from 'constants/env'
import { EVMNetworkInfo } from 'constants/networks/type'
import { createClient } from 'utils/client'

const EMPTY = ''
const EMPTY_ARRAY: any[] = []
const NOT_SUPPORT = null

const ethereumInfo: EVMNetworkInfo = {
  chainId: ChainId.MAINNET,
  route: 'ethereum',
  ksSettingRoute: 'ethereum',
  priceRoute: 'ethereum',
  name: 'Ethereum',
  icon: Mainnet,
  iconDark: NOT_SUPPORT,
  iconSelected: NOT_SUPPORT,
  iconDarkSelected: NOT_SUPPORT,
  classicClient: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-exchange-ethereum'),
  elasticClient: createClient('https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-mainnet'),
  blockClient: createClient('https://api.thegraph.com/subgraphs/name/dynamic-amm/ethereum-blocks-ethereum'),
  etherscanUrl: 'https://etherscan.io',
  etherscanName: 'Etherscan',
  tokenListUrl: `${KS_SETTING_API}/v1/tokens?chainIds=${ChainId.MAINNET}&isWhitelisted=${true}`,
  bridgeURL: EMPTY,
  nativeToken: {
    symbol: 'ETH',
    name: 'Ether',
    logo: EthereumLogo,
    decimal: 18,
  },
  rpcUrl: 'https://ethereum.kyberengineering.io',
  routerUri: `${META_AGGREGATOR_API}/ethereum/route/encode`,
  multicall: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
  classic: {
    static: {
      zap: '0x2abE8750e4a65584d7452316356128C936273e0D',
      router: '0x5649B4DD00780e99Bab7Abb4A3d581Ea1aEB23D0',
      factory: '0x1c758aF0688502e49140230F6b0EBd376d429be5',
    },
    oldStatic: NOT_SUPPORT,
    dynamic: {
      zap: '0x83D4908c1B4F9Ca423BEE264163BC1d50F251c31',
      router: '0x1c87257F5e8609940Bc751a07BB085Bb7f8cDBE6',
      factory: '0x833e4083B7ae46CeA85695c4f7ed25CDAd8886dE',
    },
    claimReward: NOT_SUPPORT,
    fairlaunch: [
      '0xc0601973451d9369252Aee01397c0270CD2Ecd60',
      '0x0FEEa33C4dE6f37A0Fc550028FddA2401B2Ee5Ce',
      '0xc93239B33239A901143e15473e4A852a0D92c53b',
      '0x31De05f28568e3d3D612BFA6A78B356676367470',
    ],
    fairlaunchV2: EMPTY_ARRAY,
  },
  elastic: {
    coreFactory: '0x5F1dddbf348aC2fbe22a163e30F99F9ECE3DD50a',
    nonfungiblePositionManager: '0x2B1c7b41f6A8F2b2bc45C3233a5d5FB3cD6dC9A8',
    tickReader: '0x165c68077ac06c83800d19200e6E2B08D02dE75D',
    initCodeHash: '0xc597aba1bb02db42ba24a8878837965718c032f8b46be94a6e46452a9f89ca01',
    quoter: '0x0D125c15D54cA1F8a813C74A81aEe34ebB508C1f',
    routers: '0xC1e7dFE73E1598E3910EF4C7845B68A9Ab6F4c83',
  },
  averageBlockTimeInSeconds: 13.13,
  coingeckoNetworkId: 'ethereum',
  coingeckoNativeTokenId: 'ethereum',
  deBankSlug: 'eth',
  trueSightId: 'eth',
}

export default ethereumInfo
