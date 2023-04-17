import { Trans } from '@lingui/macro'
import { useEffect, useRef } from 'react'
import styled from 'styled-components'

import CenterPopup from 'components/Announcement/Popups/CenterPopup'
import SnippetPopup from 'components/Announcement/Popups/SnippetPopup'
import { PopupType, PrivateAnnouncementType } from 'components/Announcement/type'
import { ButtonEmpty } from 'components/Button'
import { TIMES_IN_SECS } from 'constants/index'
import { Z_INDEXS } from 'constants/styles'
import { useActiveWeb3React } from 'hooks'
import {
  useActivePopups,
  useAddPopup,
  useRemoveAllPopupByType,
  useToggleNotificationCenter,
} from 'state/application/hooks'
import { useTutorialSwapGuide } from 'state/tutorial/hooks'
import { subscribeAnnouncement, subscribePrivateAnnouncement } from 'utils/firebase'

import TopRightPopup from './TopRightPopup'

const FixedPopupColumn = styled.div<{ hasTopbarPopup: boolean }>`
  position: fixed;
  top: ${({ hasTopbarPopup }) => (hasTopbarPopup ? '156px' : '108px')};
  right: 1rem;
  z-index: ${Z_INDEXS.POPUP_NOTIFICATION};
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  ${({ theme, hasTopbarPopup }) => theme.mediaWidth.upToMedium`
    left: 0;
    right: 0;
    top: ${hasTopbarPopup ? '170px' : '110px'};
    align-items: center;
  `};
  ${({ theme, hasTopbarPopup }) => theme.mediaWidth.upToSmall`
    top: ${hasTopbarPopup ? '170px' : '70px'};
  `};
`

const ActionWrapper = styled.div`
  gap: 10px;
  justify-content: flex-end;
  display: flex;
  width: 100%;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding-right: 16px;
  `};
`

const ActionButton = styled(ButtonEmpty)`
  background-color: ${({ theme }) => theme.border};
  color: ${({ theme }) => theme.text};
  border-radius: 30px;
  padding: 4px 10px;
  width: fit-content;
  border-radius: 30px;
  font-size: 10px;
`

const MAX_NOTIFICATION = 4

export default function Popups() {
  const { topRightPopups, centerPopups, snippetPopups, topPopups } = useActivePopups()
  const centerPopup = centerPopups[centerPopups.length - 1]
  const { account, chainId } = useActiveWeb3React()

  const toggleNotificationCenter = useToggleNotificationCenter()
  const [{ show: isShowTutorial = false }] = useTutorialSwapGuide()
  const addPopup = useAddPopup()

  const removeAllPopupByType = useRemoveAllPopupByType()

  const clearAllTopRightPopup = () => removeAllPopupByType(PopupType.TOP_RIGHT)
  const clearAllSnippetPopup = () => removeAllPopupByType(PopupType.SNIPPET)
  const clearAllCenterPopup = () => removeAllPopupByType(PopupType.CENTER)

  const isInit = useRef(false)

  useEffect(() => {
    if (isShowTutorial) return
    const unsubscribe = subscribeAnnouncement(data => {
      data.forEach(item => {
        const { popupType } = item.templateBody
        if ((!isInit.current && popupType === PopupType.CENTER) || popupType !== PopupType.CENTER) {
          // only show PopupType.CENTER when the first visit app
          addPopup(item, popupType, item.metaMessageId, null)
        }
      })
      isInit.current = true
    })

    const unsubscribePrivate = subscribePrivateAnnouncement(account, data => {
      data.forEach(t => {
        const item: any = {
          id: 1018745,
          templateType: PrivateAnnouncementType.PRIVATE_MESSAGE,
          templateBody: {
            popupType: PopupType.TOP_BAR,
            metaMessageId: Math.random(),
            chainIds: ['1', '137'],
            endAt: 1702317661,
            startAt: 0,
            name: 'ádasdasdasdasd',
            content: '<p>ádasdasdasdasdasda</p>',
            thumbnailImageURL:
              'https://storage.googleapis.com/ks-setting-a3aa20b7/f0502ab7-c40d-4d48-b9b0-a2dc22edf090.png',
            ctaName: 'ádasdasdasd',
            ctaURL: 'https://kyberswap.dev.kyberengineering.io/swap/polygon',
          },
        }

        switch (item.templateType) {
          case PrivateAnnouncementType.PRICE_ALERT:
            const mins = (Date.now() / 1000 - item.createdAt) / TIMES_IN_SECS.ONE_MIN
            if (mins <= 5) addPopup(item, PopupType.TOP_RIGHT, item.metaMessageId, 15_000)
            break
          case PrivateAnnouncementType.PRIVATE_MESSAGE: {
            const { templateBody, metaMessageId } = item
            addPopup(item, templateBody.popupType, metaMessageId)
            break
          }
        }
      })
    })
    return () => {
      unsubscribe?.()
      unsubscribePrivate?.()
    }
  }, [account, isShowTutorial, addPopup, chainId])

  const totalTopRightPopup = topRightPopups.length

  return (
    <>
      {topRightPopups.length > 0 && (
        <FixedPopupColumn hasTopbarPopup={topPopups.length !== 0}>
          <ActionWrapper>
            {totalTopRightPopup >= MAX_NOTIFICATION && (
              <ActionButton onClick={toggleNotificationCenter}>
                <Trans>See All</Trans>
              </ActionButton>
            )}
            {totalTopRightPopup > 1 && (
              <ActionButton onClick={clearAllTopRightPopup}>
                <Trans>Clear All</Trans>
              </ActionButton>
            )}
          </ActionWrapper>

          {topRightPopups.slice(0, MAX_NOTIFICATION).map((item, i) => (
            <TopRightPopup key={item.key} popup={item} hasOverlay={i === MAX_NOTIFICATION - 1} />
          ))}
        </FixedPopupColumn>
      )}
      {snippetPopups.length > 0 && <SnippetPopup data={snippetPopups} clearAll={clearAllSnippetPopup} />}
      {centerPopup && <CenterPopup data={centerPopup} onDismiss={clearAllCenterPopup} />}
    </>
  )
}
