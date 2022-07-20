import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  ContentWrapper,
  Referralv2Wrapper,
  HeaderWrapper,
  Container,
  CreateReferralBox,
  CopyTextWrapper,
  CopyTextInput,
  PlaceholderText,
} from './styled'
import { Trans, t } from '@lingui/macro'
import { Flex, Box, Text } from 'rebass'
import useTheme from 'hooks/useTheme'
import { ButtonLight, ButtonPrimary } from 'components/Button'
import { useWalletModalToggle } from 'state/application/hooks'
import CopyHelper from 'components/Copy'
import ProgressionReward from './ProgressionReward'
import DashboardSection from './DashboardSection'
import Leaderboard from './Leaderboard'
import { useActiveWeb3React } from 'hooks'
import { useMedia } from 'react-use'
import useReferralV2 from 'hooks/useReferralV2'
import ShareModal from 'components/ShareModal'
import { useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/actions'
import CaptchaModal from './CaptchaModal'
import CongratulationModal from './CongratulationModal'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'

function CopyTextBox({ placeholder, textToCopy }: { placeholder?: string; textToCopy: string }) {
  return (
    <CopyTextWrapper>
      <PlaceholderText>{placeholder}</PlaceholderText>
      <CopyTextInput disabled value={textToCopy} />
      <CopyHelper toCopy={textToCopy} size={17} />
    </CopyTextWrapper>
  )
}
const ReferralCopyBoxes = ({ code }: { code: string | undefined }) => (
  <>
    <CopyTextBox
      placeholder={t`Referral Link`}
      textToCopy={code ? `${window.location.origin}/swap?referralCode=${code.toUpperCase()}` : ''}
    />
    <CopyTextBox placeholder={t`Referral Code`} textToCopy={code ? code.toUpperCase() : ''} />
  </>
)
export default function ReferralV2() {
  const { account } = useActiveWeb3React()
  const theme = useTheme()
  const toggleWalletModal = useWalletModalToggle()
  const [showCaptchaModal, setShowCaptchaModal] = useState(false)
  const [showCongratulationModal, setShowCongratulationModal] = useState(false)
  const [isHighlightClaim, setIsHighlightClaim] = useState(false)
  const above768 = useMedia('(min-width: 768px)')
  const {
    referrerInfo,
    refereeInfo,
    leaderboardData,
    getReferrerInfo,
    getRefereeInfo,
    getReferrerLeaderboard,
    createReferrer,
    unlockRefereeReward,
    claimReward,
  } = useReferralV2()

  const handleGenerateClick = async () => {
    if (!account) return
    createReferrer()
  }

  const handlePageChange = useCallback(
    (page: number) => {
      getReferrerLeaderboard(page)
    },
    [getReferrerLeaderboard],
  )
  const handleSearchWallet = useCallback(
    (wallet: string) => {
      getReferrerLeaderboard(1, wallet)
    },
    [getReferrerLeaderboard],
  )
  useEffect(() => {
    getReferrerLeaderboard(1)
    if (!account) return
    getReferrerInfo()
    getRefereeInfo()
    // eslint-disable-next-line
  }, [account])
  const toggleShareModal = useToggleModal(ApplicationModal.SHARE)
  const dashboardRef = useRef<HTMLElement>(null)
  const { mixpanelHandler } = useMixpanel()
  return (
    <Referralv2Wrapper>
      <HeaderWrapper>
        <Container>
          <Flex flexDirection={above768 ? 'row' : 'column'} alignItems="center">
            <Box flex={1}>
              <Text fontSize={'48px'} lineHeight={'60px'} maxWidth={'392px'}>
                <Trans>
                  Refer Friends
                  <br />& Earn <span style={{ color: theme.primary }}>KNC</span>
                </Trans>
              </Text>
              <Text paddingTop={'28px'} fontSize={'16px'} lineHeight={'24px'} maxWidth={'392px'} color={theme.subText}>
                <Trans>
                  Get KNC rewards for every new user you refer. Both the Referrer and Referee can earn rewards! The more
                  you refer, the more you earn! View our referral program rules <a href="">here</a>
                </Trans>
              </Text>
            </Box>
            <CreateReferralBox>
              <Flex alignItems="center">
                <Text flex={1} fontWeight={500} fontSize={20} color={theme.text} textAlign="left">
                  <Trans>Your Referral</Trans>
                </Text>

                {account ? (
                  referrerInfo?.referralCode ? (
                    <ButtonPrimary
                      flex={1}
                      onClick={() => {
                        mixpanelHandler(MIXPANEL_TYPE.REFERRAL_SHARE_LINK)
                        toggleShareModal()
                      }}
                    >
                      <Trans>Invite your friends</Trans>
                    </ButtonPrimary>
                  ) : (
                    <ButtonPrimary flex={1} onClick={handleGenerateClick}>
                      <Trans>Generate Now</Trans>
                    </ButtonPrimary>
                  )
                ) : (
                  <ButtonLight onClick={toggleWalletModal} flex={1}>
                    <Trans>Connect your Wallet</Trans>
                  </ButtonLight>
                )}
              </Flex>
              <ReferralCopyBoxes code={referrerInfo?.referralCode} />
            </CreateReferralBox>
          </Flex>
        </Container>
      </HeaderWrapper>
      <ContentWrapper>
        <Container>
          {refereeInfo && !refereeInfo.isUnlocked && refereeInfo.referrerWallet !== '' && (
            <ProgressionReward
              isShow={!!refereeInfo}
              refereeInfo={refereeInfo}
              onUnlock={() => setShowCaptchaModal(true)}
            />
          )}
          <DashboardSection
            ref={dashboardRef}
            referrerInfo={referrerInfo}
            onClaim={claimReward}
            isHighlightClaim={isHighlightClaim}
          />
          <Leaderboard
            leaderboardData={leaderboardData}
            onChangePage={handlePageChange}
            onSearchChange={handleSearchWallet}
          />
        </Container>
      </ContentWrapper>
      {referrerInfo && (
        <ShareModal
          content={<ReferralCopyBoxes code={referrerInfo.referralCode} />}
          url={`${window.location.origin}/swap?referralCode=${referrerInfo?.referralCode?.toUpperCase()}`}
          title={t`Refer your friends!`}
        />
      )}
      <CaptchaModal
        isOpen={showCaptchaModal}
        onDismiss={() => setShowCaptchaModal(false)}
        onSuccess={async () => {
          const res = await unlockRefereeReward()
          setTimeout(() => {
            setShowCaptchaModal(false)
            if (res) {
              setShowCongratulationModal(true)
            }
          }, 1000)
        }}
      />
      <CongratulationModal
        isOpen={showCongratulationModal}
        onDismiss={() => {
          setShowCongratulationModal(false)
        }}
        onClaimClicked={() => {
          dashboardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          setIsHighlightClaim(true)
        }}
      />
    </Referralv2Wrapper>
  )
}
