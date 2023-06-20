import { Trans } from '@lingui/macro'
import { ReactNode, useEffect, useMemo, useRef } from 'react'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import NotificationIcon from 'components/Icons/NotificationIcon'
import { useWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useNotification from 'hooks/useNotification'
import useTheme from 'hooks/useTheme'

import { ButtonPrimary } from '../Button'
import { MouseoverTooltipDesktopOnly } from '../Tooltip'

const cssSubscribeBtnSmall = (bgColor: string) => css`
  width: 36px;
  min-width: 36px;
  padding: 6px;
  background: ${bgColor};
  &:hover {
    background: ${bgColor};
  }
`
const SubscribeBtn = styled(ButtonPrimary)<{
  isDisabled?: boolean
  iconOnly?: boolean
  bgColor: string
}>`
  overflow: hidden;
  width: fit-content;
  height: 36px;
  padding: 8px 12px;
  background: ${({ bgColor }) => bgColor};
  color: ${({ theme, isDisabled }) => (isDisabled ? theme.border : theme.textReverse)};
  &:hover {
    background: ${({ bgColor }) => bgColor};
  }
  ${({ iconOnly, bgColor }) => iconOnly && cssSubscribeBtnSmall(bgColor)};
  ${({ theme, bgColor }) => theme.mediaWidth.upToExtraSmall`
   ${cssSubscribeBtnSmall(bgColor)}
  `}
`

const ButtonText = styled(Text)<{ iconOnly?: boolean }>`
  font-size: 14px;
  font-weight: 500;
  margin-left: 6px !important;
  ${({ iconOnly }) => iconOnly && `display: none`};
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `}
`
export default function SubscribeNotificationButton({
  subscribeTooltip,
  iconOnly = false,
  trackingEvent,
  onClick,
  topicId,
}: {
  subscribeTooltip?: ReactNode
  iconOnly?: boolean
  trackingEvent?: MIXPANEL_TYPE
  onClick?: () => void
  topicId?: string
}) {
  const theme = useTheme()
  const { account } = useWeb3React()

  const { mixpanelHandler } = useMixpanel()
  const { showNotificationModal, topicGroups } = useNotification()

  const hasSubscribe = useMemo(() => {
    return topicId
      ? topicGroups.some(group =>
          group.topics.some(topic => topic.isSubscribed && String(topic.id) === String(topicId)),
        )
      : false
  }, [topicGroups, topicId])

  const showModalWhenConnected = useRef(false)

  useEffect(() => {
    if (account && showModalWhenConnected.current) {
      showNotificationModal()
      showModalWhenConnected.current = false
    }
  }, [account, showNotificationModal])

  const onClickBtn = () => {
    showNotificationModal()
    onClick?.()
    if (trackingEvent)
      setTimeout(() => {
        mixpanelHandler(trackingEvent)
      }, 100)
    if (!account) showModalWhenConnected.current = true
  }

  return (
    <MouseoverTooltipDesktopOnly text={subscribeTooltip} width="400px">
      <SubscribeBtn bgColor={theme.primary} onClick={onClickBtn} iconOnly={iconOnly}>
        <NotificationIcon size={16} />
        <ButtonText iconOnly={iconOnly}>
          {hasSubscribe ? <Trans>Unsubscribe</Trans> : <Trans>Subscribe</Trans>}
        </ButtonText>
      </SubscribeBtn>
    </MouseoverTooltipDesktopOnly>
  )
}
