import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useMemo, useState } from 'react'
import { Flex, Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import { ReactComponent as LiquidityIcon } from 'assets/svg/liquidity_icon.svg'
import { ButtonAction } from 'components/Button'
import Column from 'components/Column'
import Icon from 'components/Icons/Icon'
import TransactionSettingsIcon from 'components/Icons/TransactionSettingsIcon'
import Wallet from 'components/Icons/Wallet'
import { TokenLogoWithChain } from 'components/Logo'
import Row, { RowFit } from 'components/Row'
import Table, { TableColumn } from 'components/Table'
import { EMPTY_ARRAY } from 'constants/index'
import useDebounce from 'hooks/useDebounce'
import useTheme from 'hooks/useTheme'
import { LiquidityScore } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Tokens/TokenAllocation'
import { PortfolioSection, SearchPortFolio } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/styled'
import { PortfolioWalletBalance, PortfolioWalletBalanceMap } from 'pages/NotificationCenter/Portfolio/type'
import { navigateToSwapPage } from 'pages/TrueSightV2/utils'
import { ExternalLink } from 'theme'
import { getEtherscanLink } from 'utils'
import getShortenAddress from 'utils/getShortenAddress'
import { formatDisplayNumber, uint256ToFraction } from 'utils/numbers'

const WalletLabelWrapper = styled.div<{ color: string }>`
  display: flex;
  gap: 2px;
  background-color: ${({ color, theme }) => rgba(color === theme.text ? theme.subText : color, 0.2)};
  color: ${({ color }) => color};
  border-radius: 16px;
  font-size: 10px;
  font-weight: 500;
  padding: 2px 4px;
  width: fit-content;
`

export const WalletLabel = ({
  color,
  walletAddress,
  chainId,
}: {
  color: string
  walletAddress: string
  chainId: ChainId
}) => {
  return (
    <WalletLabelWrapper color={color}>
      <Wallet size={12} />
      <ExternalLink href={getEtherscanLink(chainId, walletAddress, 'address')}>
        <Text color={color}>{getShortenAddress(walletAddress || '')}</Text>
      </ExternalLink>
    </WalletLabelWrapper>
  )
}

export const TokenCellWithWalletAddress = ({
  item,
  walletColor,
  style,
}: {
  item: {
    logoUrl: string
    chainId: number
    walletAddress: string
    symbol: string
  }
  walletColor?: string
  style?: CSSProperties
}) => {
  const theme = useTheme()
  return (
    <Row gap="14px" style={style}>
      <TokenLogoWithChain chainId={item.chainId} size={'36px'} tokenLogo={item.logoUrl} />
      <Column gap="4px">
        <Text fontWeight={'500'}>{item.symbol}</Text>
        <WalletLabel color={walletColor || theme.text} walletAddress={item.walletAddress} chainId={item.chainId} />
      </Column>
    </Row>
  )
}

const ActionTitle = () => {
  const theme = useTheme()
  return (
    <Flex alignItems={'center'} sx={{ gap: '4px' }} justifyContent={'flex-end'}>
      Action <TransactionSettingsIcon fill={theme.subText} size={16} />
    </Flex>
  )
}

const ActionButton = ({ item: { tokenAddress, chainId } }: { item: PortfolioWalletBalance }) => {
  const theme = useTheme()
  return (
    <Row justify="flex-end" gap="8px">
      <ButtonAction
        style={{
          backgroundColor: rgba(theme.primary, 0.2),
          padding: '4px 6px',
          color: theme.primary,
          width: '24px',
          height: '24px',
        }}
      >
        <LiquidityIcon />
      </ButtonAction>
      <ButtonAction
        style={{ backgroundColor: rgba(theme.subText, 0.2), padding: '4px' }}
        onClick={() => navigateToSwapPage({ chain: chainId, address: tokenAddress })}
      >
        <Icon id="swap" size={16} color={theme.subText} />
      </ButtonAction>
    </Row>
  )
}

const columns: TableColumn<PortfolioWalletBalance>[] = [
  { title: t`Token`, dataIndex: 'token', align: 'left', render: TokenCellWithWalletAddress },
  {
    title: t`Amount`,
    dataIndex: 'amount',
    render: ({ value, item }) =>
      formatDisplayNumber(uint256ToFraction(value, item.decimals), { style: 'decimal', significantDigits: 6 }), // todo uint256ToFraction
  },
  { title: t`Price`, dataIndex: 'priceUsd' },
  {
    title: t`Real Value`,
    dataIndex: 'amountUsd',
    render: ({ value }) => formatDisplayNumber(value, { style: 'currency', fractionDigits: 2 }),
  },
  {
    title: t`Liquidity Score`,
    dataIndex: 'token',
    render: LiquidityScore,
    tooltip: (
      <Trans>
        Liquidity Score of a token refers to how easily that token can be bought or sold in the market without
        significantly impacting its price. Read more <ExternalLink href="/todo">here ↗</ExternalLink>
      </Trans>
    ),
  },
  {
    title: t`24H Volatility Score`,
    dataIndex: 'token',
    render: () => 'test',
    tooltip: (
      <Trans>
        Volatility score measures the price volatility of the token. Find out more about the score{' '}
        <ExternalLink href="/todo">here ↗</ExternalLink>
      </Trans>
    ),
  },
  {
    title: t`KyberScore`,
    dataIndex: 'token',
    render: () => 'test',
    tooltip: (
      <Trans>
        KyberScore uses AI to measure the upcoming trend of a token (bullish or bearish) by taking into account multiple
        on-chain and off-chain indicators. The score ranges from 0 to 100. The higher the score, the more bullish the
        token in the short-term. Read more <ExternalLink href="/todo">here ↗</ExternalLink>
      </Trans>
    ),
  },
  {
    title: <ActionTitle />,
    align: 'right',
    dataIndex: 'token',
    render: ActionButton,
  },
]
export default function WalletInfo({
  balances,
}: {
  balances: PortfolioWalletBalanceMap | undefined
  loading: boolean
}) {
  const theme = useTheme()

  const [search, setSearch] = useState('')
  const searchDebounce = useDebounce(search, 500)
  const formatData = useMemo(() => {
    if (!balances) return EMPTY_ARRAY
    const list = Object.values(balances).flat()
    return searchDebounce
      ? list.filter(
          e =>
            e.symbol.toLowerCase().includes(searchDebounce.toLowerCase()) ||
            e.tokenAddress.toLowerCase().includes(searchDebounce.toLowerCase()),
        )
      : list
  }, [balances, searchDebounce])

  return (
    <PortfolioSection
      title={
        <RowFit gap="4px" color={theme.subText}>
          <Wallet />
          <Trans>Wallet</Trans>
        </RowFit>
      }
      contentStyle={{ padding: 0 }}
      actions={
        <SearchPortFolio
          onChange={setSearch}
          value={search}
          placeholder={t`Search by token symbol or token address`}
          style={{
            width: 330,
            height: 32,
            backgroundColor: theme.buttonBlack,
            border: `1px solid ${theme.buttonGray}`,
          }}
        />
      }
    >
      <Table data={formatData} columns={columns} totalItems={formatData.length} />
    </PortfolioSection>
  )
}
