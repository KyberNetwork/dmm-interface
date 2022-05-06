import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import {
  HeadingContainer,
  StakedOnlyToggle,
  StakedOnlyToggleWrapper,
  StakedOnlyToggleText,
  HeadingRight,
  SearchInput,
  SearchContainer,
  ProMMFarmTableHeader,
  ClickableText,
} from './styleds'
import { Trans, t } from '@lingui/macro'
import { Search, Info } from 'react-feather'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useHistory, useLocation } from 'react-router-dom'
import { stringify } from 'querystring'
import useTheme from 'hooks/useTheme'
import { useMedia } from 'react-use'
import InfoHelper from 'components/InfoHelper'
import { Flex, Text } from 'rebass'
import { useProMMFarms, useGetProMMFarms } from 'state/farms/promm/hooks'
import LocalLoader from 'components/LocalLoader'
import ProMMFarmGroup from './ProMMFarmGroup'
import { DepositModal, StakeUnstakeModal } from './ProMMFarmModals'
import { useBlockNumber } from 'state/application/hooks'
import WithdrawModal from './ProMMFarmModals/WithdrawModal'
import HarvestModal from './ProMMFarmModals/HarvestModal'
import { CurrencyAmount, Token } from '@vutien/sdk-core'
import HoverDropdown from 'components/HoverDropdown'
import { ExternalLink } from 'theme'
import { ProMMFarm } from 'state/farms/promm/types'

type ModalType = 'deposit' | 'withdraw' | 'stake' | 'unstake' | 'harvest'

