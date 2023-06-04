import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { transparentize } from 'polished'
import { memo, useMemo } from 'react'
import { ArrowRight } from 'react-feather'
import { useNavigate } from 'react-router'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled, { keyframes } from 'styled-components'

import bannerBackground from 'assets/images/truesight-v2/banner-background.png'
import Column from 'components/Column'
import ApeIcon from 'components/Icons/ApeIcon'
import Row, { RowBetween, RowFit } from 'components/Row'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import KyberScoreMeter from 'pages/TrueSightV2/components/KyberScoreMeter'
import { NETWORK_TO_CHAINID } from 'pages/TrueSightV2/constants'
import { SUPPORTED_NETWORK_KYBERAI } from 'pages/TrueSightV2/constants/index'
import { useTokenDetailQuery } from 'pages/TrueSightV2/hooks/useKyberAIData'
import { calculateValueToColor } from 'pages/TrueSightV2/utils'
import { useIsWhiteListKyberAI } from 'state/user/hooks'
import { MEDIA_WIDTHS } from 'theme'

const StaticSupportedToken: {
  [chain: number]: { kyberScore?: number; label?: string; address?: string; logo?: string; symbol?: string }[]
} = {
  [ChainId.MATIC]: [
    {
      address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
      symbol: 'MATIC',
      logo: NETWORKS_INFO[ChainId.MATIC].nativeToken.logo,
    },
  ],
  [ChainId.MAINNET]: [
    {
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      symbol: 'ETH',
      logo: NETWORKS_INFO[ChainId.MAINNET].nativeToken.logo,
    },
  ],
  [ChainId.ARBITRUM]: [
    {
      address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
      symbol: 'ETH',
      logo: NETWORKS_INFO[ChainId.MAINNET].nativeToken.logo,
    },
  ],
  [ChainId.OPTIMISM]: [
    {
      address: '0x4200000000000000000000000000000000000006',
      symbol: 'ETH',
      logo: NETWORKS_INFO[ChainId.MAINNET].nativeToken.logo,
    },
  ],
  [ChainId.BSCMAINNET]: [
    {
      address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
      symbol: 'BNB',
      logo: NETWORKS_INFO[ChainId.BSCMAINNET].nativeToken.logo,
    },
  ],
  [ChainId.FANTOM]: [
    {
      address: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
      symbol: 'FTM',
      logo: NETWORKS_INFO[ChainId.FANTOM].nativeToken.logo,
    },
  ],
  [ChainId.AVAXMAINNET]: [
    {
      address: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
      symbol: 'AVAX',
      logo: NETWORKS_INFO[ChainId.AVAXMAINNET].nativeToken.logo,
    },
  ],
}

