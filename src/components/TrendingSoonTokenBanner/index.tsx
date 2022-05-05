import React, { CSSProperties, memo, useMemo } from 'react'
import { Currency, Token } from '@dynamic-amm/sdk'
import { useActiveWeb3React } from 'hooks'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import { Trans } from '@lingui/macro'
import CurrencyLogo from 'components/CurrencyLogo'
import { ExternalLink } from 'theme'
import styled, { keyframes } from 'styled-components'
import DiscoverIcon from 'components/Icons/DiscoverIcon'
import useGetTrendingSoonTokenId from 'pages/TrueSight/hooks/useGetTrendingSoonTokenId'
import useTheme from 'hooks/useTheme'
import { rgba } from 'polished'
import useMixpanel, { MIXPANEL_TYPE, nativeNameFromETH } from 'hooks/useMixpanel'
import { Flex } from 'rebass'

const TrendingSoonTokenBanner = ({
  currency0,
  currency1,
  style,
}: {
  currency0?: Currency
  currency1?: Currency
  style?: CSSProperties
}) => {
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()
  const { mixpanelHandler } = useMixpanel()

  const token0 = useMemo(() => wrappedCurrency(currency0, chainId), [chainId, currency0])
  const token1 = useMemo(() => wrappedCurrency(currency1, chainId), [chainId, currency1])
  const trendingToken0Id = useGetTrendingSoonTokenId(token0)
  const trendingToken1Id = useGetTrendingSoonTokenId(token1)
  const trendingSoonCurrency = useMemo(
    () => (trendingToken0Id ? currency0 : trendingToken1Id ? currency1 : undefined),
    [currency0, currency1, trendingToken0Id, trendingToken1Id],
  )

  if (trendingSoonCurrency === undefined) return null

  const currencySymbol =
    trendingSoonCurrency instanceof Token ? trendingSoonCurrency.symbol : nativeNameFromETH(chainId)

  return (
    <Container style={style}>
      <DiscoverIconWrapper>
        <DiscoverIcon size={16} color={theme.primary} />
      </DiscoverIconWrapper>
      <Flex alignItems="center">
        <CurrencyLogo currency={trendingSoonCurrency} size="16px" style={{ marginRight: '4px' }} />
        <BannerText>
          {currencySymbol} <Trans>could be trending very soon!</Trans> <Trans>View</Trans>{' '}
          <ExternalLink
            href={
              window.location.origin +
              '/#/discover?tab=trending_soon&token_id=' +
              (trendingToken0Id ?? trendingToken1Id)
            }
            target="_blank"
            onClickCapture={() => {
              mixpanelHandler(MIXPANEL_TYPE.DISCOVER_SWAP_SEE_HERE_CLICKED, { trending_token: currencySymbol })
            }}
          >
            <Trans>here</Trans>
          </ExternalLink>
        </BannerText>
      </Flex>
    </Container>
  )
}

const fadeIn = keyframes`
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
`

const Container = styled.div`
  background: ${({ theme }) => rgba(theme.primary, 0.25)};
  border-radius: 4px;
  padding: 8px 12px;
  display: grid;
  grid-template-columns: auto 1fr;
  row-gap: 4px;
  column-gap: 8px;
  animation: ${fadeIn} 0.3s linear;
`

const DiscoverIconWrapper = styled.div`
  place-self: center;
  height: 24px;
`

const BannerText = styled.div`
  //display: flex;
  //align-items: center;
  font-size: 12px;

  //> * {
  //  margin-right: 4px;
  //}
`

export default memo(TrendingSoonTokenBanner)
