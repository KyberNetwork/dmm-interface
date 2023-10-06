import { createAction } from '@reduxjs/toolkit'

import { AnnouncementTemplatePopup, PopupContent, PopupType } from 'components/Announcement/type'
import { Topic } from 'hooks/useNotification'
import { ConfirmModalState } from 'state/application/reducer'

export enum ApplicationModal {
  NETWORK,
  WALLET,
  SETTINGS,
  TRANSACTION_SETTINGS,
  SELF_CLAIM,
  ADDRESS_CLAIM,
  CLAIM_POPUP,
  MENU,
  DELEGATE,
  VOTE,
  PRICE_RANGE,
  POOL_DETAIL,
  DOWNLOAD_WALLET,

  MOBILE_LIVE_CHART,
  MOBILE_TRADE_ROUTES,

  SHARE,
  TRENDING_SOON_SORTING,
  TRENDING_SOON_TOKEN_DETAIL,
  COMMUNITY,
  CONTRACT_ADDRESS,
  FAUCET_POPUP,
  SELECT_CAMPAIGN,
  REGISTER_CAMPAIGN_CAPTCHA,
  REGISTER_CAMPAIGN_SUCCESS,
  NOTIFICATION_CENTER,
  SWITCH_PROFILE_POPUP,
  MENU_NOTI_CENTER,
  YOUR_CAMPAIGN_TRANSACTIONS,

  // KyberDAO
  SWITCH_TO_ETHEREUM,
  DELEGATE_CONFIRM,
  YOUR_TRANSACTIONS_STAKE_KNC,
  MIGRATE_KNC,
  KYBER_DAO_CLAIM,

  SWAP_APPROVAL,
  TIME_DROPDOWN,

  TRUESIGHT_POOLS,

  KYBERAI_TUTORIAL,
  KYBERAI_NEW_UPDATE,
}

export const updateBlockNumber = createAction<{ chainId: number; blockNumber: number }>('application/updateBlockNumber')
export const setOpenModal = createAction<ApplicationModal | null>('application/setOpenModal')
export const closeModal = createAction<ApplicationModal | null>('application/closeModal')
export const addPopup = createAction<{
  key?: string
  removeAfterMs?: number | null
  content: PopupContent
  popupType: PopupType
  account?: string
}>('application/addPopup')
export const removePopup = createAction<{ key: string }>('application/removePopup')

export const updatePrommETHPrice = createAction<{
  currentPrice: string
  oneDayBackPrice: string
  pricePercentChange: number
}>('application/updatePrommETHPrice')

export const updateETHPrice = createAction<{
  currentPrice: string
  oneDayBackPrice: string
  pricePercentChange: number
}>('application/updateETHPrice')

export const updateServiceWorker = createAction<ServiceWorkerRegistration>('application/updateServiceWorker')

export const setSubscribedNotificationTopic = createAction<{
  topicGroups: Topic[]
}>('application/setSubscribedNotificationTopic')

export const setLoadingNotification = createAction<boolean>('application/setLoadingNotification')

export const setAnnouncementDetail = createAction<{
  selectedIndex: number | null
  announcements: AnnouncementTemplatePopup[]
  hasMore: boolean
}>('application/setAnnouncementDetail')

export const setConfirmData = createAction<ConfirmModalState>('application/setConfirmData')
