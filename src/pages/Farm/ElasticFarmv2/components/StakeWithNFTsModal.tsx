import { Trans } from '@lingui/macro'
import React from 'react'
import { Plus, X } from 'react-feather'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import Pagination from 'components/Pagination'
import Row, { RowBetween, RowFit, RowWrap } from 'components/Row'
import useTheme from 'hooks/useTheme'

import PriceVisualize from './PriceVisualize'

const Wrapper = styled.div`
  padding: 20px;
  border-radius: 20px;
  background-color: var(--background);
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const ContentWrapper = styled.div`
  padding: 16px;
  border-radius: 16px;
  background-color: var(--button-black);
`

const NFTsWrapper = styled(RowWrap)`
  --gap: 12px;
  --items-in-row: 4;
`

const NFTItemWrapper = styled.div<{ active?: boolean }>`
  border: 1px solid var(--border);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-radius: 12px;
  background-color: var(--button-black);
  cursor: pointer;
  ${({ active }) =>
    active &&
    css`
      border-color: var(--primary);
      background-color: rgba(49, 203, 158, 0.15);
    `}

  :hover {
    filter: brightness(1.3);
  }
`

const CloseButton = styled.div`
  cursor: pointer;
`

export const NFTItem = ({ active }: { active?: boolean }) => {
  return (
    <NFTItemWrapper active={active}>
      <Text fontSize="12px" lineHeight="16px" color="var(--primary)">
        #123456789
      </Text>
      <PriceVisualize rangeInclude={false} />
      <Text fontSize="12px" lineHeight="16px">
        $230,23K
      </Text>
    </NFTItemWrapper>
  )
}

const StakeWithNFTsModal = ({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) => {
  const theme = useTheme()
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxWidth="min(724px, 100vw)">
      <Wrapper>
        <RowBetween>
          <Text fontSize="20px" lineHeight="24px" color={theme.text}>
            <Trans>Stake your liquidity</Trans>
          </Text>
          <CloseButton onClick={onDismiss}>
            <X />
          </CloseButton>
        </RowBetween>
        <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
          <Trans>
            Stake your liquidity positions (NFT tokens) into the farms to start earning rewards. Positions that cover
            the Active Range of the farm will earn maximum rewards
          </Trans>
        </Text>
        <ContentWrapper>
          <RowFit gap="4px" marginBottom="20px">
            <Text fontSize="12px" lineHeight="20px" color="var(--subtext)">
              <Trans>Active Range</Trans>
            </Text>
            <Text fontSize="12px" lineHeight="20px" color="var(--text)">
              0.0005788 - 0.0006523
            </Text>
          </RowFit>
          <NFTsWrapper>
            <NFTItem active />
            <NFTItem active />
            <NFTItem active />
            <NFTItem active />
            <NFTItem />
            <NFTItem />
            <NFTItem />
            <NFTItem />
          </NFTsWrapper>
          <Pagination currentPage={2} pageSize={8} totalCount={100} onPageChange={p => console.log(p)} haveBg={false} />
        </ContentWrapper>
        <ButtonPrimary width="fit-content" alignSelf="flex-end" padding="8px 18px">
          <Text fontSize="14px" lineHeight="20px" fontWeight={500}>
            <Row gap="6px">
              <Plus size={16} />
              <Trans>Stake Selected</Trans>
            </Row>
          </Text>
        </ButtonPrimary>
      </Wrapper>
    </Modal>
  )
}

export default React.memo(StakeWithNFTsModal)
