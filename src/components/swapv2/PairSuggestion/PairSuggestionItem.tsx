import React from 'react'
import { useAllTokens } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'
import { SuggestionPairData } from './request'
import { Star } from 'react-feather'
import { isMobile } from 'react-device-detect'
import Logo from 'components/Logo'
import { useActiveWeb3React } from 'hooks'
import { isActivePair } from './utils'
import { rgba } from 'polished'

const ItemWrapper = styled.div<{ isActive: boolean }>`
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${({ theme, isActive }) => (isActive ? rgba(theme.buttonBlack, 0.5) : 'transparent')};
  padding: 1em;
  &:hover {
    background-color: ${({ theme }) => rgba(theme.buttonBlack, 0.5)};
  }
`

const StyledLogo = styled(Logo)`
  width: 20px;
  height: 20px;
  border-radius: 100%;
`

type PropsType = {
  onClickStar: () => void
  onSelectPair: () => void
  data: SuggestionPairData
  isActive: boolean
  amount: string
  isFavorite?: boolean
}
export default function SuggestItem({ data, isFavorite, isActive, amount, onClickStar, onSelectPair }: PropsType) {
  const theme = useTheme()
  const activeTokens = useAllTokens(true)
  const { account } = useActiveWeb3React()
  const { tokenInSymbol, tokenOutSymbol, tokenInImgUrl, tokenOutImgUrl, tokenInName, tokenOutName } = data

  const handleClickStar = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClickStar()
  }

  const isTokenNotImport = !isActivePair(activeTokens, data)
  return (
    <ItemWrapper
      tabIndex={isTokenNotImport ? 0 : undefined}
      className={isTokenNotImport ? 'no-blur' : ''}
      onClick={onSelectPair}
      isActive={isActive && !isMobile}
    >
      <Flex alignItems="center" style={{ gap: 10 }}>
        <Flex alignItems="flex-start" height="100%">
          <StyledLogo style={{ marginRight: 5 }} srcs={[tokenInImgUrl]} alt={tokenInSymbol} />
          <StyledLogo srcs={[tokenOutImgUrl]} alt={tokenOutSymbol} />
        </Flex>
        <div style={{ flex: 1 }}>
          <Text color={theme.text}>
            {amount} {tokenInSymbol} - {tokenOutSymbol}
          </Text>
          <Text color={theme.border} fontSize={14}>
            {tokenInName} - {tokenOutName}
          </Text>
        </div>
      </Flex>
      <Flex height="100%" tabIndex={0} className="no-blur">
        {!isTokenNotImport && account && (
          <Star
            fill={isFavorite ? theme.primary : 'none'}
            color={isFavorite ? theme.primary : theme.subText}
            onClick={handleClickStar}
            size={20}
          />
        )}
      </Flex>
    </ItemWrapper>
  )
}
