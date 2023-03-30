import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'

import { PrivateAnnouncementProp } from 'components/Announcement/PrivateAnnoucement'
import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import { Dot, InboxItemRow, InboxItemWrapper, RowItem, Title } from 'components/Announcement/PrivateAnnoucement/styled'
import { AnnouncementTemplateTrendingSoon, TrueSightToken } from 'components/Announcement/type'
import DeltaTokenAmount from 'components/WalletPopup/Transactions/DeltaTokenAmount'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'

export const TokenInfo = ({ token, separator }: { token: TrueSightToken; separator?: boolean }) => {
  const theme = useTheme()
  return (
    <>
      {token.symbol} ${token.price}{' '}
      <Text as="span" color={theme.apr}>
        ({token.changePercentage}%)
        <Text as="span" color={theme.subText}>
          {separator && ','}
        </Text>
      </Text>
    </>
  )
}

function InboxItemBridge({
  announcement,
  onRead,
  style,
  time,
  title,
}: PrivateAnnouncementProp<AnnouncementTemplateTrendingSoon>) {
  const { templateBody, isRead, templateType } = announcement
  const [token1, token2 = token1, token3 = token1] = templateBody.tokens
  const theme = useTheme()
  const navigate = useNavigate()
  const onClick = () => {
    navigate(APP_PATHS.DISCOVER)
    onRead(announcement, 'trending_soon')
  }
  return (
    <InboxItemWrapper isRead={isRead} onClick={onClick} style={style}>
      <InboxItemRow>
        <RowItem>
          <InboxIcon type={templateType} />
          <Title isRead={isRead}>{title}</Title>
          {!isRead && <Dot />}
        </RowItem>
      </InboxItemRow>

      <InboxItemRow>
        {token1 && <DeltaTokenAmount amount={<TokenInfo token={token1} />} logoURL={token1.logo} color={theme.text} />}
        {token2 && <DeltaTokenAmount amount={<TokenInfo token={token2} />} logoURL={token2.logo} color={theme.text} />}
      </InboxItemRow>

      <InboxItemRow>
        {token3 ? (
          <DeltaTokenAmount amount={<TokenInfo token={token3} />} logoURL={token3.logo} color={theme.text} />
        ) : (
          <div />
        )}
        {time}
      </InboxItemRow>
    </InboxItemWrapper>
  )
}
export default InboxItemBridge
