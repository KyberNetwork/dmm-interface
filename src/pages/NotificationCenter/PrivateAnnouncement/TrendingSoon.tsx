import { Trans } from '@lingui/macro'
import { useNavigate } from 'react-router-dom'
import { Flex } from 'rebass'
import { CSSProperties } from 'styled-components'

import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import { TokenInfo } from 'components/Announcement/PrivateAnnoucement/InboxItemTrendingSoon'
import { AnnouncementTemplateTrendingSoon, PrivateAnnouncement } from 'components/Announcement/type'
import Logo from 'components/Logo'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { formatTime } from 'utils/time'

import { Desc, RowItem, Time, Title, Wrapper } from './styled'

export default function AnnouncementItem({
  announcement,
  style,
}: {
  announcement: PrivateAnnouncement<AnnouncementTemplateTrendingSoon>
  style?: CSSProperties
}) {
  const { sentAt, templateType, templateBody } = announcement
  const { tokens = [] } = templateBody
  const theme = useTheme()
  const navigate = useNavigate()
  return (
    <Wrapper onClick={() => navigate(APP_PATHS.DISCOVER)} style={style}>
      <RowItem>
        <Flex justifyContent="space-between" width="100%">
          <Title>
            <InboxIcon type={templateType} />
            <Trans>Trending Soon</Trans>
          </Title>
          <Flex alignItems={'center'}>
            <Time>{formatTime(sentAt)} </Time>
          </Flex>
        </Flex>
        <Desc style={{ gap: 6, flexWrap: 'wrap', color: theme.subText }}>
          Here are our top suggestions
          {tokens.map((token, index) => (
            <Flex alignItems={'center'} key={token.symbol} style={{ gap: 4 }}>
              <Logo srcs={[token.logo]} style={{ width: 16, height: 16, borderRadius: '50%' }} />
              <TokenInfo token={token} separator={index !== tokens.length - 1} />
            </Flex>
          ))}
        </Desc>
      </RowItem>
    </Wrapper>
  )
}
