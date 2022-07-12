import React, { useState, useMemo } from 'react'
import { Trans } from '@lingui/macro'

import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { useFarmsData } from 'state/farms/hooks'
import { useFarmHistoryModalToggle, useBlockNumber } from 'state/application/hooks'
import Loader from 'components/Loader'
import {
  TopBar,
  TabContainer,
  TabWrapper,
  Tab,
  PoolTitleContainer,
  UpcomingPoolsWrapper,
  NewText,
  Divider,
  PageWrapper,
} from 'components/YieldPools/styleds'
import Vesting from 'components/Vesting'
import FarmHistoryModal from 'components/FarmHistoryModal'
import { useSelector } from 'react-redux'
import { AppState } from 'state'
import YieldPools from 'components/YieldPools'
import RewardTokenPrices from 'components/RewardTokenPrices'
import { Text, Flex } from 'rebass'
import UpcomingFarms from 'components/UpcomingFarms'
import History from 'components/Icons/History'
import { UPCOMING_POOLS } from 'constants/upcoming-pools'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useHistory } from 'react-router-dom'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { stringify } from 'qs'
import { ButtonPrimary } from 'components/Button'
import ProMMFarms from 'components/YieldPools/ProMMFarms'
import ProMMVesting from 'components/Vesting/ProMMVesting'
import { Token } from '@kyberswap/ks-sdk-core'
import { HelpCircle } from 'react-feather'
import ElasticTutorialFarmModal from 'components/ElasticTutorialFarmModal'
import { useMedia } from 'react-use'
import { useProMMFarms } from 'state/farms/promm/hooks'
import { useTokens } from 'hooks/Tokens'
import { VERSION } from 'constants/v2'
import ClassicElasticTab from 'components/ClassicElasticTab'
import FarmGuide from 'components/YieldPools/FarmGuide'