function ProMMFarms({
  active,
  onUpdateUserReward,
}: {
  active: boolean
  onUpdateUserReward: (address: string, usdValue: number, amounts: CurrencyAmount<Token>[]) => void
}) {
  const theme = useTheme()
  const [stakedOnly, setStakedOnly] = useState({
    active: false,
    ended: false,
  })
  const activeTab = active ? 'active' : 'ended'
  const { data: farms, loading } = useProMMFarms()
  const getProMMFarms = useGetProMMFarms()

  const blockNumber = useBlockNumber()

  useEffect(() => {
    getProMMFarms()
  }, [getProMMFarms, blockNumber])

  const ref = useRef<HTMLDivElement>()
  const [open, setOpen] = useState(false)
  useOnClickOutside(ref, open ? () => setOpen(prev => !prev) : undefined)
  const qs = useParsedQueryString()
  const search = ((qs.search as string) || '').toLowerCase()
  const history = useHistory()
  const location = useLocation()

  const above1000 = useMedia('(min-width: 1000px)')

  const handleSearch = useCallback(
    (search: string) => {
      const target = {
        ...location,
        search: stringify({ ...qs, search }),
      }

      history.replace(target)
    },
    [history, location, qs],
  )

  const filteredFarms = useMemo(() => {
    const now = +new Date() / 1000
    return Object.keys(farms).reduce((acc: { [key: string]: ProMMFarm[] }, address) => {
      const currentFarms = farms[address].filter(farm => {
        const filterAcive = active ? farm.endTime >= now : farm.endTime < now
        const filterSearchText = search
          ? farm.token0.toLowerCase().includes(search) ||
            farm.token1.toLowerCase().includes(search) ||
            farm.poolAddress.toLowerCase() === search
          : true

        let filterStaked = true
        if (stakedOnly[activeTab]) {
          filterStaked = farm.userDepositedNFTs.length > 0
        }

        return filterAcive && filterSearchText && filterStaked
      })

      if (currentFarms.length) acc[address] = currentFarms
      return acc
    }, {})
  }, [farms, active, activeTab, search, stakedOnly])

  const noFarms = !Object.keys(filteredFarms).length

  const [selectedFarm, setSeletedFarm] = useState<null | string>(null)
  const [selectedModal, setSeletedModal] = useState<ModalType | null>(null)
  const [selectedPoolId, setSeletedPoolId] = useState<number | null>(null)

  const onDismiss = () => {
    setSeletedFarm(null)
    setSeletedModal(null)
    setSeletedPoolId(null)
  }
  return (
    <>
      {selectedFarm && selectedModal === 'deposit' && (
        <DepositModal selectedFarmAddress={selectedFarm} onDismiss={onDismiss} />
      )}

      {selectedFarm && selectedPoolId !== null && ['stake', 'unstake'].includes(selectedModal || '') && (
        <StakeUnstakeModal
          type={selectedModal as any}
          poolId={selectedPoolId}
          selectedFarmAddress={selectedFarm}
          onDismiss={onDismiss}
        />
      )}

      {selectedFarm && selectedModal === 'withdraw' && (
        <WithdrawModal selectedFarmAddress={selectedFarm} onDismiss={onDismiss} />
      )}

      {selectedFarm && selectedModal === 'harvest' && (
        <HarvestModal farmsAddress={selectedFarm} poolId={selectedPoolId} onDismiss={onDismiss} />
      )}

      <HeadingContainer>
        <StakedOnlyToggleWrapper>
          <StakedOnlyToggle
            className="staked-only-switch"
            checked={stakedOnly[active ? 'active' : 'ended']}
            onClick={() => setStakedOnly(prev => ({ ...prev, [activeTab]: !prev[activeTab] }))}
          />
          <StakedOnlyToggleText>
            <Trans>Staked Only</Trans>
          </StakedOnlyToggleText>
        </StakedOnlyToggleWrapper>
        <HeadingRight>
          <SearchContainer>
            <SearchInput
              placeholder={t`Search by token name or pool address`}
              maxLength={255}
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
            <Search color={theme.subText} />
          </SearchContainer>
        </HeadingRight>
      </HeadingContainer>

      {above1000 && (
        <ProMMFarmTableHeader>
          <Flex grid-area="token_pairs" alignItems="center" justifyContent="flex-start">
            <ClickableText>
              <Trans>Pool</Trans>
            </ClickableText>
          </Flex>

          <Flex grid-area="pool_fee" alignItems="center" justifyContent="flex-start">
            <HoverDropdown
              hideIcon
              padding="8px 0"
              content={
                <ClickableText sx={{ gap: '4px' }}>
                  <Trans>Target volume</Trans>
                  <Info size={12} />
                </ClickableText>
              }
              dropdownContent={
                <Text color={theme.subText} fontSize="12px" maxWidth="400px" lineHeight={1.5}>
                  <Trans>
                    Some farms have a target trading volume (represented by the progress bar) that your liquidity
                    positions need to fully unlock to start earning maximum farming rewards. This target volume ensures
                    that your liquidity positions are supporting the pools trading volume.
                    <br />
                    <br />
                    Based on the progress of your target volume, you will still earn partial farming rewards. But once
                    you fully unlock your target volume, your liquidity position(s) will start earning maximum rewards.
                    Adjusting your liquidity position(s) staked in the farm will recalculate this volume target. <br />
                    <br />
                    Learn more <ExternalLink href="">here.</ExternalLink>
                  </Trans>
                </Text>
              }
            />
          </Flex>

          <Flex grid-area="liq" alignItems="center" justifyContent="flex-center">
            <ClickableText>
              <Trans>Staked TVL</Trans>
            </ClickableText>
          </Flex>

          <Flex grid-area="end" alignItems="center" justifyContent="flex-start">
            <ClickableText>
              <Trans>Ending In</Trans>
            </ClickableText>
            <InfoHelper text={t`Once a farm has ended, you will continue to receive returns through LP Fees`} />
          </Flex>

          <Flex grid-area="apy" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>APR</Trans>
            </ClickableText>
            <InfoHelper
              text={
                active
                  ? t`Total estimated return based on yearly fees and bonus rewards of the pool`
                  : t`Estimated return based on yearly fees of the pool`
              }
            />
          </Flex>

          <Flex grid-area="vesting_duration" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>Vesting</Trans>
            </ClickableText>
            <InfoHelper text={t`After harvesting, your rewards will unlock linearly over the indicated time period`} />
          </Flex>

          <Flex grid-area="staked_balance" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>My Deposit</Trans>
            </ClickableText>
          </Flex>

          <Flex grid-area="reward" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>My Rewards</Trans>
            </ClickableText>
          </Flex>

          <Flex grid-area="action" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>Actions</Trans>
            </ClickableText>
          </Flex>
        </ProMMFarmTableHeader>
      )}

      {loading && noFarms ? (
        <Flex backgroundColor={theme.background}>
          <LocalLoader />
        </Flex>
      ) : noFarms ? (
        <Flex
          backgroundColor={theme.background}
          justifyContent="center"
          padding="32px"
          style={{ borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}
        >
          <Text color={theme.subText}>
            {stakedOnly[activeTab] || search ? (
              <Trans>No Farms found</Trans>
            ) : (
              <Trans>Currently there are no Farms.</Trans>
            )}
          </Text>
        </Flex>
      ) : (
        Object.keys(filteredFarms).map(fairLaunchAddress => {
          return (
            <ProMMFarmGroup
              key={fairLaunchAddress}
              address={fairLaunchAddress}
              onOpenModal={(modalType: ModalType, pid?: number) => {
                setSeletedModal(modalType)
                setSeletedFarm(fairLaunchAddress)
                setSeletedPoolId(pid ?? null)
              }}
              onUpdateUserReward={onUpdateUserReward}
              farms={filteredFarms[fairLaunchAddress]}
            />
          )
        })
      )}
    </>
  )
}

export default ProMMFarms
