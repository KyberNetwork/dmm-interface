import React, { useEffect, useState } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { Trans } from '@lingui/macro'
import { Currency } from '@kyberswap/ks-sdk-core'
import { Box, Flex, Text } from 'rebass'
import Loader from 'components/Loader'
import CurrencyLogo from 'components/CurrencyLogo'
import useTokenInfo from 'hooks/useTokenInfo'
import { formattedNum, shortenAddress } from 'utils'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { formatLongNumber } from 'utils/formatBalance'

const NOT_AVAIALBLE = '--'

const Wrapper = styled.div<{ borderBottom?: boolean }>`
  width: 100%;
  border-bottom: ${({ borderBottom, theme }) => (borderBottom ? `1px solid ${theme.border}` : 'none')};
  padding: 30px 0px;
  @media only screen and (max-width: 768px) {
    padding-bottom: 10px;
  }
`

const InfoRow = styled.div<{ isFirst?: boolean; isLast?: boolean }>`
  padding: 7px 0px 7px ${({ isFirst }) => (isFirst ? '0px' : '40px')};
  border-left: ${({ theme, isFirst }) => (isFirst ? 'none' : `1px solid ${theme.border}`)};
  width: 33%;
  @media only screen and (max-width: 768px) {
    width: 100%;
    border-left: none;
    padding: 20px 0px;
    border-bottom: ${({ theme, isLast }) => (isLast ? 'none' : `1px solid ${theme.border}`)};
  }
`

const InfoRowValue = styled.div`
  color: ${({ theme }) => theme.text};
  font-size: 20px;
  font-weight: 400;
`

const InfoRowLabel = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  font-weight: 500;
  padding-bottom: 8px;
`

const AboutText = styled.div`
  color: ${({ theme }) => theme.text};
  font-size: 20px;
  font-weight: 400;
  margin-left: 10px;
  margin-bottom: 15px;
`
const DescText = styled(InfoRowLabel)`
  margin: 10px 0px;
  line-height: 20px;
`

const TokenInfo = ({ currency, borderBottom }: { currency?: Currency; borderBottom?: boolean }) => {
  const inputNativeCurrency = useCurrencyConvertedToNative(currency)
  const inputToken = inputNativeCurrency?.wrapped
  const { data: tokenInfo, loading } = useTokenInfo(inputToken)
  if (!currency) return null
  return (
    <Wrapper borderBottom={borderBottom}>
      <Flex>
        <CurrencyLogo currency={inputNativeCurrency} size="24px" />
        <AboutText>About {inputNativeCurrency?.symbol}</AboutText>
      </Flex>

      <DescText>
        <div dangerouslySetInnerHTML={{ __html: tokenInfo?.description?.en }}></div>
      </DescText>

      <Flex flexWrap={'wrap'}>
        <InfoRow isFirst={true}>
          <InfoRowLabel>
            <Trans>Price</Trans>
          </InfoRowLabel>
          <InfoRowValue>
            {loading ? <Loader /> : tokenInfo.price ? formattedNum(tokenInfo.price.toString(), true) : NOT_AVAIALBLE}
          </InfoRowValue>
        </InfoRow>

        <InfoRow>
          <InfoRowLabel>
            <Trans>Market Cap Rank</Trans>
          </InfoRowLabel>

          <InfoRowValue>
            {loading ? (
              <Loader />
            ) : tokenInfo.marketCapRank ? (
              `#${formattedNum(tokenInfo.marketCapRank.toString())}`
            ) : (
              NOT_AVAIALBLE
            )}
          </InfoRowValue>
        </InfoRow>

        <InfoRow isLast={true}>
          <InfoRowLabel>
            <Trans>24H Volume</Trans>
          </InfoRowLabel>

          <InfoRowValue>
            {loading ? (
              <Loader />
            ) : tokenInfo.tradingVolume ? (
              formatLongNumber(tokenInfo.tradingVolume.toString(), true)
            ) : (
              NOT_AVAIALBLE
            )}
          </InfoRowValue>
        </InfoRow>
      </Flex>
    </Wrapper>
  )
}

export default TokenInfo
