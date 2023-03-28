import { stringify } from 'querystring'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAckPrivateAnnouncementsByIdsMutation, useGetPrivateAnnouncementsByIdsQuery } from 'services/announcement'
import styled from 'styled-components'

import { getAnnouncementsTemplateIds } from 'constants/env'
import { useActiveWeb3React } from 'hooks'
import useParsedQueryString from 'hooks/useParsedQueryString'
import ActiveAlerts from 'pages/NotificationCenter/PriceAlerts/ActiveAlerts'
import AlertsHistory from 'pages/NotificationCenter/PriceAlerts/AlertsHistory'
import Header from 'pages/NotificationCenter/PriceAlerts/Header'
import TitleOnMobile from 'pages/NotificationCenter/PriceAlerts/TitleOnMobile'
import { ITEMS_PER_PAGE } from 'pages/NotificationCenter/const'

export enum Tab {
  ACTIVE = 'active',
  HISTORY = 'history',
}

export const ShareWrapper = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;

  padding: 24px;
  padding-bottom: 0;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex: 1;
    padding: 0;

    ${ShareContentWrapper} {
      flex: 1;
      padding: 0 16px;
    }
  `}
`
// todo danh move to commont file
// todo mapping name/icon cua cac announcment
export const ShareContentWrapper = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
`

const useAckAnnouncement = (templateIds: string) => {
  const { account } = useActiveWeb3React()
  const [ackAnnouncement] = useAckPrivateAnnouncementsByIdsMutation()
  const { data, refetch } = useGetPrivateAnnouncementsByIdsQuery(
    { page: 1, account: account ?? '', templateIds, pageSize: ITEMS_PER_PAGE },
    { skip: !account || !templateIds },
  )
  const numberOfUnread = data?.numberOfUnread || 0
  const loadingRef = useRef(false)
  useEffect(() => {
    if (loadingRef.current || !account || numberOfUnread === 0) return
    // mark all as read
    loadingRef.current = true
    ackAnnouncement({ templateIds: templateIds || undefined, account })
      .then(() => {
        refetch()
      })
      .catch(e => {
        console.error('ackAnnouncement', e)
      })
      .finally(() => {
        loadingRef.current = false
      })
  }, [numberOfUnread, templateIds, account, ackAnnouncement, refetch])
}

const PriceAlerts = () => {
  const { tab, ...rest } = useParsedQueryString<{ tab: Tab }>()
  const [currentTab, setCurrentTab] = useState(tab || Tab.ACTIVE)
  const [disabledClearAll, setDisabledClearAll] = useState(true)

  const navigate = useNavigate()
  const onSetTab = (tab: Tab) => {
    setCurrentTab(tab)
    const search = { ...rest, tab }
    navigate({ search: stringify(search) }, { replace: true })
    setDisabledClearAll(false)
  }

  useAckAnnouncement(getAnnouncementsTemplateIds().PRICE_ALERT)

  return (
    <ShareWrapper>
      <TitleOnMobile />
      <ShareContentWrapper>
        <Header currentTab={currentTab} setCurrentTab={onSetTab} disabledClearAll={disabledClearAll} />
        {currentTab === Tab.ACTIVE ? (
          <ActiveAlerts setDisabledClearAll={setDisabledClearAll} />
        ) : (
          <AlertsHistory setDisabledClearAll={setDisabledClearAll} />
        )}
      </ShareContentWrapper>
    </ShareWrapper>
  )
}

export default PriceAlerts
