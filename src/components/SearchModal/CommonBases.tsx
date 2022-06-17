import React from 'react'
import { Text } from 'rebass'
import { Currency, Token, ChainId } from '@kyberswap/ks-sdk-core'
import styled from 'styled-components'
import { t, Trans } from '@lingui/macro'

import { SUGGESTED_BASES } from '../../constants'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import { AutoRow } from '../Row'
import CurrencyLogo from '../CurrencyLogo'
import { nativeOnChain } from 'constants/tokens'

const BaseWrapper = styled.div<{ disable?: boolean }>`
  border: 1px solid ${({ theme, disable }) => (disable ? 'transparent' : theme.bg3)};
  border-radius: 10px;
  display: flex;
  padding: 6px;

  align-items: center;
  :hover {
    cursor: ${({ disable }) => !disable && 'pointer'};
    background-color: ${({ theme, disable }) => !disable && theme.bg2};
  }

  background-color: ${({ theme, disable }) => disable && theme.bg3};
  opacity: ${({ disable }) => disable && '0.4'};
`

export default function CommonBases({
  chainId,
  onSelect,
  selectedCurrency,
}: {
  chainId?: ChainId
  selectedCurrency?: Currency | null
  onSelect: (currency: Currency) => void
}) {
  return (
    <AutoColumn gap="md">
      <AutoRow>
        <Text fontWeight={500} fontSize={14}>
          <Trans>Common bases</Trans>
        </Text>
        <QuestionHelper text={t`These tokens are commonly paired with other tokens`} />
      </AutoRow>
      <AutoRow gap="4px">
        <BaseWrapper
          onClick={() => {
            if (!selectedCurrency || !selectedCurrency.isNative) {
              onSelect(nativeOnChain(chainId as number))
            }
          }}
          disable={selectedCurrency?.isNative}
        >
          <CurrencyLogo currency={nativeOnChain(chainId as number)} style={{ marginRight: 8 }} />
          <Text fontWeight={500} fontSize={16}>
            {chainId &&
              [
                ChainId.MAINNET,
                ChainId.ROPSTEN,
                ChainId.RINKEBY,
                ChainId.GÖRLI,
                ChainId.KOVAN,
                ChainId.ARBITRUM,
                ChainId.ARBITRUM_TESTNET,
                ChainId.OPTIMISM,
              ].includes(chainId) &&
              `ETH`}
            {chainId && [ChainId.MATIC, ChainId.MUMBAI].includes(chainId) && `MATIC`}
            {chainId && [ChainId.BSCMAINNET, ChainId.BSCTESTNET].includes(chainId) && `BNB`}
            {chainId && [ChainId.AVAXMAINNET, ChainId.AVAXTESTNET].includes(chainId) && `AVAX`}
            {chainId && [ChainId.FANTOM].includes(chainId) && `FTM`}
            {chainId && [ChainId.CRONOS, ChainId.CRONOSTESTNET].includes(chainId) && `CRO`}
            {chainId && [ChainId.BTTC].includes(chainId) && `BTT`}
            {chainId && [ChainId.AURORA].includes(chainId) && `ETH`}
            {chainId && [ChainId.VELAS].includes(chainId) && 'VLX'}
            {chainId && [ChainId.OASIS].includes(chainId) && 'ROSE'}
          </Text>
        </BaseWrapper>
        {(chainId ? SUGGESTED_BASES[chainId] : []).map((token: Token) => {
          const selected = selectedCurrency instanceof Token && selectedCurrency.address === token.address
          let showWToken: Currency = token
          if (chainId) {
            showWToken = token
          }

          return (
            <BaseWrapper onClick={() => !selected && onSelect(showWToken)} disable={selected} key={token.address}>
              <CurrencyLogo currency={showWToken} style={{ marginRight: 8 }} />
              <Text fontWeight={500} fontSize={16}>
                {showWToken.symbol}
              </Text>
            </BaseWrapper>
          )
        })}
      </AutoRow>
    </AutoColumn>
  )
}