const KyberAITokenBanner = ({
  currencyIn,
  currencyOut,
}: {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
}) => {
  const { chainId, account } = useActiveWeb3React()
  const { isWhiteList } = useIsWhiteListKyberAI()
  const navigate = useNavigate()
  const { mixpanelHandler } = useMixpanel()
  const chain = Object.keys(NETWORK_TO_CHAINID).find(i => NETWORK_TO_CHAINID[i] === chainId)
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)
  const theme = useTheme()
  const staticMode = !isWhiteList || !account
  const token0 = currencyIn?.wrapped
  const token1 = currencyOut?.wrapped

  const { data: tokenInputOverview, isFetching: fetching0 } = useTokenDetailQuery(
    { address: token0?.address, chain },
    { skip: !token0?.address || !account || !isWhiteList, refetchOnMountOrArgChange: true },
  )

  const { data: tokenOutputOverview, isFetching: fetching1 } = useTokenDetailQuery(
    { address: token1?.address, chain },
    { skip: !token1?.address || !account || !isWhiteList, refetchOnMountOrArgChange: true },
  )

  const { data: tokenNativeOverview, isFetching: fetching2 } = useTokenDetailQuery(
    { address: NativeCurrencies[chainId].wrapped.address, chain },
    { skip: !account || !isWhiteList, refetchOnMountOrArgChange: true },
  )

  const isFetching = fetching0 || fetching1 || fetching2

  const token: { kyberScore?: number; label?: string; address?: string; logo?: string; symbol?: string } | undefined =
    useMemo(() => {
      if (isFetching) return undefined

      if (staticMode) {
        const index0 = StaticSupportedToken[chainId as number]?.findIndex(
          i => i.address?.toLowerCase() === token0?.address?.toLowerCase(),
        )
        const index1 = StaticSupportedToken[chainId as number]?.findIndex(
          i => i.address?.toLowerCase() === token1?.address?.toLowerCase(),
        )
        if (index0 >= 0) {
          return StaticSupportedToken[chainId as number]?.[index0]
        } else if (index1 >= 0) {
          return StaticSupportedToken[chainId as number]?.[index1]
        } else {
          return undefined
        }
      }

      const token =
        tokenInputOverview?.kyberScore && tokenInputOverview.kyberScore.label !== ''
          ? tokenInputOverview
          : tokenOutputOverview?.kyberScore && tokenOutputOverview.kyberScore.label !== ''
          ? tokenOutputOverview
          : tokenNativeOverview?.kyberScore && tokenNativeOverview.kyberScore.label !== ''
          ? tokenNativeOverview
          : undefined

      return {
        kyberScore: token?.kyberScore?.score,
        label: token?.kyberScore?.label,
        address: token?.address,
        logo: token?.logo,
        symbol: token?.symbol,
      }
    }, [
      isFetching,
      tokenInputOverview,
      tokenOutputOverview,
      tokenNativeOverview,
      chainId,
      staticMode,
      token0?.address,
      token1?.address,
    ])

  if (!token) return null

  const color = staticMode ? theme.primary : calculateValueToColor(token?.kyberScore || 0, theme)
  return (
    <Wrapper>
      {above768 ? (
        <Container
          color={color}
          onClick={() => {
            mixpanelHandler(MIXPANEL_TYPE.KYBERAI_SWAP_INSIGHT_CLICK, {
              input_token: token0?.symbol?.toUpperCase(),
              output_token: token1?.symbol?.toUpperCase(),
            })
            window.open(
              APP_PATHS.KYBERAI_EXPLORE + '/' + SUPPORTED_NETWORK_KYBERAI[chainId] + '/' + token?.address,
              '_blank',
            )
          }}
        >
          <RowFit gap="8px">
            <img src={token?.logo} alt={token?.symbol} width="32" height="32" style={{ borderRadius: '50%' }} />
            <Column gap="4px">
              <Text color={theme.text}>{token?.symbol?.toUpperCase() || '--'} seems to be</Text>
              {staticMode ? (
                <AnimatedKyberscoreLabels />
              ) : (
                <Text color={color} fontWeight={600}>
                  {token?.label || '--'}
                </Text>
              )}
            </Column>
          </RowFit>
          <SkewKyberScoreWrapper>
            {staticMode ? (
              <KyberScoreMeter value={1} staticMode fontSize="14px" style={{ height: '32px' }} />
            ) : (
              <KyberScoreMeter
                value={token?.kyberScore || 0}
                noAnimation
                fontSize="18px"
                hiddenValue
                style={{ height: '32px' }}
              />
            )}
            <RowFit fontSize="10px" gap="4px">
              <ApeIcon size={14} /> KyberScore
            </RowFit>
          </SkewKyberScoreWrapper>
          <Column gap="4px" padding="0 26px">
            <Text fontSize="12px">
              <Trans>
                Want to know the{' '}
                <Text as="b" color={theme.text}>
                  KyberScore
                </Text>{' '}
                for {token?.symbol?.toUpperCase() || 'KNC'}?
              </Trans>
            </Text>
            <RowFit fontSize="12px" gap="4px">
              <Trans>
                Explore with{' '}
                <Text as="span" color={theme.primary}>
                  KyberAI
                </Text>{' '}
                here!{' '}
              </Trans>
              <ArrowRight
                size={14}
                stroke={theme.primary}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  mixpanelHandler(MIXPANEL_TYPE.KYBERAI_SWAP_INSIGHT_CLICK, {
                    input_token: token0?.symbol?.toUpperCase(),
                    output_token: token1?.symbol?.toUpperCase(),
                  })

                  navigate(APP_PATHS.KYBERAI_EXPLORE + '/' + SUPPORTED_NETWORK_KYBERAI[chainId] + '/' + token?.address)
                }}
              />
            </RowFit>
          </Column>
          <div style={{ width: '100px' }}></div>
        </Container>
      ) : (
        <MobileContainer
          color={color}
          onClick={() => {
            mixpanelHandler(MIXPANEL_TYPE.KYBERAI_SWAP_INSIGHT_CLICK, {
              input_token: token0?.symbol?.toUpperCase(),
              output_token: token1?.symbol?.toUpperCase(),
            })
            window.open(
              APP_PATHS.KYBERAI_EXPLORE + '/' + SUPPORTED_NETWORK_KYBERAI[chainId] + '/' + token?.address,
              '_blank',
            )
          }}
        >
          <RowBetween>
            <RowFit gap="8px">
              <img src={token?.logo} alt={token?.symbol} width="32" height="32" style={{ borderRadius: '50%' }} />
              <Column gap="4px">
                <Text color={theme.text}>{token?.symbol?.toUpperCase() || '--'} seems to be</Text>
                {staticMode ? (
                  <AnimatedKyberscoreLabels />
                ) : (
                  <Text color={color} fontWeight={600}>
                    {token?.label || '--'}
                  </Text>
                )}
              </Column>
            </RowFit>
            <SkewKyberScoreWrapper style={{ width: '120x', height: '74px' }}>
              {staticMode ? (
                <KyberScoreMeter value={1} staticMode fontSize="14px" style={{ height: '36px' }} />
              ) : (
                <KyberScoreMeter
                  value={token?.kyberScore || 0}
                  noAnimation
                  fontSize="14px"
                  hiddenValue
                  style={{ height: '36px' }}
                />
              )}
              <RowFit fontSize="10px" gap="4px">
                <ApeIcon size={14} /> KyberScore
              </RowFit>
            </SkewKyberScoreWrapper>
          </RowBetween>
          <Row fontSize="12px" gap="4px" justify="center">
            <Trans>
              Explore with <span style={{ color: theme.primary }}>KyberAI</span> here!{' '}
            </Trans>
            <ArrowRight size={14} stroke={theme.primary} style={{ cursor: 'pointer' }} />
          </Row>
        </MobileContainer>
      )}
    </Wrapper>
  )
}

