import { ChainId, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import dayjs from 'dayjs'
import { BigNumber } from 'ethers'
import { rgba } from 'polished'
import { useCallback, useEffect, useState } from 'react'
import { Share2 } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import { useGetUserWeeklyRewardQuery } from 'services/campaign'
import styled from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import { ButtonOutlined } from 'components/Button'
import Divider from 'components/Divider'
import { REWARD_SERVICE_API } from 'constants/env'
import { ZERO_ADDRESS } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useNotify } from 'state/application/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { MEDIA_WIDTHS } from 'theme'
import { calculateGasMargin } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

import loBanner from './assets/limit_order.png'
import referralBanner from './assets/referral.png'
import tradingBanner from './assets/trading.png'
import { Tab, Tabs, Wrapper } from './styles'

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1.25fr 100px;
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  padding: 1rem;
  gap: 1rem;
  font-weight: 500;
`

const TableRow = styled(TableHeader)`
  font-size: 1rem;
  font-weight: 400;
  color: ${({ theme }) => theme.text};
  align-items: center;
`

const mockToken = new Token(1, ZERO_ADDRESS, 18, 'mock')

function getDateOfWeek(w: number, y: number) {
  const d = 1 + (w - 1) * 7 // 1st of January + 7 days for each week
  return new Date(y, 0, d)
}

const BASE_WEEK = 24

const MyDashboard = () => {
  const { account } = useActiveWeb3React()
  const theme = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'trading'
  const changeTab = (t: string) => {
    searchParams.set('tab', t)
    setSearchParams(searchParams)
  }

  const marketPriceMap = useTokenPrices(['0x912CE59144191C1204E64559FE8253a0e49E6548'], ChainId.ARBITRUM)
  const price = marketPriceMap?.['0x912CE59144191C1204E64559FE8253a0e49E6548'] || 0

  const { data: trading } = useGetUserWeeklyRewardQuery(
    {
      campaign: 'trading-incentive',
      wallet: account || '',
    },
    {
      skip: !account,
    },
  )

  const { data: loData } = useGetUserWeeklyRewardQuery(
    {
      campaign: 'limit-order-farming',
      wallet: account || '',
    },
    {
      skip: !account,
    },
  )

  const data = tab === 'trading' ? trading : loData

  const tradingRw = CurrencyAmount.fromRawAmount(mockToken, trading?.data?.totalReward?.split('.')[0] || '0')
  const loRw = CurrencyAmount.fromRawAmount(mockToken, loData?.data?.totalReward?.split('.')[0] || '0')
  const totalRw = formatDisplayNumber(+tradingRw.toExact() + +loRw.toExact(), { significantDigits: 6 })
  const totalRwUsd = formatDisplayNumber((+tradingRw.toExact() + +loRw.toExact()) * price, {
    significantDigits: 6,
    style: 'currency',
  })

  const tradingClaimableRw = CurrencyAmount.fromRawAmount(
    mockToken,
    trading?.data?.totalClaimableReward?.split('.')[0] || '0',
  )
  const loClaimableRw = CurrencyAmount.fromRawAmount(
    mockToken,
    loData?.data?.totalClaimableReward?.split('.')[0] || '0',
  )
  const totalClaimableRw = formatDisplayNumber(+tradingClaimableRw.toExact() + +loClaimableRw.toExact(), {
    significantDigits: 6,
  })
  const totalClaimableRwUsd = formatDisplayNumber((+tradingClaimableRw.toExact() + +loClaimableRw.toExact()) * price, {
    significantDigits: 6,
    style: 'currency',
  })

  const totalRewardByCampaign = CurrencyAmount.fromRawAmount(mockToken, data?.data?.totalReward?.split('.')[0] || '0')
  const claimableRewardByCampaign = CurrencyAmount.fromRawAmount(
    mockToken,
    data?.data?.totalClaimableReward?.split('.')[0] || '0',
  )

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  return (
    <Wrapper>
      <img
        src={tab === 'trading' ? tradingBanner : tab === 'lo' ? loBanner : referralBanner}
        width="100%"
        alt="banner"
        style={{ borderRadius: '12px' }}
      />
      <Text fontSize={24} fontWeight="500" marginTop="1.5rem" mb="1.5rem">
        My Dashboard
      </Text>

      <Flex sx={{ gap: '1rem', marginY: '24px' }} flexDirection={upToSmall ? 'column' : 'row'}>
        <Box
          sx={{
            padding: '20px 30px',
            borderRadius: '20px',
            backgroundImage: 'linear-gradient(121deg, #7177e3bf, #2C3178 104.95%)',
            flex: 1,
          }}
        >
          <Flex justifyContent="space-between" alignItems="center">
            <Text>My total estimated rewards</Text>
            <Flex
              role="button"
              alignItems="center"
              color={theme.primary}
              backgroundColor={rgba(theme.buttonBlack, 0.48)}
              padding="8px 16px"
              sx={{ borderRadius: '999px', gap: '4px', cursor: 'pointer' }}
              fontSize={14}
              fontWeight="500"
            >
              <Share2 size={14} /> Share
            </Flex>
          </Flex>
          <Flex alignItems="center" sx={{ gap: '4px' }} fontSize={24} marginTop="0.5rem">
            <img
              src="https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png"
              alt="arb"
              width="20px"
              height="20px"
              style={{ borderRadius: '50%' }}
            />
            <Text fontWeight="500">{totalRw} ARB</Text>
            <Text color="#FAFAFA80" fontSize={16} marginTop="2px">
              {totalRwUsd}
            </Text>
          </Flex>

          <Text marginTop="8px" fontStyle="italic" color="#FfFfFA99">
            Total estimated rewards of all 3 campaigns (Aggregator, Limit Order, Referral)
          </Text>
        </Box>

        <Box
          sx={{
            padding: '20px 30px',
            borderRadius: '20px',
            backgroundImage: 'linear-gradient(309.26deg, #0E3C34 -11.46%, #28CD95 207.8%)',
            flex: 1,
          }}
        >
          <Text>My claim-able rewards</Text>

          <Flex alignItems="center" sx={{ gap: '4px' }} fontSize={24} marginTop="0.5rem">
            <img
              src="https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png"
              alt="arb"
              width="20px"
              height="20px"
              style={{ borderRadius: '50%' }}
            />
            <Text fontWeight="500">{totalClaimableRw} ARB</Text>
            <Text color="#FAFAFA80" fontSize={16} marginTop="2px">
              {totalClaimableRwUsd}
            </Text>
          </Flex>

          <Text marginTop="8px" fontStyle="italic" color="#FfFfFA99">
            Total final rewards that you can claim of all 3 campaigns (Aggregator, Limit Order, Referral)
          </Text>
        </Box>
      </Flex>

      <Tabs>
        <Tab role="button" active={tab === 'trading'} onClick={() => changeTab('trading')}>
          Trading
        </Tab>
        <Tab role="button" active={tab === 'lo'} onClick={() => changeTab('lo')}>
          Limit Order
        </Tab>
        <Tab role="button" active={tab === 'referral'} onClick={() => changeTab('referral')}>
          Referral
        </Tab>
      </Tabs>

      {!account ? (
        <Text marginTop="30px" textAlign="center" color={theme.subText}>
          Please connect wallet to view your Dashboard
        </Text>
      ) : (
        <Box marginTop="1.25rem" sx={{ borderRadius: '20px', background: theme.background }} padding="1.5rem">
          <Box
            sx={{
              display: 'grid',
              gap: '1rem',
              gridTemplateColumns: upToSmall ? '1fr' : '1fr 1fr 1fr',
              marginBottom: '28px',
            }}
          >
            <div>
              <Text color={theme.subText}>Total point earned</Text>
              <Text marginTop="8px" fontSize={18} fontWeight="500">
                {formatDisplayNumber(data?.data?.totalPoint || 0, { significantDigits: 6 })}
              </Text>
            </div>
            <div>
              <Text color={theme.subText}>Total Estimated rewards</Text>
              <Flex sx={{ gap: '4px' }} marginTop="8px" alignItems="center">
                <img
                  src="https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png"
                  alt="arb"
                  width="20px"
                  height="20px"
                  style={{ borderRadius: '50%' }}
                />
                <Text fontSize={18} fontWeight="500">
                  {totalRewardByCampaign.toSignificant(6)} ARB{' '}
                  <Text color={theme.subText} as="span">
                    {formatDisplayNumber(+totalRewardByCampaign.toExact() * price, {
                      significantDigits: 4,
                      style: 'currency',
                    })}
                  </Text>
                </Text>
              </Flex>
            </div>
            <div>
              <Text color={theme.subText}>Total Claim-able rewards</Text>
              <Flex sx={{ gap: '4px' }} marginTop="8px" alignItems="center">
                <img
                  src="https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png"
                  alt="arb"
                  width="20px"
                  height="20px"
                  style={{ borderRadius: '50%' }}
                />

                <Text fontSize={18} fontWeight="500">
                  {claimableRewardByCampaign.toSignificant(6)} ARB{' '}
                  <Text color={theme.subText} as="span">
                    {formatDisplayNumber(+claimableRewardByCampaign.toExact() * price, {
                      significantDigits: 4,
                      style: 'currency',
                    })}
                  </Text>
                </Text>
              </Flex>
            </div>
          </Box>

          <Divider />

          {!upToSmall && (
            <TableHeader>
              <Text>WEEK</Text>
              <Text textAlign="right">POINTS EARNED</Text>
              <Text textAlign="right">ESTIMATED REWARDS</Text>
              <Text textAlign="right">TOTAL CLAIMABLE REWARDS</Text>
            </TableHeader>
          )}

          <Divider />

          {!data?.data?.weeklyRewards?.length && (
            <Text color={theme.subText} textAlign="center" marginTop="24px">
              No data found
            </Text>
          )}
          {data?.data?.weeklyRewards?.map(item => {
            const rw = item.reward.split('.')[0]
            const totalRw = CurrencyAmount.fromRawAmount(mockToken, rw)

            const claimable = item.claimableReward.split('.')[0]
            const claimableRw = CurrencyAmount.fromRawAmount(mockToken, claimable)
            const canClaim = claimable !== '0' && !item.isClaimed

            const date = getDateOfWeek(item.week, item.year)
            const end = getDateOfWeek(item.week + 1, item.year)

            if (upToSmall)
              return (
                <Box paddingY="1rem" sx={{ borderBottom: `1px solid ${theme.border}` }}>
                  <Flex justifyContent="space-between" alignItems="center">
                    <Text color={theme.subText}>
                      Week {item.week - BASE_WEEK}: {dayjs(date).format('MMM DD')} - {dayjs(end).format('MMM DD')}
                    </Text>
                    {!canClaim ? (
                      <ButtonOutlined width="88px" height="32px" disabled>
                        Claimed
                      </ButtonOutlined>
                    ) : (
                      <ClaimBtn info={item.claimInfo} />
                    )}
                  </Flex>

                  <Flex justifyContent="space-between" alignItems="center" mt="1rem">
                    <Text color={theme.subText} fontSize={12} fontWeight={500}>
                      POINTS EARNED
                    </Text>
                    <Text textAlign="right">{formatDisplayNumber(item.point, { significantDigits: 6 })}</Text>
                  </Flex>

                  <Flex justifyContent="space-between" alignItems="center" mt="0.5rem">
                    <Text color={theme.subText} fontSize={12} fontWeight={500}>
                      ESTIMATED REWARDS
                    </Text>
                    <Flex justifyContent="flex-end" alignItems="flex-end" flexDirection="column">
                      <Text>{totalRw.toSignificant(6)} ARB</Text>
                      <Text color={theme.subText}>
                        {formatDisplayNumber(+totalRw.toExact() * price, { significantDigits: 4, style: 'currency' })}
                      </Text>
                    </Flex>
                  </Flex>
                  <Flex justifyContent="space-between" alignItems="center" mt="0.5rem">
                    <Text color={theme.subText} fontSize={12} fontWeight={500}>
                      CLAIMABLE REWARDS
                    </Text>
                    <Flex justifyContent="flex-end" alignItems="flex-end" flexDirection="column">
                      <Text>{claimableRw.toSignificant(6)} ARB</Text>
                      <Text color={theme.subText}>
                        {formatDisplayNumber(+claimableRw.toExact() * price, {
                          significantDigits: 4,
                          style: 'currency',
                        })}
                      </Text>
                    </Flex>
                  </Flex>
                </Box>
              )

            return (
              <TableRow key={`${item.year}-${item.week}`}>
                <Text color={theme.subText}>
                  Week {item.week - BASE_WEEK}: {dayjs(date).format('MMM DD')} - {dayjs(end).format('MMM DD')}
                </Text>
                <Text textAlign="right">{formatDisplayNumber(item.point, { significantDigits: 6 })}</Text>
                <Flex justifyContent="flex-end" alignItems="flex-end" flexDirection="column">
                  <Text>{totalRw.toSignificant(6)} ARB</Text>
                  <Text color={theme.subText}>
                    {formatDisplayNumber(+totalRw.toExact() * price, { significantDigits: 4, style: 'currency' })}
                  </Text>
                </Flex>

                <Flex justifyContent="flex-end" alignItems="flex-end" flexDirection="column">
                  <Text>{claimableRw.toSignificant(6)} ARB</Text>
                  <Text color={theme.subText}>
                    {formatDisplayNumber(+claimableRw.toExact() * price, { significantDigits: 4, style: 'currency' })}
                  </Text>
                </Flex>

                <Flex justifyContent="flex-end">
                  {!canClaim ? (
                    <ButtonOutlined width="88px" height="32px" disabled>
                      Claimed
                    </ButtonOutlined>
                  ) : (
                    <ClaimBtn info={item.claimInfo} />
                  )}
                </Flex>
              </TableRow>
            )
          })}
        </Box>
      )}
    </Wrapper>
  )
}

export default MyDashboard

const ClaimBtn = ({ info }: { info: { ref: string; clientCode: string } }) => {
  const theme = useTheme()
  const { account, chainId } = useActiveWeb3React()
  const [claiming, setIsClaiming] = useState(false)
  const notify = useNotify()
  const { library } = useWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const [autoClaim, setAutoClaim] = useState(false)

  const addTransactionWithType = useTransactionAdder()

  const handleClaim = useCallback(() => {
    if (!account) return
    if (chainId !== ChainId.ARBITRUM) {
      changeNetwork(ChainId.ARBITRUM)
      setAutoClaim(true)
      return
    }
    setIsClaiming(true)
    fetch(`${REWARD_SERVICE_API}/rewards/claim`, {
      method: 'POST',
      body: JSON.stringify({
        wallet: account,
        chainId: '42161',
        clientCode: info.clientCode,
        ref: info.ref,
      }),
    })
      .then(res => res.json())
      .then(res => {
        if (!res?.data?.EncodedData) {
          setIsClaiming(false)
          notify(
            {
              title: 'Claim failed',
              summary: res?.message || 'Something went wrong',
              type: NotificationType.ERROR,
            },
            5000,
          )
          return
        }

        library
          ?.getSigner()
          .estimateGas({
            to: res.data.ContractAddress,
            data: res.data.EncodedData,
          })
          .then(async (estimate: BigNumber) => {
            const sendTxRes = await library.getSigner().sendTransaction({
              to: res.data.ContractAddress,
              data: res.data.EncodedData,
              gasLimit: calculateGasMargin(estimate),
            })

            addTransactionWithType({
              hash: sendTxRes.hash,
              type: TRANSACTION_TYPE.CLAIM,
            })
          })
          .catch(e => {
            notify(
              {
                title: 'Claim failed',
                summary: e?.message || 'Something went wrong',
                type: NotificationType.ERROR,
              },
              5000,
            )
          })
          .finally(() => {
            setIsClaiming(false)
          })
      })
  }, [chainId, library, changeNetwork, addTransactionWithType, info.ref, info.clientCode, notify, account])

  useEffect(() => {
    if (autoClaim && chainId === ChainId.ARBITRUM) {
      handleClaim()
      setAutoClaim(false)
    }
  }, [chainId, autoClaim, handleClaim])

  return (
    <ButtonOutlined color={theme.primary} width="88px" height="32px" onClick={handleClaim} disabled={claiming}>
      {claiming ? 'Claiming' : 'Claim'}
    </ButtonOutlined>
  )
}
