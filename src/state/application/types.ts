export enum ApplicationModal {
  NETWORK = 'NETWORK',
  WALLET = 'WALLET',
  SETTINGS = 'SETTINGS',
  TRANSACTION_SETTINGS = 'TRANSACTION_SETTINGS',
  SELF_CLAIM = 'SELF_CLAIM',
  ADDRESS_CLAIM = 'ADDRESS_CLAIM',
  CLAIM_POPUP = 'CLAIM_POPUP',
  MENU = 'MENU',
  DELEGATE = 'DELEGATE',
  VOTE = 'VOTE',
  PRICE_RANGE = 'PRICE_RANGE',
  POOL_DETAIL = 'POOL_DETAIL',
  DOWNLOAD_WALLET = 'DOWNLOAD_WALLET',

  MOBILE_LIVE_CHART = 'MOBILE_LIVE_CHART',
  MOBILE_TRADE_ROUTES = 'MOBILE_TRADE_ROUTES',

  SHARE = 'SHARE',
  TRENDING_SOON_SORTING = 'TRENDING_SOON_SORTING',
  TRENDING_SOON_TOKEN_DETAIL = 'TRENDING_SOON_TOKEN_DETAIL',
  COMMUNITY = 'COMMUNITY',
  CONTRACT_ADDRESS = 'CONTRACT_ADDRESS',
  FAUCET_POPUP = 'FAUCET_POPUP',
  SELECT_CAMPAIGN = 'SELECT_CAMPAIGN',
  REGISTER_CAMPAIGN_CAPTCHA = 'REGISTER_CAMPAIGN_CAPTCHA',
  REGISTER_CAMPAIGN_SUCCESS = 'REGISTER_CAMPAIGN_SUCCESS',
  NOTIFICATION_CENTER = 'NOTIFICATION_CENTER',
  SWITCH_PROFILE_POPUP = 'SWITCH_PROFILE_POPUP',
  MENU_NOTI_CENTER = 'MENU_NOTI_CENTER',
  YOUR_CAMPAIGN_TRANSACTIONS = 'YOUR_CAMPAIGN_TRANSACTIONS',

  // KyberDAO
  DELEGATE_CONFIRM = 'DELEGATE_CONFIRM',
  YOUR_TRANSACTIONS_STAKE_KNC = 'YOUR_TRANSACTIONS_STAKE_KNC',
  MIGRATE_KNC = 'MIGRATE_KNC',
  KYBER_DAO_CLAIM = 'KYBER_DAO_CLAIM',

  SWAP_APPROVAL = 'SWAP_APPROVAL',
  TIME_DROPDOWN = 'TIME_DROPDOWN',

  TRUESIGHT_POOLS = 'TRUESIGHT_POOLS',

  KYBERAI_TUTORIAL = 'KYBERAI_TUTORIAL',
  KYBERAI_NEW_UPDATE = 'KYBERAI_NEW_UPDATE',
  SWITCH_TO_ETHEREUM = 'SWITCH_TO_ETHEREUM',
}

type ImplementedModalParams = {
  [ApplicationModal.SWITCH_TO_ETHEREUM]: { featureText: string }
  //... fill more here
}
export type ModalParams = {
  [modal in Exclude<ApplicationModal, keyof ImplementedModalParams>]?: undefined
} & ImplementedModalParams