const Farms = () => {
  const { loading, data: farms } = useFarmsData()
  const qs = useParsedQueryString()
  const type = qs.type || 'active'
  const farmType = qs.tab || VERSION.ELASTIC
  const history = useHistory()

  const toggleFarmHistoryModal = useFarmHistoryModalToggle()
  const vestingLoading = useSelector<AppState, boolean>(state => state.vesting.loading)

  const renderTabContent = () => {
    switch (type) {
      case 'active':
        return farmType === VERSION.ELASTIC ? <ProMMFarms active /> : <YieldPools loading={loading} active />
      case 'coming':
        return <UpcomingFarms />
      case 'ended':
        return farmType === VERSION.ELASTIC ? (
          <ProMMFarms active={false} />
        ) : (
          <YieldPools loading={loading} active={false} />
        )
      case 'vesting':
        // TODO: merge 2 vesting pages
        return farmType === VERSION.ELASTIC ? <ProMMVesting /> : <Vesting loading={vestingLoading} />
      default:
        return <YieldPools loading={loading} active />
    }
  }
  const { mixpanelHandler } = useMixpanel()

  // Total rewards for Classic pool
  const { data: farmsByFairLaunch } = useFarmsData()

  const [showModalTutorial, setShowModalTutorial] = useState(false)

  const below768 = useMedia('(max-width: 768px)')
  const below1500 = useMedia('(max-width: 1500px)')

  const blockNumber = useBlockNumber()

  const { data: prommFarms } = useProMMFarms()

  const prommRewardTokenAddress = useMemo(() => {
    return [
      ...new Set(
        Object.values(prommFarms).reduce((acc, cur) => {
          return [...acc, ...cur.map(item => item.rewardTokens).flat()]
        }, [] as string[]),
      ),
    ]
  }, [prommFarms])

  const prommTokenMap = useTokens(prommRewardTokenAddress)

  const rewardTokens = useMemo(() => {
    let tokenMap: { [address: string]: Token } = {}
    const currentTimestamp = Math.floor(Date.now() / 1000)
    Object.values(farmsByFairLaunch)
      .flat()
      .filter(
        item =>
          (item.endTime && item.endTime > currentTimestamp) ||
          (blockNumber && item.endBlock && item.endBlock > blockNumber),
      )
      .forEach(current => {
        current.rewardTokens.forEach(token => {
          if (!tokenMap[token.wrapped.address]) tokenMap[token.wrapped.address] = token
        })
      })

    Object.values(prommTokenMap).forEach(item => {
      if (!tokenMap[item.wrapped.address]) tokenMap[item.wrapped.address] = item
    })

    return Object.values(tokenMap)
  }, [farmsByFairLaunch, blockNumber, prommTokenMap])

  return (
    <>
      <ElasticTutorialFarmModal isOpen={showModalTutorial} onDismiss={() => setShowModalTutorial(false)} />
      <PageWrapper gap="24px">
        <TopBar>
          <ClassicElasticTab />

          <Flex
            flex={1}
            width={below768 ? 'calc(100vw - 32px)' : below1500 ? 'calc(100vw - 412px)' : '1088px'}
            sx={{ gap: '4px' }}
            alignItems="center"
            justifyContent="space-between"
          >
            <RewardTokenPrices
              rewardTokens={rewardTokens}
              style={{ display: 'flex', width: '100%', overflow: 'hidden', flex: 1 }}
            />
            {below768 && (
              <>
                {farmType === VERSION.CLASSIC && (
                  <ButtonPrimary
                    width="max-content"
                    onClick={toggleFarmHistoryModal}
                    padding="10px 12px"
                    style={{ gap: '4px', fontSize: '14px' }}
                  >
                    <History />
                    <Trans>History</Trans>
                  </ButtonPrimary>
                )}

                {farmType === VERSION.ELASTIC && (
                  <ButtonPrimary
                    width="max-content"
                    onClick={() => setShowModalTutorial(true)}
                    padding="10px 12px"
                    style={{ gap: '4px', fontSize: '14px' }}
                  >
                    <HelpCircle size={16} />
                    <Trans>Tutorial</Trans>
                  </ButtonPrimary>
                )}
              </>
            )}
          </Flex>
        </TopBar>

        <FarmGuide farmType={farmType as VERSION} />

        <div>
          <TabContainer>
            <TabWrapper>
              <Tab
                onClick={() => {
                  if (type && type !== 'active') {
                    mixpanelHandler(MIXPANEL_TYPE.FARMS_ACTIVE_VIEWED)
                  }
                  const newQs = { ...qs, type: 'active' }
                  history.push({
                    search: stringify(newQs),
                  })
                }}
                isActive={!type || type === 'active'}
              >
                <PoolTitleContainer>
                  <span>
                    <Trans>Active</Trans>
                  </span>
                </PoolTitleContainer>
              </Tab>
              <Tab
                onClick={() => {
                  if (type !== 'ended') {
                    mixpanelHandler(MIXPANEL_TYPE.FARMS_ENDING_VIEWED)
                  }
                  const newQs = { ...qs, type: 'ended' }
                  history.push({
                    search: stringify(newQs),
                  })
                }}
                isActive={type === 'ended'}
              >
                <PoolTitleContainer>
                  <span>
                    <Trans>Ended</Trans>
                  </span>
                </PoolTitleContainer>
              </Tab>

              <Tab
                onClick={() => {
                  if (type !== 'coming') {
                    mixpanelHandler(MIXPANEL_TYPE.FARMS_UPCOMING_VIEWED)
                  }
                  const newQs = { ...qs, type: 'coming' }
                  history.push({
                    search: stringify(newQs),
                  })
                }}
                isActive={type === 'coming'}
              >
                <UpcomingPoolsWrapper>
                  <Trans>Upcoming</Trans>
                  {UPCOMING_POOLS.length > 0 && (
                    <NewText>
                      <Trans>New</Trans>
                    </NewText>
                  )}
                </UpcomingPoolsWrapper>
              </Tab>

              <Divider />

              <Tab
                onClick={() => {
                  if (type !== 'vesting') {
                    mixpanelHandler(MIXPANEL_TYPE.FARMS_MYVESTING_VIEWED)
                  }
                  const newQs = { ...qs, type: 'vesting' }
                  history.push({
                    search: stringify(newQs),
                  })
                }}
                isActive={type === 'vesting'}
              >
                <PoolTitleContainer>
                  <Text>
                    <Trans>My Vesting</Trans>
                  </Text>
                  {vestingLoading && <Loader style={{ marginLeft: '4px' }} />}
                </PoolTitleContainer>
              </Tab>
            </TabWrapper>

            {!below768 && farmType === VERSION.CLASSIC && (
              <ButtonPrimary
                width="max-content"
                onClick={toggleFarmHistoryModal}
                padding="10px 12px"
                style={{ gap: '4px', fontSize: '14px' }}
              >
                <History />
                <Trans>History</Trans>
              </ButtonPrimary>
            )}

            {!below768 && farmType === VERSION.ELASTIC && (
              <ButtonPrimary
                width="max-content"
                onClick={() => setShowModalTutorial(true)}
                padding="10px 12px"
                style={{ gap: '4px', fontSize: '14px' }}
              >
                <HelpCircle size={16} />
                <Trans>Tutorial</Trans>
              </ButtonPrimary>
            )}
          </TabContainer>

          {renderTabContent()}
        </div>
      </PageWrapper>
      <FarmHistoryModal farms={Object.values(farms).flat()} />
      <SwitchLocaleLink />
    </>
  )
}

export default Farms
