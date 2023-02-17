import { Trans } from '@lingui/macro'
import { useNavigate } from 'react-router-dom'

import {
  Dot,
  InboxItemRow,
  InboxItemTime,
  InboxItemWrapper,
  PrimaryText,
  RowItem,
  Title,
} from 'components/Announcement/PrivateAnnoucement/styled'
import { AnnouncementTemplateTrendingSoon, PrivateAnnouncement, TrueSightToken } from 'components/Announcement/type'
import DiscoverIcon from 'components/Icons/DiscoverIcon'
import DeltaTokenAmount from 'components/WalletPopup/Transactions/DeltaTokenAmount'
import { APP_PATHS } from 'constants/index'

const getTokenDisplayText = (token: TrueSightToken) => `${token.tokenSymbol} $${token.price} (${token.priceChange}%)`

function InboxItemBridge({ announcement, onRead }: { announcement: PrivateAnnouncement; onRead: () => void }) {
  const { templateBody } = announcement
  const [token1, token2, token3] = ((templateBody as AnnouncementTemplateTrendingSoon).tokens ?? []) as TrueSightToken[]
  const isRead = Math.random() < 0.5
  const navigate = useNavigate()
  const onClick = () => {
    navigate(APP_PATHS.DISCOVER)
    onRead()
  }
  return (
    <InboxItemWrapper isRead={isRead} onClick={onClick}>
      <InboxItemRow>
        <RowItem>
          <DiscoverIcon size={16} />
          <Title isRead={isRead}>
            <Trans>Trending Soon</Trans>
          </Title>
          {!isRead && <Dot />}
        </RowItem>
        <RowItem>
          <PrimaryText>New tokens found!</PrimaryText>
        </RowItem>
      </InboxItemRow>

      <InboxItemRow>
        {token1 && <DeltaTokenAmount amount={getTokenDisplayText(token1)} logoURL={token1.tokenLogoURL} />}
        {token2 && <DeltaTokenAmount amount={getTokenDisplayText(token2)} logoURL={token2.tokenLogoURL} />}
      </InboxItemRow>

      <InboxItemRow>
        {token3 && <DeltaTokenAmount amount={getTokenDisplayText(token3)} logoURL={token3.tokenLogoURL} />}
        <InboxItemTime>12/12/2002</InboxItemTime>
      </InboxItemRow>
    </InboxItemWrapper>
  )
}
export default InboxItemBridge
