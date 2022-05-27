import { ChainId } from '@vutien/sdk-core'
// a list of tokens by chain
type ChainStringList = {
  readonly [chainId in ChainId]: string
}
const V2_CORE_FACTORY_ADDRESS = '0x2D2B8D5093d0288Da2473459545FE7a2f057bd7D'
export const PRO_AMM_CORE_FACTORY_ADDRESSES: ChainStringList = {
  [ChainId.MAINNET]: V2_CORE_FACTORY_ADDRESS,
  [ChainId.ROPSTEN]: '0x48f6D7dAE56623Dde5a0D56B283165cAE1753D70',
  [ChainId.RINKEBY]: '0x54A8d6358c559E446dca7a9bA089152b9CbaBBf5',
  [ChainId.GÖRLI]: V2_CORE_FACTORY_ADDRESS,
  [ChainId.KOVAN]: V2_CORE_FACTORY_ADDRESS,
  [ChainId.MATIC]: V2_CORE_FACTORY_ADDRESS,
  [ChainId.MUMBAI]: V2_CORE_FACTORY_ADDRESS,
  [ChainId.BSCTESTNET]: '0x2D2B8D5093d0288Da2473459545FE7a2f057bd7D',
  [ChainId.BSCMAINNET]: V2_CORE_FACTORY_ADDRESS,
  [ChainId.AVAXTESTNET]: V2_CORE_FACTORY_ADDRESS,
  [ChainId.AVAXMAINNET]: V2_CORE_FACTORY_ADDRESS,
  [ChainId.FANTOM]: V2_CORE_FACTORY_ADDRESS,
  [ChainId.CRONOSTESTNET]: V2_CORE_FACTORY_ADDRESS,
  [ChainId.CRONOS]: V2_CORE_FACTORY_ADDRESS,
  [ChainId.ARBITRUM]: V2_CORE_FACTORY_ADDRESS,
  [ChainId.ARBITRUM_TESTNET]: V2_CORE_FACTORY_ADDRESS,
  [ChainId.BTTC]: V2_CORE_FACTORY_ADDRESS,
  [ChainId.AURORA]: V2_CORE_FACTORY_ADDRESS,
  [ChainId.VELAS]: V2_CORE_FACTORY_ADDRESS,
  [ChainId.OASIS]: V2_CORE_FACTORY_ADDRESS,
}

const NONFUNGIBLE_POSITION_MANAGER_ADDRESS = '0xe0a4C2a9343A79A1F5b1505C036d033C8A178F90'
export const PRO_AMM_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES: ChainStringList = {
  [ChainId.MAINNET]: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
  [ChainId.ROPSTEN]: '0xb99ad0a400aFF7cA5eD7d07410A81Ed7Fc8F7A0e',
  [ChainId.RINKEBY]: '0xDA5a50E68F1310c89A9f1b4C3A70DFE920fe7135',
  [ChainId.GÖRLI]: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
  [ChainId.KOVAN]: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
  [ChainId.MATIC]: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
  [ChainId.MUMBAI]: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
  [ChainId.BSCTESTNET]: '0xe0a4C2a9343A79A1F5b1505C036d033C8A178F90',
  [ChainId.BSCMAINNET]: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
  [ChainId.AVAXTESTNET]: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
  [ChainId.AVAXMAINNET]: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
  [ChainId.FANTOM]: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
  [ChainId.CRONOSTESTNET]: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
  [ChainId.CRONOS]: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
  [ChainId.ARBITRUM_TESTNET]: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
  [ChainId.ARBITRUM]: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
  [ChainId.BTTC]: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
  [ChainId.AURORA]: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
  [ChainId.VELAS]: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
  [ChainId.OASIS]: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
}
// const TICK_READER = '0xb4748ce3ca04BE8f7E266dC9E38343A286eB5Ec6' //-- old
const TICK_READER = '0xc4c0a7b11457392f74604d9492593e686ab612b3'

export const PRO_AMM_TICK_READER: ChainStringList = {
  [ChainId.MAINNET]: TICK_READER,
  [ChainId.ROPSTEN]: '0x9A32cd0d2Fc6C60bFE51B0f0Ab27bAd82ca8F3FD',
  [ChainId.RINKEBY]: TICK_READER,
  [ChainId.GÖRLI]: TICK_READER,
  [ChainId.KOVAN]: TICK_READER,
  [ChainId.MATIC]: TICK_READER,
  [ChainId.MUMBAI]: TICK_READER,
  [ChainId.BSCTESTNET]: TICK_READER,
  [ChainId.BSCMAINNET]: TICK_READER,
  [ChainId.AVAXTESTNET]: TICK_READER,
  [ChainId.AVAXMAINNET]: TICK_READER,
  [ChainId.FANTOM]: TICK_READER,
  [ChainId.CRONOSTESTNET]: TICK_READER,
  [ChainId.CRONOS]: TICK_READER,
  [ChainId.ARBITRUM_TESTNET]: TICK_READER,
  [ChainId.ARBITRUM]: TICK_READER,
  [ChainId.BTTC]: TICK_READER,
  [ChainId.OASIS]: TICK_READER,
  [ChainId.VELAS]: TICK_READER,
  [ChainId.AURORA]: TICK_READER,
}

