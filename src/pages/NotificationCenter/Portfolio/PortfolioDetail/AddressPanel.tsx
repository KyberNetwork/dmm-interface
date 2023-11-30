import { Trans, t } from '@lingui/macro'
import { useCallback, useMemo, useState } from 'react'
import { Eye, EyeOff, Plus, Share2 } from 'react-feather'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import {
  useGetRealtimeBalanceQuery,
  useGetWalletsPortfoliosQuery,
  useLazyGetRealtimeBalanceQuery,
} from 'services/portfolio'
import styled, { css } from 'styled-components'

import DefaultAvatar from 'assets/images/default_avatar.png'
import { NotificationType } from 'components/Announcement/type'
import { DropdownArrowIcon } from 'components/ArrowRotate'
import Avatar from 'components/Avatar'
import { ButtonAction, ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import { ProfilePanel } from 'components/Header/web3/SignWallet/ProfileContent'
import TransactionSettingsIcon from 'components/Icons/TransactionSettingsIcon'
import MenuFlyout from 'components/MenuFlyout'
import Row, { RowBetween, RowFit } from 'components/Row'
import Select, { SelectOption } from 'components/Select'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS, EMPTY_ARRAY } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import AddWalletPortfolioModal from 'pages/NotificationCenter/Portfolio/Modals/AddWalletPortfolioModal'
import { MAXIMUM_PORTFOLIO } from 'pages/NotificationCenter/Portfolio/const'
import { useAddWalletToPortfolio, useParseWalletPortfolioParam } from 'pages/NotificationCenter/Portfolio/helpers'
import {
  Portfolio,
  PortfolioWallet,
  PortfolioWalletBalanceResponse,
  PortfolioWalletPayload,
} from 'pages/NotificationCenter/Portfolio/type'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import { useNotify } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import getShortenAddress from 'utils/getShortenAddress'
import { formatDisplayNumber } from 'utils/numbers'
import { formatTime } from 'utils/time'

const BalanceGroup = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`

const browserCustomStyle = css`
  padding: 0;
  border-radius: 20px;
  top: 120px;
  right: unset;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    top: unset;
    bottom: 3.5rem;
  `};
`

