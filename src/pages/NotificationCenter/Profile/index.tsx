import { Trans, t } from '@lingui/macro'
import { useCallback, useEffect, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { LogOut, Save } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import { useUpdateProfileMutation } from 'services/identity'
import styled from 'styled-components'

import { AddressInput } from 'components/AddressInputPanel'
import { NotificationType } from 'components/Announcement/type'
import Avatar from 'components/Avatar'
import Column from 'components/Column'
import CopyHelper from 'components/Copy'
import FileInput from 'components/FileInput'
import { Input } from 'components/Input'
import { useValidateEmail } from 'components/SubscribeButton/NotificationPreference'
import InputEmail from 'components/SubscribeButton/NotificationPreference/InputEmail'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useUploadImageToCloud } from 'hooks/social'
import useLogin from 'hooks/useLogin'
import useTheme from 'hooks/useTheme'
import ExportAccountButton from 'pages/NotificationCenter/Profile/ExportAccountButton'
import WarningSignMessage from 'pages/NotificationCenter/Profile/WarningSignMessage'
import { ButtonLogout, ButtonSave } from 'pages/NotificationCenter/Profile/buttons'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import VerifyCodeModal from 'pages/Verify/VerifyCodeModal'
import { useNotify } from 'state/application/hooks'
import { useRefreshProfile, useSessionInfo, useSignedWalletInfo } from 'state/authen/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { shortenAddress } from 'utils'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 30px 24px;
  gap: 20px;
  max-width: 630px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    align-items: center;
    max-width: 100%;
  `}
`

const Label = styled.label`
  font-size: 14px;
  color: ${({ theme }) => theme.subText};
`

const AVATAR_SIZE = isMobile ? '72px' : '120px'
const AvatarWrapper = styled.div`
  border-radius: 100%;
  padding: 16px;
  background-color: ${({ theme }) => theme.buttonBlack};
  width: ${AVATAR_SIZE};
  height: ${AVATAR_SIZE};
  display: flex;
  align-items: center;
  justify-content: center;
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const LeftColum = styled(Column)`
  gap: 28px;
  flex: 1;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `}
`

const StyledAddressInput = styled(AddressInput)`
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 20px;
  height: 42px;
`

const FormWrapper = styled.div`
  display: flex;
  gap: 32px;
  align-items: flex-start;
  justify-content: space-between;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column-reverse;
    align-items: center;
    width: 100%; 
    gap: 0px;
  `}
`
const ActionsWrapper = styled.div`
  display: flex;
  gap: 20px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-content: space-between;
  `}
`