const Wrapper = styled.div`
  overflow: hidden;
  border-radius: 24px;
  margin-bottom: 16px;
  cursor: pointer;
  :hover {
    filter: brightness(1.15);
  }
  :active {
    filter: brightness(1.25);
  }
`

const Container = styled.div<{ color?: string }>`
  height: 84px;
  padding: 16px;
  background: ${({ color, theme }) =>
    `linear-gradient(90deg, ${transparentize(0.8, color || theme.text)} 0%, rgba(40, 40, 40, 0.2) 100%)`};
  width: 100%;
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
  min-width: 700px;
  white-space: nowrap;
  :after {
    content: ' ';
    background: url(${bannerBackground});
    background-size: 140%;
    background-position: 110% 15%;
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 310px;
  }
`

const MobileContainer = styled.div<{ color?: string }>`
  padding: 16px;
  background: ${({ color, theme }) =>
    `linear-gradient(90deg, ${transparentize(0.8, color || theme.text)} 0%, rgba(40, 40, 40, 0.2) 100%)`};
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const SkewKyberScoreWrapper = styled.div`
  transform: skewX(-7deg) translateZ(0);
  filter: blur(0px);
  background: linear-gradient(277.16deg, #ffffff27 -83.03%, rgba(255, 255, 255, 0) 132.01%);
  border: 0.5px solid ${({ theme }) => theme.border + '80'};
  border-radius: 12px;
  height: 62px;
  width: 100px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.12);
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`

const backAndForward = keyframes`
  0%{
    transform: translateY(0px);
  }
  5%{
    transform: translateY(-24px);
  }
  15%{
    transform: translateY(-72px);
  }
  25%{
    transform: translateY(-144px);
  }
  35%{
    transform: translateY(-48px);
  }
  45%{
    transform: translateY(-96px);
  }
  55%{
    transform: translateY(-168px);
  }
  100%{
    transform: translateY(-168px);
  }
`
const AnimatedKyberscoreWrapper = styled.div`
  height: 24px;
  width: 100%;
  overflow: hidden;
`
const LabelsWrapper = styled.div`
  height: 100px;
  width: 100%;
  display: flex;
  flex-direction: column;
  animation: ${backAndForward} 12s ease infinite;
`
const Label = styled.div<{ color?: string }>`
  height: 24px;
  width: 100%;
  line-height: 24px;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  ${({ color }) => `color: ${color};`}
`
const AnimatedKyberscoreLabels = () => {
  const theme = useTheme()
  return (
    <AnimatedKyberscoreWrapper>
      <LabelsWrapper>
        <Label color={theme.text}>??</Label>
        <Label color={theme.text}>Neutral</Label>
        <Label color={calculateValueToColor(100, theme)}>Very Bullish</Label>
        <Label color={calculateValueToColor(70, theme)}>Bullish</Label>
        <Label color={theme.text}>Neutral</Label>
        <Label color={calculateValueToColor(30, theme)}>Bearish</Label>
        <Label color={calculateValueToColor(1, theme)}>Very Bearish</Label>
        <Label color={theme.text}>??</Label>
      </LabelsWrapper>
    </AnimatedKyberscoreWrapper>
  )
}

export default memo(KyberAITokenBanner)
