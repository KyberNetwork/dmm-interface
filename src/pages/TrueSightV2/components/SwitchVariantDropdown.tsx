import { AnimatePresence, motion } from 'framer-motion'
import { useRef, useState } from 'react'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import { useSearchParams } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as Down } from 'assets/svg/down.svg'
import Icon from 'components/Icons/Icon'
import Row, { RowFit } from 'components/Row'
import { ICON_ID } from 'constants/index'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'

const Wrapper = styled.div`
  position: relative;
`
const SelectButton = styled(RowFit)`
  height: 36px;
  border-radius: 99px;
  padding: 8px 12px;
  background-color: ${({ theme }) => theme.buttonGray};
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  width: 135px;

  :hover {
    z-index: 10;
    filter: brightness(1.2);
  }
`

const DropdownWrapper = styled(motion.div)`
  position: absolute;
  width: 100%;
  border-radius: 14px;
  background-color: ${({ theme }) => theme.buttonGray};
  left: 0;
  top: calc(100% + 2px);
  padding: 4px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const DropdownItem = styled(Row)`
  height: 32px;
  padding: 4px 8px;
  gap: 8px;
  border-radius: 4px;
  cursor: pointer;
  :hover {
    filter: brightness(1.2);
    background-color: ${({ theme }) => theme.background};
  }
`

const VARIANTS: { [key: string]: { icon_id: ICON_ID; title: string } } = {
  ethereum: { icon_id: 'eth-mono', title: 'Ethereum' },
  bsc: { icon_id: 'bnb-mono', title: 'Binance' },
  avalanche: { icon_id: 'ava-mono', title: 'Avalanche' },
  polygon: { icon_id: 'matic-mono', title: 'Polygon' },
  arbitrum: { icon_id: 'arbitrum-mono', title: 'Arbitrum' },
  fantom: { icon_id: 'fantom-mono', title: 'Fantom' },
  optimism: { icon_id: 'optimism-mono', title: 'Optimism' },
}

export default function SwitchVariantDropdown({ variants }: { variants?: { chain: string; address: string }[] }) {
  const theme = useTheme()
  const [show, setShow] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [, setSearchParams] = useSearchParams()
  useOnClickOutside(ref, () => setShow(false))
  const firstItem = variants?.[0]
  if (!firstItem)
    return (
      <SkeletonTheme
        height="36px"
        direction="ltr"
        duration={1}
        baseColor={theme.buttonGray}
        highlightColor={theme.border}
        width="135px"
        borderRadius="99px"
      >
        <Skeleton />
      </SkeletonTheme>
    )

  const setChainAndAdress = (variant: { chain: string; address: string }) => {
    setSearchParams({ chain: variant.chain, address: variant.address })
  }
  const variant = !!firstItem && VARIANTS[firstItem?.chain]
  return (
    <Wrapper ref={ref}>
      <SelectButton onClick={() => setShow(true)}>
        <Icon id={variant.icon_id} title={variant.title} size={20} />
        <Text style={{ flex: 1 }}>{variant.title}</Text>
        <Down />
      </SelectButton>
      <AnimatePresence>
        {show && (
          <DropdownWrapper
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            {variants.map(item => {
              const itemVariant = VARIANTS[item.chain]
              return (
                <DropdownItem
                  key={item.chain + '_' + item.address}
                  onClick={() => {
                    setShow(false)
                    setChainAndAdress(item)
                  }}
                >
                  <Icon id={itemVariant.icon_id} title={itemVariant.title} size={20} />
                  <Text style={{ flex: 1 }}>{itemVariant.title}</Text>
                </DropdownItem>
              )
            })}
          </DropdownWrapper>
        )}
      </AnimatePresence>
    </Wrapper>
  )
}
