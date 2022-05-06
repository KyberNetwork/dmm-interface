import React, { useState, useRef, useEffect, useMemo } from 'react'
import Modal from 'components/Modal'
import { Flex, Text } from 'rebass'
import { Trans } from '@lingui/macro'
import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import { X } from 'react-feather'
import useTheme from 'hooks/useTheme'
import { useProMMFarms, useFarmAction } from 'state/farms/promm/hooks'
import { Position, FeeAmount } from '@vutien/dmm-v3-sdk'
import { useToken, useTokens } from 'hooks/Tokens'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { usePool, usePools } from 'hooks/usePools'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import RangeBadge from 'components/Badge/RangeBadge'
import { BigNumber } from 'ethers'
import { useTokensPrice } from 'state/application/hooks'
import { formatDollarAmount } from 'utils/numbers'
import { ModalContentWrapper, Checkbox, TableHeader, TableRow, Title } from './styled'
import { UserPositionFarm } from 'state/farms/promm/types'
import { MouseoverTooltip } from 'components/Tooltip'
import { Token } from '@vutien/sdk-core'

const PositionRow = ({
  position,
  onChange,
  selected,
}: {
  selected: boolean
  position: UserPositionFarm
  onChange: (value: boolean) => void
}) => {
  const { token0: token0Address, token1: token1Address, fee: feeAmount, liquidity, tickLower, tickUpper } = position

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)
  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  const usdPrices = useTokensPrice([token0, token1], 'promm')

  // construct Position from details returned
  const [, pool] = usePool(currency0 ?? undefined, currency1 ?? undefined, feeAmount)

  const positionSDK = useMemo(() => {
    if (pool) {
      return new Position({ pool, liquidity: liquidity.toString(), tickLower, tickUpper })
    }
    return undefined
  }, [liquidity, pool, tickLower, tickUpper])

  const removed = BigNumber.from(position.liquidity.toString()).eq(0)
  const outOfRange =
    positionSDK &&
    (positionSDK.pool.tickCurrent < position.tickLower || positionSDK.pool.tickCurrent > position.tickUpper)

  const theme = useTheme()

  const usd =
    (usdPrices?.[0] || 0) * parseFloat(positionSDK?.amount0.toExact() || '0') +
    (usdPrices?.[1] || 0) * parseFloat(positionSDK?.amount1.toExact() || '0')

  return (
    <TableRow>
      {!position.stakedLiquidity.gt(BigNumber.from(0)) ? (
        <Checkbox
          type="checkbox"
          onChange={e => {
            onChange(e.currentTarget.checked)
          }}
          checked={selected}
        />
      ) : (
        <MouseoverTooltip text="You will need to unstake this position first before you can withdraw it">
          <Flex
            width={'17.5px'}
            height="17.5px"
            backgroundColor={theme.disableText}
            sx={{ borderRadius: '2px' }}
            alignItems="center"
            justifyContent="center"
          >
            <X size={14} color="#333" />
          </Flex>
        </MouseoverTooltip>
      )}
      <Flex alignItems="center">
        <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={16} />
        <Text>{position.tokenId.toString()}</Text>
      </Flex>
      <Text>{formatDollarAmount(usd)}</Text>
      <Flex justifyContent="flex-end" sx={{ gap: '4px' }} alignItems="center">
        {positionSDK?.amount0.toSignificant(6)}
        <CurrencyLogo size="16px" currency={currency0} />
      </Flex>

      <Flex justifyContent="flex-end" sx={{ gap: '4px' }} alignItems="center">
        {positionSDK?.amount1.toSignificant(6)}
        <CurrencyLogo size="16px" currency={currency1} />
      </Flex>

      <Flex justifyContent="flex-end">
        <RangeBadge removed={removed} inRange={!outOfRange} />
      </Flex>
    </TableRow>
  )
}

