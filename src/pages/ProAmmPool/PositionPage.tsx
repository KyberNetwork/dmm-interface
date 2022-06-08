import React, { useCallback, useMemo, useRef, useState } from 'react'
import { TransactionResponse } from '@ethersproject/providers'
import { BigNumber } from '@ethersproject/bignumber'
import { useActiveWeb3React } from 'hooks'
import useTheme from '../../hooks/useTheme'
import { Link, RouteComponentProps } from 'react-router-dom'
import { useProAmmPositionsFromTokenId } from 'hooks/useProAmmPositions'
import { useToken } from 'hooks/Tokens'
import { useProAmmPositionTokenURI } from 'hooks/useProAmmPositionTokenURI'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { PoolState, usePool } from 'hooks/usePools'
import { NonfungiblePositionManager, Pool, Position } from '@kyberswap/ks-sdk-elastic'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import { getPriceOrderingFromPositionForUI } from './PositionListItem'
import { Currency, Percent, Price, Token } from '@kyberswap/ks-sdk-core'
import { useProAmmPositionFees } from 'hooks/useProAmmPositionFees'
import { useIsTransactionPending, useTransactionAdder } from 'state/transactions/hooks'
import { useProAmmNFTPositionManagerContract } from 'hooks/useContract'
import { AutoColumn } from 'components/Column'
import { t, Trans } from '@lingui/macro'
import styled from 'styled-components'
import { RowBetween, RowFixed } from 'components/Row'
import { ButtonConfirmed, ButtonGray, ButtonPrimary } from 'components/Button'
import { ExternalLink, HideExtraSmall, TYPE } from 'theme'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Badge from 'components/Badge'
import RangeBadge from 'components/Badge/RangeBadge'
import { useSingleCallResult } from 'state/multicall/hooks'
import { currencyId } from 'utils/currencyId'
import { DarkCard, LightCard } from 'components/Card'
import { calculateGasMargin, getEtherscanLink } from 'utils'
import Loader from 'components/Loader'
import CurrencyLogo from 'components/CurrencyLogo'
import { Dots } from 'components/swapv2/styleds'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import Toggle from 'components/Toggle'
import RateToggle from 'components/RateToggle'
import { Bound } from 'state/mint/proamm/actions'
import { formatTickPrice } from 'utils/formatTickPrice'
import { MouseoverTooltip } from 'components/Tooltip'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import useTransactionDeadline from 'hooks/useTransactionDeadline'

const PageWrapper = styled.div`
  min-width: 800px;
  max-width: 960px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    min-width: 680px;
    max-width: 680px;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    min-width: 600px;
    max-width: 600px;
  `};

  @media only screen and (max-width: 620px) {
    min-width: 500px;
    max-width: 500px;
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    min-width: 340px;
    max-width: 340px;
  `};
`

const BadgeText = styled.div`
  font-weight: 500;
  font-size: 14px;
`

// responsive text
// disable the warning because we don't use the end prop, we just want to filter it out
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Label = styled(({ end, ...props }) => <TYPE.main {...props} />)<{ end?: boolean }>`
  display: flex;
  font-size: 16px;
  justify-content: ${({ end }) => (end ? 'flex-end' : 'flex-start')};
  align-items: center;
`

const ExtentsText = styled.span`
  color: ${({ theme }) => theme.text2};
  font-size: 14px;
  text-align: center;
  margin-right: 4px;
  font-weight: 500;
`

const DoubleArrow = styled.span`
  color: ${({ theme }) => theme.text3};
  margin: 0 1rem;
`
const ResponsiveRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    align-items: flex-start;
    row-gap: 16px;
    width: 100%:
  `};
`

const ResponsiveButtonPrimary = styled(ButtonPrimary)`
  border-radius: 12px;
  padding: 6px 8px;
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex: 1 1 auto;
    width: 49%;
  `};
`

const NFTGrid = styled.div`
  display: grid;
  grid-template: 'overlap';
  min-height: 400px;
`

const NFTCanvas = styled.canvas`
  grid-area: overlap;
`

const NFTImage = styled.img`
  grid-area: overlap;
  height: 400px;
  /* Ensures SVG appears on top of canvas. */
  z-index: 1;
