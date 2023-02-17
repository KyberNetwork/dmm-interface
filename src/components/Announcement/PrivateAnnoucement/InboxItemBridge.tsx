import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { ReactComponent as ArrowDown } from 'assets/svg/arrow_down.svg'
import { ReactComponent as BridgeIcon } from 'assets/svg/bridge_icon.svg'
import IconFailure from 'assets/svg/notification_icon_failure.svg'
import IconSuccess from 'assets/svg/notification_icon_success.svg'
import {
  Dot,
  InboxItemRow,
  InboxItemTime,
  InboxItemWrapper,
  PrimaryText,
  RowItem,
  Title,
} from 'components/Announcement/PrivateAnnoucement/styled'
import { AnnouncementTemplateBridge, PrivateAnnouncement } from 'components/Announcement/type'
import { NetworkLogo } from 'components/Logo'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { MultichainTransfer, MultichainTransferStatus } from 'hooks/bridge/useGetBridgeTransfers'
import { formatAmountBridge } from 'pages/Bridge/helpers'

const NetWorkRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

function InboxItemBridge({ announcement, onRead }: { announcement: PrivateAnnouncement; onRead: () => void }) {
  const { templateBody } = announcement
  const { transaction = {} } = templateBody as AnnouncementTemplateBridge
  const { status, srcTokenSymbol, srcAmount, dstChainId, srcChainId } = transaction as MultichainTransfer
  const isRead = Math.random() < 0.5
  const isSuccess = status === MultichainTransferStatus.Success
  const chainIdIn = Number(srcChainId) as ChainId
  const chainIdOut = Number(dstChainId) as ChainId

  const navigate = useNavigate()
  const onClick = () => {
    navigate(APP_PATHS.BRIDGE)
    onRead()
  }
  return (
    <InboxItemWrapper isRead={isRead} onClick={onClick}>
      <InboxItemRow>
        <RowItem>
          <BridgeIcon />
          <Title isRead={isRead}>
            <Trans>Bridge Token</Trans>
          </Title>
          {!isRead && <Dot />}
        </RowItem>
        <RowItem>
          <PrimaryText>{isSuccess ? t`Success` : t`Failed`}</PrimaryText>
          <img height={12} width={12} src={isSuccess ? IconSuccess : IconFailure} alt="icon-status" />
        </RowItem>
      </InboxItemRow>

      <InboxItemRow>
        <div style={{ position: 'relative' }}>
          <NetWorkRow>
            <NetworkLogo chainId={chainIdIn} style={{ width: 12, height: 12 }} />
            <InboxItemTime>{NETWORKS_INFO[chainIdIn].name}</InboxItemTime>
          </NetWorkRow>
          <ArrowDown style={{ position: 'absolute', left: 4, height: 10 }} />
        </div>

        <PrimaryText>
          {formatAmountBridge(srcAmount)} {srcTokenSymbol}
        </PrimaryText>
      </InboxItemRow>

      <InboxItemRow>
        <NetWorkRow>
          <NetworkLogo chainId={chainIdOut} style={{ width: 12, height: 12 }} />
          <InboxItemTime>{NETWORKS_INFO[chainIdOut].name}</InboxItemTime>
        </NetWorkRow>
        <InboxItemTime>12/12/2002</InboxItemTime>
      </InboxItemRow>
    </InboxItemWrapper>
  )
}
export default InboxItemBridge