function WithdrawModal({ selectedFarmAddress, onDismiss }: { onDismiss: () => void; selectedFarmAddress: string }) {
  const theme = useTheme()
  const checkboxGroupRef = useRef<any>()
  const { data: farms } = useProMMFarms()
  const selectedFarm = farms[selectedFarmAddress]

  const userDepositedNFTs = useMemo(() => {
    return (selectedFarm || []).reduce((allNFTs, farm) => {
      return [...allNFTs, ...farm.userDepositedNFTs]
    }, [] as UserPositionFarm[])
  }, [selectedFarm])

  // const tokenList = useMemo(() => {
  //   return userDepositedNFTs.map(pos => [pos.token0, pos.token1]).flat()
  // }, [userDepositedNFTs])

  // const tokens = useTokens(tokenList)

  // const poolKeys = useMemo(() => {
  //   if (!tokens) return []
  //   return userDepositedNFTs.map(
  //     pos =>
  //       [tokens[pos.token0], tokens[pos.token1], pos.fee] as [
  //         Token | undefined,
  //         Token | undefined,
  //         FeeAmount | undefined,
  //       ],
  //   )
  // }, [tokens, userDepositedNFTs])

  // const pools = usePools(poolKeys)

  const withDrawableNFTs = useMemo(() => {
    return userDepositedNFTs.filter(item => item.stakedLiquidity.eq(0))
  }, [userDepositedNFTs])

  const [selectedNFTs, setSeletedNFTs] = useState<string[]>([])

  const { withdraw } = useFarmAction(selectedFarmAddress)

  useEffect(() => {
    if (!checkboxGroupRef.current) return
    if (selectedNFTs.length === 0) {
      checkboxGroupRef.current.checked = false
      checkboxGroupRef.current.indeterminate = false
    } else if (selectedNFTs.length > 0 && withDrawableNFTs?.length && selectedNFTs.length < withDrawableNFTs?.length) {
      checkboxGroupRef.current.checked = false
      checkboxGroupRef.current.indeterminate = true
    } else {
      checkboxGroupRef.current.checked = true
      checkboxGroupRef.current.indeterminate = false
    }
  }, [selectedNFTs.length, withDrawableNFTs])

  if (!selectedFarmAddress) return null

  const handleWithdraw = async () => {
    await withdraw(selectedNFTs.map(item => BigNumber.from(item)))
    onDismiss()
  }

  return (
    <Modal isOpen={!!selectedFarm} onDismiss={onDismiss} width="80vw" maxHeight={80} maxWidth="808px">
      <ModalContentWrapper>
        <Flex alignItems="center" justifyContent="space-between">
          <Title>
            <Trans>Withdraw your liquidity</Trans>
          </Title>

          <Flex sx={{ gap: '12px' }}>
            <ButtonEmpty onClick={onDismiss} width="36px" height="36px" padding="0">
              <X color={theme.text} />
            </ButtonEmpty>
          </Flex>
        </Flex>

        <Text fontSize="12px" marginTop="20px" color={theme.subText} fontStyle="italic">
          <Trans>You will need to unstake your liquidity first before withdrawing it back to your wallet</Trans>
        </Text>

        <TableHeader>
          <Checkbox
            type="checkbox"
            ref={checkboxGroupRef}
            onChange={e => {
              if (e.currentTarget.checked) {
                setSeletedNFTs(withDrawableNFTs.map(pos => pos.tokenId.toString()) || [])
              } else {
                setSeletedNFTs([])
              }
            }}
          />
          <Text textAlign="left">ID</Text>
          <Text textAlign="left">
            <Trans>Your liquidity</Trans>
          </Text>
          <Text textAlign="right">Token 1</Text>
          <Text textAlign="right">Token 2</Text>
          <Text textAlign="right">Status</Text>
        </TableHeader>

        <div style={{ overflowY: 'scroll' }}>
          {userDepositedNFTs.map(pos => (
            <PositionRow
              selected={selectedNFTs.includes(pos.tokenId.toString())}
              key={pos.tokenId.toString()}
              position={pos}
              onChange={(selected: boolean) => {
                if (selected) setSeletedNFTs(prev => [...prev, pos.tokenId.toString()])
                else {
                  setSeletedNFTs(prev => prev.filter(item => item !== pos.tokenId.toString()))
                }
              }}
            />
          ))}
        </div>
        <Flex justifyContent="space-between" marginTop="24px">
          <div></div>
          <ButtonPrimary
            fontSize="14px"
            padding="10px 24px"
            width="fit-content"
            onClick={handleWithdraw}
            disabled={!selectedNFTs.length}
          >
            <Trans>Withdraw Selected</Trans>
          </ButtonPrimary>
        </Flex>
      </ModalContentWrapper>
    </Modal>
  )
}

export default WithdrawModal