`

// snapshots a src img into a canvas
function getSnapshot(src: HTMLImageElement, canvas: HTMLCanvasElement, targetHeight: number) {
  const context = canvas.getContext('2d')

  if (context) {
    let { width, height } = src

    // src may be hidden and not have the target dimensions
    const ratio = width / height
    height = targetHeight
    width = Math.round(ratio * targetHeight)

    // Ensure crispness at high DPIs
    canvas.width = width * devicePixelRatio
    canvas.height = height * devicePixelRatio
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    context.scale(devicePixelRatio, devicePixelRatio)

    context.clearRect(0, 0, width, height)
    context.drawImage(src, 0, 0, width, height)
  }
}

function NFT({ image, height: targetHeight }: { image: string; height: number }) {
  const [animate, setAnimate] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  return (
    <NFTGrid
      onMouseEnter={() => {
        setAnimate(true)
      }}
      onMouseLeave={() => {
        // snapshot the current frame so the transition to the canvas is smooth
        if (imageRef.current && canvasRef.current) {
          getSnapshot(imageRef.current, canvasRef.current, targetHeight)
        }
        setAnimate(false)
      }}
    >
      <NFTCanvas ref={canvasRef} />
      <NFTImage
        ref={imageRef}
        src={image}
        hidden={!animate}
        onLoad={() => {
          // snapshot for the canvas
          if (imageRef.current && canvasRef.current) {
            getSnapshot(imageRef.current, canvasRef.current, targetHeight)
          }
        }}
      />
    </NFTGrid>
  )
}

function CurrentPriceCard({
  inverted,
  pool,
  currencyQuote,
  currencyBase,
}: {
  inverted?: boolean
  pool?: Pool | null
  currencyQuote?: Currency
  currencyBase?: Currency
}) {
  if (!pool || !currencyQuote || !currencyBase) {
    return null
  }

  return (
    <LightCard padding="12px ">
      <AutoColumn gap="8px" justify="center">
        <ExtentsText>
          <Trans>Current Price</Trans>
        </ExtentsText>
        <TYPE.mediumHeader textAlign="center">
          {(inverted ? pool.token1Price : pool.token0Price).toSignificant(6)}{' '}
        </TYPE.mediumHeader>
        <ExtentsText>
          <Trans>
            {currencyQuote?.symbol} per {currencyBase?.symbol}
          </Trans>
        </ExtentsText>
      </AutoColumn>
    </LightCard>
  )
}

function LinkedCurrency({ chainId, currency }: { chainId?: number; currency?: Currency }) {
  const address = (currency as Token)?.address

  if (typeof chainId === 'number' && address) {
    return (
      <ExternalLink href={getEtherscanLink(chainId, address, 'token')}>
        <RowFixed>
          <CurrencyLogo currency={currency} size={'20px'} style={{ marginRight: '0.5rem' }} />
          <TYPE.main>{currency?.symbol} ↗</TYPE.main>
        </RowFixed>
      </ExternalLink>
    )
  }

  return (
    <RowFixed>
      <CurrencyLogo currency={currency} size={'20px'} style={{ marginRight: '0.5rem' }} />
      <TYPE.main>{currency?.symbol} ↗</TYPE.main>
    </RowFixed>
  )
}

const useInverter = ({
  priceLower,
  priceUpper,
  quote,
  base,
  invert,
}: {
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  quote?: Token
  base?: Token
  invert?: boolean
}): {
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  quote?: Token
  base?: Token
} => {
  return {
    priceUpper: invert ? priceLower?.invert() : priceUpper,
    priceLower: invert ? priceUpper?.invert() : priceLower,
    quote: invert ? base : quote,
    base: invert ? quote : base,
  }
}

function getRatio(
  lower: Price<Currency, Currency>,
  current: Price<Currency, Currency>,
  upper: Price<Currency, Currency>,
) {
  try {
    if (!current.greaterThan(lower)) {
      return 100
    } else if (!current.lessThan(upper)) {
      return 0
    }

    const a = Number.parseFloat(lower.toSignificant(15))
    const b = Number.parseFloat(upper.toSignificant(15))
    const c = Number.parseFloat(current.toSignificant(15))

    const ratio = Math.floor((1 / ((Math.sqrt(a * b) - Math.sqrt(b * c)) / (c - Math.sqrt(b * c)) + 1)) * 100)

    if (ratio < 0 || ratio > 100) {
      throw Error('Out of range')
    }

    return ratio
  } catch {
    return undefined
  }
}

export default function PositionPage({
  match: {
    params: { tokenId: tokenIdFromUrl },
  },
}: RouteComponentProps<{ tokenId?: string }>) {
  const { chainId, account, library } = useActiveWeb3React()
  const theme = useTheme()

  const parsedTokenId = tokenIdFromUrl ? BigNumber.from(tokenIdFromUrl) : undefined
  const { loading, position: positionDetails } = useProAmmPositionsFromTokenId(parsedTokenId)

  const { token0: token0Address, token1: token1Address, fee: feeAmount, liquidity, tickLower, tickUpper, tokenId } =
    positionDetails || {}

  const removed = liquidity?.eq(0)

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)
  const metadata = useProAmmPositionTokenURI(parsedTokenId)

  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  // flag for receiving WETH
  const [receiveWETH, setReceiveWETH] = useState(false)

  // construct Position from details returned
  const [poolState, pool] = usePool(token0 ?? undefined, token1 ?? undefined, feeAmount)
  const position = useMemo(() => {
    if (pool && liquidity && typeof tickLower === 'number' && typeof tickUpper === 'number') {
      return new Position({ pool, liquidity: liquidity.toString(), tickLower, tickUpper })
    }
    return undefined
  }, [liquidity, pool, tickLower, tickUpper])

  const tickAtLimit = useIsTickAtLimit(feeAmount, tickLower, tickUpper)

  const pricesFromPosition = getPriceOrderingFromPositionForUI(position)
  const [manuallyInverted, setManuallyInverted] = useState(false)
  // handle manual inversion
  const { priceLower, priceUpper, base } = useInverter({
    priceLower: pricesFromPosition.priceLower,
    priceUpper: pricesFromPosition.priceUpper,
    quote: pricesFromPosition.quote,
    base: pricesFromPosition.base,
    invert: manuallyInverted,
  })

  const inverted = token1 ? base?.equals(token1) : undefined
  const currencyQuote = inverted ? currency0 : currency1
  const currencyBase = inverted ? currency1 : currency0

  const ratio = useMemo(() => {
    return priceLower && pool && priceUpper
      ? getRatio(
          inverted ? priceUpper.invert() : priceLower,
          pool.token0Price,
          inverted ? priceLower.invert() : priceUpper,
        )
      : undefined
  }, [inverted, pool, priceLower, priceUpper])

  const [feeValue0, feeValue1] = useProAmmPositionFees(
    positionDetails?.tokenId,
    pool && positionDetails
      ? new Position({
          pool: pool,
          liquidity: positionDetails.liquidity.toString(),
          tickLower: positionDetails.tickLower,
          tickUpper: positionDetails.tickUpper,
        })
      : undefined,
    receiveWETH,
  )

  const [collecting, setCollecting] = useState<boolean>(false)
  const [collectMigrationHash, setCollectMigrationHash] = useState<string | null>(null)

  const isCollectPending = useIsTransactionPending(collectMigrationHash ?? undefined)
  const [showConfirm, setShowConfirm] = useState(false)

  const addTransactionWithType = useTransactionAdder()
  const positionManager = useProAmmNFTPositionManagerContract()

  const deadline = useTransactionDeadline() // custom from users settings
  const collect = useCallback(() => {
    if (!chainId || !feeValue0 || !feeValue1 || !positionManager || !account || !tokenId || !library || !deadline)
      return
    setCollecting(true)

    const { calldata, value } = NonfungiblePositionManager.collectCallParameters({
      tokenId: tokenId.toString(),
      expectedCurrencyOwed0: feeValue0,
      expectedCurrencyOwed1: feeValue1,
      recipient: account,
      deadline: deadline.toString(),
      havingFee: true,
    })
    const txn = {
      to: positionManager.address,
      data: calldata,
      value,
    }

    library
      .getSigner()
      .estimateGas(txn)
      .then(estimate => {
        const newTxn = {
          ...txn,
          gasLimit: calculateGasMargin(estimate),
        }
        return library
          .getSigner()
          .sendTransaction(newTxn)
          .then((response: TransactionResponse) => {
            setCollectMigrationHash(response.hash)
            setCollecting(false)

            addTransactionWithType(response, {
              type: 'Collect fee',
              summary: feeValue0.currency.symbol + ' and ' + feeValue1.currency.symbol,
            })
          })
      })
      .catch(error => {
        setCollecting(false)
        console.error(error)
      })
  }, [chainId, feeValue0, feeValue1, positionManager, account, tokenId, addTransactionWithType, library, deadline])

  // const collect = useCallback(() => {
  //   if (!chainId || !positionManager || !account || !tokenId || !library) return
  //   setCollecting(true)
  //   const { calldata, value } = NonfungiblePositionManager.collectCallParameters({
  //     tokenId: tokenId.toString(),
  //     expectedCurrencyOwed0: 0,
  //     expectedCurrencyOwed1: 0
  //     recipient: account
  //   })

  // const txn = {
  //   to: positionManager.address,
  //   data: calldata,
  //   value,
  // }
  // }, [chainId, positionManager, account, tokenId, addTransactionWithType, library])

  const owner = useSingleCallResult(!!tokenId ? positionManager : null, 'ownerOf', [tokenId?.toNumber()]).result?.[0]
  const ownsNFT = owner === account || positionDetails?.operator === account
  const feeValueUpper = inverted ? feeValue0 : feeValue1
  const feeValueLower = inverted ? feeValue1 : feeValue0

  // check if price is within range
  const below = pool && typeof tickLower === 'number' ? pool.tickCurrent < tickLower : undefined
  const above = pool && typeof tickUpper === 'number' ? pool.tickCurrent >= tickUpper : undefined
  const inRange: boolean = typeof below === 'boolean' && typeof above === 'boolean' ? !below && !above : false
  const showCollectAsWeth = Boolean(
    ownsNFT &&
      (feeValue0?.greaterThan(0) || feeValue1?.greaterThan(0)) &&
      currency0 &&
      currency1 &&
      (currency0.isNative || currency1.isNative) &&
      !collectMigrationHash,
  )

  function modalHeader() {
    return (
      <AutoColumn gap={'md'} style={{ marginTop: '20px' }}>
        <LightCard padding="12px 16px">
          <AutoColumn gap="md">
            <RowBetween>
              <RowFixed>
                <CurrencyLogo currency={feeValueUpper?.currency} size={'20px'} style={{ marginRight: '0.5rem' }} />
                <TYPE.main>{feeValueUpper ? formatCurrencyAmount(feeValueUpper, 4) : '-'}</TYPE.main>
              </RowFixed>
              <TYPE.main>{feeValueUpper?.currency?.symbol}</TYPE.main>
            </RowBetween>
            <RowBetween>
              <RowFixed>
                <CurrencyLogo currency={feeValueLower?.currency} size={'20px'} style={{ marginRight: '0.5rem' }} />
                <TYPE.main>{feeValueLower ? formatCurrencyAmount(feeValueLower, 4) : '-'}</TYPE.main>
              </RowFixed>
              <TYPE.main>{feeValueLower?.currency?.symbol}</TYPE.main>
            </RowBetween>
          </AutoColumn>
        </LightCard>
        <TYPE.italic>
          <Trans>Collecting fees will withdraw currently available fees for you.</Trans>
        </TYPE.italic>
        <ButtonPrimary onClick={collect}>
          <Trans>Collect</Trans>
        </ButtonPrimary>
      </AutoColumn>
    )
  }
  return loading || poolState === PoolState.LOADING || !feeAmount ? (
    <Loader />
  ) : (
    <>
      <PageWrapper>
        <TransactionConfirmationModal
          isOpen={showConfirm}
          onDismiss={() => setShowConfirm(false)}
          attemptingTxn={collecting}
          hash={collectMigrationHash ?? ''}
          content={() => (
            <ConfirmationModalContent
              title={t`Claim fees`}
              onDismiss={() => setShowConfirm(false)}
              topContent={modalHeader}
              bottomContent={() => <></>}
            />
          )}
          pendingText={t`Collecting fees`}
        />
        <AutoColumn gap="md">
          <AutoColumn gap="sm">
            <Link style={{ textDecoration: 'none', width: 'fit-content', marginBottom: '0.5rem' }} to="/pool">
              <Trans>← Back to Pools Overview</Trans>
            </Link>
            <ResponsiveRow>
              <RowFixed>
                <DoubleCurrencyLogo currency0={currencyBase} currency1={currencyQuote} size={24} margin={true} />
                <TYPE.main fontSize={'24px'} mr="10px">
                  &nbsp;{currencyQuote?.symbol}&nbsp;/&nbsp;{currencyBase?.symbol}
                </TYPE.main>
                <Badge style={{ marginRight: '8px' }}>
                  <BadgeText>
                    <Trans>{new Percent(feeAmount, 1_000_000).toSignificant()}%</Trans>
                  </BadgeText>
                </Badge>
                <RangeBadge removed={removed} inRange={inRange} />
              </RowFixed>
              {ownsNFT && (
                <RowFixed>
                  {currency0 && currency1 && feeAmount && tokenId ? (
                    <ButtonGray
                      as={Link}
                      to={`/proamm/increase/${currencyId(currency0, chainId)}/${currencyId(
                        currency1,
                        chainId,
                      )}/${feeAmount}/${tokenId}`}
                      width="fit-content"
                      padding="6px 8px"
                      style={{ marginRight: '8px' }}
                    >
                      <Trans>Increase Liquidity</Trans>
                    </ButtonGray>
                  ) : null}
                  {tokenId && !removed ? (
                    <ResponsiveButtonPrimary
                      as={Link}
                      to={`/proamm/remove/${tokenId}`}
                      width="fit-content"
                      padding="6px 8px"
                    >
                      <Trans>Remove Liquidity</Trans>
                    </ResponsiveButtonPrimary>
                  ) : null}
                </RowFixed>
              )}
            </ResponsiveRow>
            <RowBetween></RowBetween>
          </AutoColumn>
          <ResponsiveRow align="flex-start">
            {'result' in metadata ? (
              <DarkCard
                width="100%"
                height="100%"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexDirection: 'column',
                  justifyContent: 'space-around',
                  marginRight: '12px',
                }}
              >
                <div style={{ marginRight: 12 }}>
                  <NFT image={metadata.result.image} height={400} />
                </div>
                {typeof chainId === 'number' && owner && !ownsNFT ? (
                  <ExternalLink href={chainId && owner && getEtherscanLink(chainId, owner, 'address')}>
                    <Trans>Owner</Trans>
                  </ExternalLink>
                ) : null}
              </DarkCard>
            ) : (
              <DarkCard
                width="100%"
                height="100%"
                style={{
                  marginRight: '12px',
                  minWidth: '340px',
                }}
              >
                <Loader />
              </DarkCard>
            )}
            <AutoColumn gap="sm" style={{ width: '100%', height: '100%' }}>
              <DarkCard>
                <AutoColumn gap="md" style={{ width: '100%' }}>
                  <AutoColumn gap="md">
                    <Label>
                      <Trans>Liquidity</Trans>
                    </Label>
                    {/* {fiatValueOfLiquidity?.greaterThan(new Fraction(1, 100)) ? (
                      <TYPE.largeHeader fontSize="36px" fontWeight={500}>
                        <Trans>${fiatValueOfLiquidity.toFixed(2, { groupSeparator: ',' })}</Trans>
                      </TYPE.largeHeader>
                    ) : (
                      <TYPE.largeHeader color={theme.text} fontSize="36px" fontWeight={500}>
                        <Trans>$- (todo)</Trans>
                      </TYPE.largeHeader>
                    )} */}
                    <TYPE.largeHeader color={theme.text} fontSize="36px" fontWeight={500}>
                      <Trans>$- (todo)</Trans>
                    </TYPE.largeHeader>
                  </AutoColumn>
                  <LightCard padding="12px 16px">
                    <AutoColumn gap="md">
                      <RowBetween>
                        <LinkedCurrency chainId={chainId} currency={currencyQuote} />
                        <RowFixed>
                          <TYPE.main>
                            {inverted ? position?.amount0.toSignificant(4) : position?.amount1.toSignificant(4)}
                          </TYPE.main>
                          {typeof ratio === 'number' && !removed ? (
                            <Badge style={{ marginLeft: '10px' }}>
                              <TYPE.main fontSize={11}>
                                <Trans>{inverted ? ratio : 100 - ratio}%</Trans>
                              </TYPE.main>
                            </Badge>
                          ) : null}
                        </RowFixed>
                      </RowBetween>
                      <RowBetween>
                        <LinkedCurrency chainId={chainId} currency={currencyBase} />
                        <RowFixed>
                          <TYPE.main>
                            {inverted ? position?.amount1.toSignificant(4) : position?.amount0.toSignificant(4)}
                          </TYPE.main>
                          {typeof ratio === 'number' && !removed ? (
                            <Badge style={{ marginLeft: '10px' }}>
                              <TYPE.main color={theme.text2} fontSize={11}>
                                <Trans>{inverted ? 100 - ratio : ratio}%</Trans>
                              </TYPE.main>
                            </Badge>
                          ) : null}
                        </RowFixed>
                      </RowBetween>
                    </AutoColumn>
                  </LightCard>
                </AutoColumn>
              </DarkCard>
              <DarkCard>
                <AutoColumn gap="md" style={{ width: '100%' }}>
                  <AutoColumn gap="md">
                    <RowBetween style={{ alignItems: 'flex-start' }}>
                      <AutoColumn gap="md">
                        <Label>
                          <Trans>Unclaimed fees</Trans>
                        </Label>
                        {/* {fiatValueOfFees?.greaterThan(new Fraction(1, 100)) ? (
                          <TYPE.largeHeader color={theme.green1} fontSize="36px" fontWeight={500}>
                            <Trans>${fiatValueOfFees.toFixed(2, { groupSeparator: ',' })}</Trans>
                          </TYPE.largeHeader>
                        ) : (
                          <TYPE.largeHeader color={theme.text1} fontSize="36px" fontWeight={500}>
                            <Trans>$-(todo)</Trans>
                          </TYPE.largeHeader>
                        )} */}
                        <TYPE.largeHeader color={theme.text} fontSize="36px" fontWeight={500}>
                          <Trans>$-(todo)</Trans>
                        </TYPE.largeHeader>
                      </AutoColumn>
                      {ownsNFT && (feeValue0?.greaterThan(0) || feeValue1?.greaterThan(0) || !!collectMigrationHash) ? (
                        <ButtonConfirmed
                          disabled={collecting || !!collectMigrationHash}
                          confirmed={!!collectMigrationHash && !isCollectPending}
                          width="fit-content"
                          style={{ borderRadius: '12px' }}
                          padding="4px 8px"
                          onClick={() => setShowConfirm(true)}
                        >
                          {!!collectMigrationHash && !isCollectPending ? (
                            <TYPE.main color={theme.text}>
                              <Trans> Collected</Trans>
                            </TYPE.main>
                          ) : isCollectPending || collecting ? (
                            <TYPE.main color={theme.text}>
                              {' '}
                              <Dots>
                                <Trans>Collecting</Trans>
                              </Dots>
                            </TYPE.main>
                          ) : (
                            <>
                              <TYPE.main color={theme.white}>
                                <Trans>Collect fees</Trans>
                              </TYPE.main>
                            </>
                          )}
                        </ButtonConfirmed>
                      ) : null}
                      <TYPE.main color={theme.white}>
                        <Trans>Collect fees</Trans>
                      </TYPE.main>
                    </RowBetween>
                  </AutoColumn>
                  <LightCard padding="12px 16px">
                    <AutoColumn gap="md">
                      <RowBetween>
                        <RowFixed>
                          <CurrencyLogo
                            currency={feeValueUpper?.currency}
                            size={'20px'}
                            style={{ marginRight: '0.5rem' }}
                          />
                          <TYPE.main>{feeValueUpper?.currency?.symbol}</TYPE.main>
                        </RowFixed>
                        <RowFixed>
                          <MouseoverTooltip text={feeValueUpper?.toSignificant(20)}>
                            <TYPE.main>{feeValueUpper ? feeValueUpper?.toSignificant(20) : '-'}</TYPE.main>
                          </MouseoverTooltip>
                        </RowFixed>
                      </RowBetween>
                      <RowBetween>
                        <RowFixed>
                          <CurrencyLogo
                            currency={feeValueLower?.currency}
                            size={'20px'}
                            style={{ marginRight: '0.5rem' }}
                          />
                          <TYPE.main>{feeValueLower?.currency?.symbol}</TYPE.main>
                        </RowFixed>
                        <RowFixed>
                          <MouseoverTooltip text={feeValueLower?.toSignificant(20)}>
                            <TYPE.main>{feeValueLower ? feeValueLower?.toSignificant(20) : '-'}</TYPE.main>
                          </MouseoverTooltip>
                        </RowFixed>
                      </RowBetween>
                    </AutoColumn>
                  </LightCard>
                  {showCollectAsWeth && (
                    <AutoColumn gap="md">
                      <RowBetween>
                        <TYPE.main>
                          <Trans>Collect as WETH</Trans>
                        </TYPE.main>
                        <Toggle
                          id="receive-as-weth"
                          isActive={receiveWETH}
                          toggle={() => setReceiveWETH(receiveWETH => !receiveWETH)}
                        />
                      </RowBetween>
                    </AutoColumn>
                  )}
                </AutoColumn>
              </DarkCard>
            </AutoColumn>
          </ResponsiveRow>
          <DarkCard>
            <AutoColumn gap="md">
              <RowBetween>
                <RowFixed>
                  <TYPE.main display="flex" style={{ marginRight: '12px' }}>
                    <Trans>Price range</Trans>
                  </TYPE.main>
                  <HideExtraSmall>
                    <>
                      <RangeBadge removed={removed} inRange={inRange} />
                      <span style={{ width: '8px' }} />
                    </>
                  </HideExtraSmall>
                </RowFixed>
                <RowFixed>
                  {currencyBase && currencyQuote && (
                    <RateToggle
                      currencyA={currencyBase}
                      currencyB={currencyQuote}
                      handleRateToggle={() => setManuallyInverted(!manuallyInverted)}
                    />
                  )}
                </RowFixed>
              </RowBetween>
              <RowBetween>
                <LightCard padding="12px" width="100%">
                  <AutoColumn gap="8px" justify="center">
                    <ExtentsText>
                      <Trans>MIN PRICE</Trans>
                    </ExtentsText>
                    <TYPE.mediumHeader textAlign="center">
                      {formatTickPrice(priceLower, tickAtLimit, Bound.LOWER)}
                    </TYPE.mediumHeader>
                    <ExtentsText>
                      {' '}
                      <Trans>
                        {currencyQuote?.symbol} per {currencyBase?.symbol}
                      </Trans>
                    </ExtentsText>

                    {inRange && (
                      <TYPE.small color={theme.text3}>
                        <Trans>Your position will be 100% {currencyBase?.symbol} at this price.</Trans>
                      </TYPE.small>
                    )}
                  </AutoColumn>
                </LightCard>

                <DoubleArrow>⟷</DoubleArrow>
                <LightCard padding="12px" width="100%">
                  <AutoColumn gap="8px" justify="center">
                    <ExtentsText>
                      <Trans>MAX PRICE</Trans>
                    </ExtentsText>
                    <TYPE.mediumHeader textAlign="center">
                      {formatTickPrice(priceUpper, tickAtLimit, Bound.UPPER)}
                    </TYPE.mediumHeader>
                    <ExtentsText>
                      {' '}
                      <Trans>
                        {currencyQuote?.symbol} per {currencyBase?.symbol}
                      </Trans>
                    </ExtentsText>

                    {inRange && (
                      <TYPE.small color={theme.text3}>
                        <Trans>Your position will be 100% {currencyQuote?.symbol} at this price.</Trans>
                      </TYPE.small>
                    )}
                  </AutoColumn>
                </LightCard>
              </RowBetween>

              <CurrentPriceCard
                inverted={inverted}
                pool={pool}
                currencyQuote={currencyQuote}
                currencyBase={currencyBase}
              />
            </AutoColumn>
          </DarkCard>
        </AutoColumn>
      </PageWrapper>
    </>
  )
}