const ActionGroups = styled(Row)`
  gap: 12px;
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `};
`

const ButtonCreatePortfolio = ({ portfolios }: { portfolios: Portfolio[] }) => {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { wallet, portfolioId } = useParseWalletPortfolioParam()
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const navigate = useNavigate()
  const [walletInfo, setWalletInfo] = useState<{ walletAddress: string; portfolioId: string }>({
    walletAddress: '',
    portfolioId: '',
  })
  const onDismiss = () => {
    setWalletInfo({ walletAddress: '', portfolioId: '' })
  }
  const _onAddWallet = useAddWalletToPortfolio()
  const onAddWallet = (data: PortfolioWalletPayload) => _onAddWallet({ ...data, portfolioId: walletInfo.portfolioId })
  const isMaximum = portfolios.length >= MAXIMUM_PORTFOLIO

  const addWalletOptions: SelectOption[] = useMemo(() => {
    const opts = portfolios.map(el => ({
      label: el.name,
      onSelect: () => {
        setWalletInfo({ walletAddress: wallet, portfolioId: el.id })
      },
      subLabel: t`$123 (fake)`,
    }))
    if (opts.length < MAXIMUM_PORTFOLIO) {
      opts.push({
        label: t`A new portfolio`,
        onSelect: () => {
          navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PORTFOLIO}?wallet=${wallet}`)
        },
        subLabel: '',
      })
    }
    return opts
  }, [portfolios, wallet, navigate])

  if (!account || portfolios.some(e => e.id === portfolioId) || isMaximum)
    return (
      <MouseoverTooltip
        containerStyle={{
          flex: upToSmall ? 1 : undefined,
        }}
        text={
          !account
            ? t`Connect your wallet to create portfolio.`
            : isMaximum
            ? t`You had created the maximum number of portfolio`
            : ''
        }
        placement="top"
      >
        <ButtonPrimary
          height={'36px'}
          width={'fit-content'}
          disabled={!account || isMaximum}
          onClick={() => navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PORTFOLIO}`)}
        >
          <Plus size={18} />
          &nbsp;
          <Trans>Create Portfolio</Trans>
        </ButtonPrimary>
      </MouseoverTooltip>
    )

  const addPortfolioOptions = [
    {
      label: t`Replicate this portfolio`,
      onSelect: () => navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PORTFOLIO}?cloneId=${portfolioId}`),
    },
    {
      label: t`Create a blank portfolio`,
      onSelect: () => navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PORTFOLIO}`),
    },
  ]

  const props = {
    arrowColor: theme.textReverse,
    style: {
      background: theme.primary,
      borderRadius: 999,
      height: 36,
      fontWeight: '500',
      fontSize: 14,
      flex: upToSmall ? 1 : undefined,
    },
  }

  if (wallet) {
    return (
      <>
        <Select
          {...props}
          menuStyle={{ minWidth: 280 }}
          options={addWalletOptions}
          activeRender={() => (
            <Row color={theme.textReverse}>
              <Plus size={18} />
              &nbsp;
              <Trans>Add Wallet</Trans>
            </Row>
          )}
          optionRender={item => {
            return (
              <Column gap="4px" sx={{ minHeight: '40px' }} justifyContent={'center'}>
                <Text fontSize={'16px'}>{item?.label}</Text>
                {item?.subLabel && <Text fontSize={'12px'}>{item?.subLabel}</Text>}
              </Column>
            )
          }}
          dropdownRender={menu => {
            return (
              <Column>
                <Text color={theme.subText} fontSize={'14px'} sx={{ padding: '12px 8px' }}>
                  <Trans>Add wallet to</Trans>:
                </Text>
                <div>{menu}</div>
              </Column>
            )
          }}
        />
        <AddWalletPortfolioModal
          isOpen={!!walletInfo?.walletAddress}
          onDismiss={onDismiss}
          onConfirm={onAddWallet}
          defaultWallet={walletInfo?.walletAddress}
        />
      </>
    )
  }

  return (
    <Select
      {...props}
      options={addPortfolioOptions}
      activeRender={() => (
        <Row color={theme.textReverse}>
          <Plus size={18} />
          &nbsp;
          <Trans>Create Portfolio</Trans>
        </Row>
      )}
    />
  )
}

const AddressPanel = ({
  myPortfolios,
  activePortfolio,
  data,
  isLoading,
  onShare,
}: {
  isLoading: boolean
  myPortfolios: Portfolio[]
  wallets: PortfolioWallet[]
  activePortfolio: Portfolio | undefined
  onChangeWallet: (v: string) => void
  data: PortfolioWalletBalanceResponse | undefined
  onShare: () => void
}) => {
  const theme = useTheme()
  const [showBalance, setShowBalance] = useState(true)

  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const { pathname } = useLocation()
  const isMyPortfolioPage = pathname.startsWith(APP_PATHS.MY_PORTFOLIO)
  const { wallet } = useParseWalletPortfolioParam()
  const { lastUpdatedAt, totalUsd = 0 } = data || {}

  const accountText = (
    <Text
      fontSize={'20px'}
      fontWeight={'500'}
      color={theme.text}
      sx={{
        cursor: 'pointer',
        userSelect: 'none',
        maxWidth: '250px',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
    >
      {isLoading ? '--' : activePortfolio?.name || getShortenAddress(wallet)}
    </Text>
  )
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const renderAction = useCallback(
    () => (
      <TransactionSettingsIcon
        style={{ marginRight: upToMedium ? 0 : '10px', color: theme.subText }}
        size={22}
        onClick={e => {
          e?.stopPropagation()
          setIsOpen(!isOpen)
          navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PORTFOLIO}`)
        }}
      />
    ),
    [isOpen, theme, upToMedium, navigate],
  )

  const notify = useNotify()
  const onClickPortfolio = useCallback(
    (data: Portfolio) => {
      navigate(`${APP_PATHS.MY_PORTFOLIO}/${data.id}`)
      setIsOpen(false)
      notify({
        title: t`Portfolio switched`,
        summary: t`Switched successfully to ${data.name}`,
        type: NotificationType.SUCCESS,
      })
    },
    [navigate, notify],
  )

  const otherPortfolio = useMemo(
    () => myPortfolios.filter(el => el.id !== activePortfolio?.id),
    [myPortfolios, activePortfolio],
  )
  const otherPortfolioId = otherPortfolio?.[0]?.id
  const { currentData: wallets } = useGetWalletsPortfoliosQuery(
    { portfolioId: otherPortfolioId },
    { skip: !otherPortfolioId },
  )
  // todo ask BE
  const { currentData } = useGetRealtimeBalanceQuery(
    {
      walletAddresses: wallets?.map(e => e.walletAddress) || EMPTY_ARRAY,
    },
    { skip: !wallets?.length },
  )
  const otherTotalUser = currentData?.totalUsd || 0

  const formatPortfolio = useMemo(() => {
    return otherPortfolio.map(el => ({
      data: {
        ...el,
        title: el.name,
        description: formatDisplayNumber(otherTotalUser, { style: 'currency', fractionDigits: 2 }),
        avatarUrl: '',
      },
      // todo raw data field instead ?
      renderAction,
      onClick: onClickPortfolio,
    }))
  }, [otherPortfolio, renderAction, onClickPortfolio, otherTotalUser])

  const balance = (
    <BalanceGroup>
      <Flex sx={{ gap: '12px', alignItems: 'center' }}>
        {!upToSmall && <Avatar url={activePortfolio ? DefaultAvatar : ''} size={36} color={theme.subText} />}
        <Text fontSize={'28px'} fontWeight={'500'}>
          {showBalance ? formatDisplayNumber(totalUsd, { style: 'currency', fractionDigits: 2 }) : '******'}
        </Text>
      </Flex>
    </BalanceGroup>
  )

  return (
    <>
      <RowBetween flexDirection={upToSmall ? 'column' : 'row'} align={upToSmall ? 'flex-start' : 'center'} gap="8px">
        {isLoading || !isMyPortfolioPage ? (
          accountText
        ) : (
          <MenuFlyout
            trigger={
              <RowFit>
                {accountText}
                {formatPortfolio.length > 0 && <DropdownArrowIcon rotate={isOpen} />}
              </RowFit>
            }
            customStyle={browserCustomStyle}
            isOpen={isOpen}
            toggle={() => setIsOpen(!isOpen)}
          >
            <ProfilePanel
              scroll
              options={formatPortfolio}
              activeItem={{
                onClick: () => navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PORTFOLIO}`),
                actionLabel: t`Portfolio Settings`,
                data: {
                  title: activePortfolio?.name,
                  description: formatDisplayNumber(totalUsd, { style: 'currency', fractionDigits: 2 }),
                  avatarUrl: DefaultAvatar,
                },
              }}
            />
          </MenuFlyout>
        )}

        {upToSmall && balance}

        <Text fontSize={'12px'} color={theme.subText} fontStyle={'italic'}>
          <Trans>Data last refreshed: {lastUpdatedAt ? formatTime(lastUpdatedAt) : '-'}</Trans>
        </Text>
      </RowBetween>

      <RowBetween>
        {!upToSmall && balance}

        <ActionGroups>
          <ButtonAction
            style={{ padding: '8px', background: theme.buttonGray }}
            onClick={() => setShowBalance(!showBalance)}
          >
            {showBalance ? <EyeOff size={18} color={theme.subText} /> : <Eye size={18} color={theme.subText} />}
          </ButtonAction>
          <ButtonAction style={{ padding: '8px', background: theme.buttonGray }} onClick={onShare}>
            <Share2 color={theme.subText} size={18} />
          </ButtonAction>
          <ButtonCreatePortfolio portfolios={myPortfolios} />
        </ActionGroups>
      </RowBetween>
    </>
  )
}
export default AddressPanel