export default function Profile() {
  const theme = useTheme()
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const { chainId } = useActiveWeb3React()
  const { userInfo, isLogin } = useSessionInfo()
  const { inputEmail, onChangeEmail, errorColor, hasErrorInput } = useValidateEmail(userInfo?.email)
  const [nickname, setNickName] = useState('')
  const { signOut } = useLogin()
  const navigate = useNavigate()
  const { signedWallet } = useSignedWalletInfo()

  const [file, setFile] = useState<File>()
  const [previewImage, setPreviewImage] = useState<string>()
  const cacheData = useRef<{ nickname: string; file: File | undefined; avatar: string }>({
    nickname: '',
    file: undefined,
    avatar: '',
  })

  const onChangeNickname = useCallback((value: string) => {
    setNickName(value)
    cacheData.current.nickname = value
  }, [])

  useEffect(() => {
    const { file, nickname, avatar } = cacheData.current
    onChangeEmail(userInfo?.email ?? '')
    setNickName(nickname || userInfo?.nickname || '')
    setPreviewImage(avatar || userInfo?.avatarUrl)
    file && setFile(file)
  }, [userInfo?.email, userInfo?.nickname, userInfo?.avatarUrl, onChangeEmail])

  const [isShowVerify, setIsShowVerify] = useState(false)
  const showVerifyModal = () => {
    setIsShowVerify(true)
  }
  const onDismissVerifyModal = () => {
    setIsShowVerify(false)
  }

  const handleFileChange = (imgUrl: string, file: File) => {
    setFile(file)
    setPreviewImage(imgUrl)
    cacheData.current.file = file
    cacheData.current.avatar = imgUrl
  }

  const [requestSaveProfile] = useUpdateProfileMutation()
  const refreshProfile = useRefreshProfile()
  const notify = useNotify()
  const uploadFile = useUploadImageToCloud()
  const saveProfile = async () => {
    try {
      let avatarURL
      if (file) {
        avatarURL = await uploadFile(file)
      }
      await requestSaveProfile({
        nickname,
        avatarURL,
      }).unwrap()
      await refreshProfile(!isLogin)
      notify({
        type: NotificationType.SUCCESS,
        title: t`Profile updated`,
        summary: t`Your profile has been successfully updated`,
      })
      setFile(undefined)
    } catch (error) {
      notify({
        type: NotificationType.ERROR,
        title: t`Profile updated failed`,
        summary: t`Error occur, please try again`,
      })
    }
  }

  const displayAvatar = previewImage || userInfo?.avatarUrl
  const isVerifiedEmail = userInfo?.email && inputEmail === userInfo?.email

  const hasChangeProfile = file || (userInfo?.nickname && !nickname ? false : nickname !== userInfo?.nickname)
  const disableBtnSave = !hasChangeProfile || hasErrorInput

  return (
    <Wrapper>
      {!isMobile && (
        <Text fontSize={'24px'} fontWeight={'500'}>
          <Trans>Profile Details</Trans>
        </Text>
      )}
      <WarningSignMessage />
      <FormWrapper>
        <LeftColum>
          <FormGroup>
            <Label>
              <Trans>User Name</Trans>
            </Label>
            <Input
              color={theme.text}
              maxLength={50}
              value={nickname}
              onChange={e => onChangeNickname(e.target.value)}
              placeholder="Your nickname"
            />
          </FormGroup>

          <FormGroup>
            <Label>
              <Trans>Email Address</Trans>
            </Label>
            <InputEmail
              color={theme.text}
              hasError={hasErrorInput}
              showVerifyModal={showVerifyModal}
              errorColor={errorColor}
              onChange={onChangeEmail}
              value={inputEmail}
              isVerifiedEmail={!!isVerifiedEmail}
            />
          </FormGroup>

          {signedWallet && (
            <FormGroup>
              <Label>
                <Trans>Wallet Address</Trans>
              </Label>
              <StyledAddressInput
                style={{ color: theme.subText, cursor: 'pointer' }}
                disabled
                value={shortenAddress(chainId, signedWallet, 17, false)}
                icon={<CopyHelper toCopy={signedWallet} style={{ color: theme.subText }} />}
              />
            </FormGroup>
          )}

          <ActionsWrapper>
            <ButtonSave onClick={saveProfile} disabled={disableBtnSave}>
              <Save size={16} style={{ marginRight: '4px' }} />
              Save
            </ButtonSave>
            {signedWallet && (
              <ButtonLogout
                onClick={() => {
                  signOut(signedWallet)
                  navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PROFILE}`)
                }}
              >
                <LogOut size={16} style={{ marginRight: '4px' }} />
                Log Out
              </ButtonLogout>
            )}

            <ExportAccountButton />
          </ActionsWrapper>
        </LeftColum>

        <FormGroup style={{ width: isMobile ? '100px' : AVATAR_SIZE, alignItems: 'center' }}>
          <Label style={{ textAlign: 'center' }}>
            <Trans>Profile Picture</Trans>
          </Label>
          <FileInput onImgChange={handleFileChange} image>
            <AvatarWrapper>
              <Avatar url={displayAvatar} size={isMobile ? 50 : 84} color={theme.subText} />
            </AvatarWrapper>
          </FileInput>
        </FormGroup>
      </FormWrapper>
      <VerifyCodeModal
        isOpen={isShowVerify}
        onDismiss={onDismissVerifyModal}
        email={inputEmail}
        onVerifySuccess={onDismissVerifyModal}
      />
    </Wrapper>
  )
}
