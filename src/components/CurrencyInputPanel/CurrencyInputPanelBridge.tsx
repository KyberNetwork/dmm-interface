import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Flex, Text } from 'rebass'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import Wallet from 'components/Icons/Wallet'
import { RowFixed } from 'components/Row'
import CurrencySearchModalBridge from 'components/SearchModal/bridge/CurrencySearchModalBridge'
import { EMPTY_ARRAY, ETHER_ADDRESS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useTokenBalanceOfAnotherChain } from 'hooks/bridge'
import useTheme from 'hooks/useTheme'
import SelectNetwork from 'pages/Bridge/SelectNetwork'
import { useBridgeState } from 'state/bridge/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { useTokenPricesWithLoading } from 'state/tokenPrices/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { formattedNum } from 'utils'

import CurrencyLogo from '../CurrencyLogo'
import { Input as NumericalInput } from '../NumericalInput'
import { Aligner, Container, CurrencySelect, InputPanel, InputRow, StyledTokenName } from './index'

interface CurrencyInputPanelBridgeProps {
  value: string
  error?: boolean
  onUserInput?: (value: string) => void
  onMax?: () => void
  onCurrencySelect: (currency: WrappedTokenInfo) => void
  id: string
  isOutput?: boolean
  onSelectNetwork: (chain: ChainId) => void
  chainIds: ChainId[]
  selectedChainId: ChainId | undefined
}

const noop = (value: string) => {
  //
}
export default function CurrencyInputPanelBridge({
  error,
  value,
  onUserInput = noop,
  onSelectNetwork,
  chainIds,
  onMax,
  selectedChainId,
  onCurrencySelect,
  isOutput = false,
  id,
}: CurrencyInputPanelBridgeProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const { chainId, account } = useActiveWeb3React()
  const [{ currencyIn, currencyOut, listTokenOut, chainIdOut, loadingToken }] = useBridgeState()
  const currency = isOutput ? currencyOut : currencyIn
  const selectedCurrencyBalance = useCurrencyBalance(isOutput ? undefined : currency ?? undefined)
  const balanceRef = useRef(selectedCurrencyBalance?.toSignificant(10))
  const destBalance = useTokenBalanceOfAnotherChain(chainIdOut, isOutput ? currency : undefined)

  const currencyAddress: string = !currency ? '' : currency.isNative ? ETHER_ADDRESS : currency.wrapped.address

  const tokenAddresses = useMemo(() => {
    if (currencyAddress) {
      return [currencyAddress]
    }

    return EMPTY_ARRAY
  }, [currencyAddress])

  const { data: tokenPriceData, refetch } = useTokenPricesWithLoading(tokenAddresses, currency?.chainId)

  const currencyValueInUSD = tokenPriceData?.[currencyAddress] * Number(value)
  const currencyValueString =
    Number.isNaN(currencyValueInUSD) || Number(value) === 0 ? '' : formattedNum(String(currencyValueInUSD), true)

  useEffect(() => {
    balanceRef.current = undefined
  }, [chainId])

  // Keep previous value of balance if rpc node was down
  useEffect(() => {
    if (!!selectedCurrencyBalance) balanceRef.current = selectedCurrencyBalance.toSignificant(10)
    if (!currency || !account) balanceRef.current = '0'
  }, [selectedCurrencyBalance, currency, account])

  const theme = useTheme()

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  useEffect(() => {
    if (!currencyIn) {
      return
    }

    const interval = setInterval(() => {
      refetch()
    }, 10_000)

    return () => {
      clearInterval(interval)
    }
  }, [currencyIn, refetch])

  const disabledSelect = listTokenOut.length === 1 && isOutput
  const formatDestBalance = destBalance?.greaterThan('0') ? destBalance.toFixed(10) : 0

  return (
    <div style={{ width: '100%' }}>
      <InputPanel id={id}>
        <Container hideInput={false} selected={false} error={error}>
          <Flex justifyContent="space-between" fontSize="12px" marginBottom="12px" alignItems="center">
            <SelectNetwork chainIds={chainIds} onSelectNetwork={onSelectNetwork} selectedChainId={selectedChainId} />
            <Flex
              onClick={() => onMax && onMax()}
              style={{ cursor: onMax ? 'pointer' : undefined }}
              alignItems="center"
            >
              <Wallet color={theme.subText} />
              <Text fontWeight={500} color={theme.subText} marginLeft="4px">
                {isOutput ? formatDestBalance : selectedCurrencyBalance?.toSignificant(10) || balanceRef.current || 0}
              </Text>
            </Flex>
          </Flex>
          <InputRow>
            <NumericalInput
              error={error}
              className="token-amount-input"
              value={value}
              disabled={isOutput}
              onUserInput={onUserInput}
            />

            {currencyValueString ? (
              <Text fontSize="0.875rem" marginRight="8px" fontWeight="500" color={theme.border}>
                ~{currencyValueString}
              </Text>
            ) : null}

            <CurrencySelect
              selected={!!currency}
              className="open-currency-select-button"
              onClick={() => !disabledSelect && !loadingToken && setModalOpen(true)}
              style={{ cursor: disabledSelect ? 'default' : 'pointer', paddingRight: disabledSelect ? '8px' : 0 }}
            >
              <Aligner>
                <RowFixed>
                  {currency && <CurrencyLogo currency={currency} size={'20px'} />}
                  <StyledTokenName
                    className="token-symbol-container"
                    active={Boolean(currency?.symbol)}
                    style={{ paddingRight: 0 }}
                  >
                    {currency?.symbol || (loadingToken ? <Trans>Loading tokens</Trans> : <Trans>Select a token</Trans>)}
                  </StyledTokenName>
                </RowFixed>
                {disabledSelect ? <div /> : <DropdownSVG />}
              </Aligner>
            </CurrencySelect>
          </InputRow>
        </Container>
        <CurrencySearchModalBridge
          isOutput={isOutput}
          isOpen={modalOpen}
          onDismiss={handleDismissSearch}
          onCurrencySelect={onCurrencySelect}
        />
      </InputPanel>
    </div>
  )
}