// export const PRO_AMM_INIT_CODE_HASH = '0xd71790a46dff0e075392efbd706356cd5a822a782f46e9859829440065879f81'
export const PRO_AMM_INIT_CODE_HASH = '0xf34278dbcc2f5e1f235d6826ba1aeb596c6b7f0a8a3206c508bf104f856fdbfa'

const QUOTER = '0xF4117D3c57BFe20fB2600eaE4028FB12bF99Ac10'

export const PRO_AMM_QUOTER: ChainStringList = {
  [ChainId.MAINNET]: QUOTER,
  [ChainId.ROPSTEN]: '0x45a5B8Cf524EC574b40e80274F0F3856A679C5c4',
  [ChainId.RINKEBY]: '0x5Af422a09201fbe23EB3400075A588610324Ab31',
  [ChainId.GÖRLI]: QUOTER,
  [ChainId.KOVAN]: QUOTER,
  [ChainId.MATIC]: QUOTER,
  [ChainId.MUMBAI]: QUOTER,
  [ChainId.BSCTESTNET]: '0xF4117D3c57BFe20fB2600eaE4028FB12bF99Ac10',
  [ChainId.BSCMAINNET]: QUOTER,
  [ChainId.AVAXTESTNET]: QUOTER,
  [ChainId.AVAXMAINNET]: QUOTER,
  [ChainId.FANTOM]: QUOTER,
  [ChainId.CRONOSTESTNET]: QUOTER,
  [ChainId.CRONOS]: QUOTER,
  [ChainId.ARBITRUM_TESTNET]: QUOTER,
  [ChainId.ARBITRUM]: QUOTER,
  [ChainId.BTTC]: QUOTER,
  [ChainId.AURORA]: QUOTER,
  [ChainId.VELAS]: QUOTER,
  [ChainId.OASIS]: QUOTER,
}

const ROUTER = '0x12ba4d63f73E0Aa01Df9c74508f1D2714bF05198'
export const PRO_AMM_ROUTERS: ChainStringList = {
  [ChainId.MAINNET]: ROUTER,
  [ChainId.ROPSTEN]: '0x1a91f5ADc7cB5763d35A26e98A18520CB9b67e70',
  [ChainId.RINKEBY]: '0x335cB9b399e3c33c4a0d1bE7407675C888f66e86',
  [ChainId.GÖRLI]: ROUTER,
  [ChainId.KOVAN]: ROUTER,
  [ChainId.MATIC]: ROUTER,
  [ChainId.MUMBAI]: ROUTER,
  [ChainId.BSCTESTNET]: '0x785b8893342dfEf9B5D565f67be971b859d34a15',
  [ChainId.BSCMAINNET]: ROUTER,
  [ChainId.AVAXTESTNET]: ROUTER,
  [ChainId.AVAXMAINNET]: ROUTER,
  [ChainId.FANTOM]: ROUTER,
  [ChainId.CRONOSTESTNET]: ROUTER,
  [ChainId.CRONOS]: ROUTER,
  [ChainId.ARBITRUM_TESTNET]: ROUTER,
  [ChainId.ARBITRUM]: ROUTER,
  [ChainId.BTTC]: ROUTER,
  [ChainId.OASIS]: ROUTER,
  [ChainId.VELAS]: ROUTER,
  [ChainId.AURORA]: ROUTER,
}

// const LM_READER = '0x1646F75cFda0B37f4A3C92bCc68ecc41046e3957'
// export const PRO_AMM_LM_READER: ChainStringList = {
//   [ChainId.MAINNET]: LM_READER,
//   [ChainId.ROPSTEN]: LM_READER,
//   [ChainId.RINKEBY]: LM_READER,
//   [ChainId.GÖRLI]: LM_READER,
//   [ChainId.KOVAN]: LM_READER,
//   [ChainId.MATIC]: LM_READER,
//   [ChainId.MUMBAI]: LM_READER,
//   [ChainId.BSCTESTNET]: LM_READER,
//   [ChainId.BSCMAINNET]: LM_READER,
//   [ChainId.AVAXTESTNET]: LM_READER,
//   [ChainId.AVAXMAINNET]: LM_READER,
//   [ChainId.FANTOM]: LM_READER,
//   [ChainId.CRONOSTESTNET]: LM_READER,
//   [ChainId.CRONOS]: LM_READER,
//   [ChainId.ARBITRUM_TESTNET]: LM_READER,
//   [ChainId.ARBITRUM]: LM_READER,
//   [ChainId.BTTC]: LM_READER,
//   [ChainId.OASIS]: LM_READER,
//   [ChainId.VELAS]: LM_READER,
//   [ChainId.AURORA]: LM_READER,
// }

export const FARM_CONTRACTS: { readonly [chainId in ChainId]?: Array<string> } = {
  [ChainId.BSCTESTNET]: ['0xD4FbaBd7fB321C6edf4e19ac39288bdD21799181'],
  [ChainId.RINKEBY]: ['0x9A32cd0d2Fc6C60bFE51B0f0Ab27bAd82ca8F3FD'],
  [ChainId.ROPSTEN]: [
    '0x371494e95358aE1C79b6634d0958470e8e73bdC8',
    '0x63cb3683cd3c64ab96db952bcb16f6bf9786d0a8',
    '0xf93A171E78b6F357a0B705aD3DA7fC07706b6cD6',
  ],
}
