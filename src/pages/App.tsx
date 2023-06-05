import { datadogRum } from '@datadog/browser-rum'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import * as Sentry from '@sentry/react'
import { Suspense, lazy, useEffect } from 'react'
import { isMobile } from 'react-device-detect'
import { AlertTriangle } from 'react-feather'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useNetwork, usePrevious } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import snow from 'assets/images/snow.png'
import Popups from 'components/Announcement/Popups'
import TopBanner from 'components/Announcement/Popups/TopBanner'
import AppHaveUpdate from 'components/AppHaveUpdate'
import ModalConfirm from 'components/ConfirmModal'
import ErrorBoundary from 'components/ErrorBoundary'
import Footer from 'components/Footer/Footer'
import Header from 'components/Header'
import Loader from 'components/LocalLoader'
import Modal from 'components/Modal'
import { ProtectedRouteKyberAI } from 'components/ProtectedRoute'
import Snowfall from 'components/Snowflake/Snowfall'
import Web3ReactManager from 'components/Web3ReactManager'
import { ENV_LEVEL } from 'constants/env'
import { APP_PATHS, BLACKLIST_WALLETS } from 'constants/index'
import { NETWORKS_INFO_CONFIG } from 'constants/networks'
import { ENV_TYPE } from 'constants/type'
import { useActiveWeb3React } from 'hooks'
import useLogin from 'hooks/useLogin'
import { useGlobalMixpanelEvents } from 'hooks/useMixpanel'
import useSessionExpiredGlobal from 'hooks/useSessionExpire'
import { useSyncNetworkParamWithStore } from 'hooks/useSyncNetworkParamWithStore'
import useTheme from 'hooks/useTheme'
import { useHolidayMode } from 'state/user/hooks'
import DarkModeQueryParamReader from 'theme/DarkModeQueryParamReader'
import { getLimitOrderContract, isAddressString, shortenAddress } from 'utils'

import { RedirectDuplicateTokenIds } from './AddLiquidityV2/redirects'
import { RedirectPathToFarmNetwork } from './Farm/redirect'
import Icons from './Icons'
import { RedirectPathToMyPoolsNetwork } from './Pool/redirect'
import { RedirectPathToPoolsNetwork } from './Pools/redirect'
import { RedirectPathToSwapV3Network } from './SwapV3/redirects'
import KyberAIExplore from './TrueSightV2'
import TruesightFooter from './TrueSightV2/components/TruesightFooter'
import KyberAILandingPage from './TrueSightV2/pages/LandingPage'
import Verify from './Verify'

// test page for swap only through elastic
const ElasticSwap = lazy(() => import('./ElasticSwap'))
const ElasticLegacy = lazy(() => import('./ElasticLegacy'))
const SwapV2 = lazy(() => import('./SwapV2'))
const SwapV3 = lazy(() => import('./SwapV3'))
// const Bridge = lazy(() => import('./Bridge'))
const Pools = lazy(() => import('./Pools'))
const Pool = lazy(() => import('./Pool'))

const Farm = lazy(() => import('./Farm'))

const PoolFinder = lazy(() => import('./PoolFinder'))
const CreatePool = lazy(() => import('./CreatePool'))
const ProAmmRemoveLiquidity = lazy(() => import('./RemoveLiquidityProAmm'))
const RedirectCreatePoolDuplicateTokenIds = lazy(() => import('./CreatePool/RedirectDuplicateTokenIds'))
const RedirectOldCreatePoolPathStructure = lazy(() => import('./CreatePool/RedirectOldCreatePoolPathStructure'))

const AddLiquidity = lazy(() => import('./AddLiquidity'))
const IncreaseLiquidity = lazy(() => import('./IncreaseLiquidity'))

const RemoveLiquidity = lazy(() => import('./RemoveLiquidity'))

const KyberDAOStakeKNC = lazy(() => import('./KyberDAO/StakeKNC'))
const KyberDAOVote = lazy(() => import('./KyberDAO/Vote'))
const AboutKyberSwap = lazy(() => import('./About/AboutKyberSwap'))
const AboutKNC = lazy(() => import('./About/AboutKNC'))

const BuyCrypto = lazy(() => import('./BuyCrypto'))

const Campaign = lazy(() => import('./Campaign'))
const GrantProgramPage = lazy(() => import('./GrantProgram'))
const NotificationCenter = lazy(() => import('./NotificationCenter'))

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
`

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
  z-index: 3;
`

const BodyWrapper = styled.div`
  display: flex;
  position: relative;
  flex-direction: column;
  width: 100%;
  align-items: center;
  min-height: calc(100vh - 148px);
  flex: 1;
  z-index: 1;
`

const preloadImages = () => {
  const imageList: (string | null)[] = [
    ...Object.values(NETWORKS_INFO_CONFIG).map(network => network.icon),
    ...Object.values(NETWORKS_INFO_CONFIG)
      .map(network => network.iconDark)
      .filter(Boolean),
  ]
  imageList.forEach(image => {
    if (image) {
      new Image().src = image
    }
  })
}

const SwapPage = () => {
  const { chainId } = useActiveWeb3React()
  useSyncNetworkParamWithStore()

  return <>{chainId === ChainId.SOLANA ? <SwapV2 /> : <SwapV3 />}</>
}

export default function App() {
  const { account, chainId, networkInfo } = useActiveWeb3React()
  const { pathname } = useLocation()

  useLogin()
  const { online } = useNetwork()
  const prevOnline = usePrevious(online)

  useSessionExpiredGlobal()

  useEffect(() => {
    if (prevOnline === false && online && account) {
      // refresh page when network back to normal to prevent some issues: ex: stale data, ...
      window.location.reload()
    }
  }, [online, prevOnline, account])

  useEffect(() => {
    preloadImages()
  }, [])

  useEffect(() => {
    if (account) {
      Sentry.setUser({ id: account })
      datadogRum.setUser({ id: account })
    }
  }, [account])

  useEffect(() => {
    if (chainId) {
      Sentry.setTags({
        chainId: chainId,
        network: networkInfo.name,
      })
      datadogRum.setGlobalContext({
        chainId,
        networkName: networkInfo.name,
      })
    }
  }, [chainId, networkInfo.name])

  const theme = useTheme()

  useGlobalMixpanelEvents()

  const showFooter = !pathname.includes(APP_PATHS.ABOUT)
  const [holidayMode] = useHolidayMode()

  const snowflake = new Image()
  snowflake.src = snow

  return (
    <ErrorBoundary>
      <AppHaveUpdate />
      {(BLACKLIST_WALLETS.includes(isAddressString(chainId, account)) ||
        BLACKLIST_WALLETS.includes(account?.toLowerCase() || '')) && (
        <Modal
          isOpen
          onDismiss={function (): void {
            //
          }}
          maxWidth="600px"
          width="80vw"
        >
          <Flex flexDirection="column" padding="24px" width="100%">
            <Flex alignItems="center">
              <AlertTriangle color={theme.red} />
              <Text fontWeight="500" fontSize={24} color={theme.red} marginLeft="8px">
                <Trans>Warning</Trans>
              </Text>
            </Flex>
            <Text marginTop="24px" fontSize="14px" lineHeight={2}>
              The US Treasury&apos;s OFAC has published a list of addresses associated with Tornado Cash. Your wallet
              address below is flagged as one of the addresses on this list, provided by our compliance vendor. As a
              result, it is blocked from using KyberSwap and all of its related services at this juncture.
            </Text>
            <Flex
              marginTop="24px"
              padding="12px"
              backgroundColor={theme.buttonBlack}
              sx={{ borderRadius: '12px' }}
              flexDirection="column"
            >
              <Text>Your wallet address</Text>
              <Text color={theme.subText} fontSize={20} marginTop="12px" fontWeight="500">
                {isMobile ? shortenAddress(chainId, account || '', 10) : account}
              </Text>
            </Flex>
          </Flex>
        </Modal>
      )}

      {(!account || !BLACKLIST_WALLETS.includes(account)) && (
        <>
          <AppWrapper>
            <TopBanner />
            <HeaderWrapper>
              <Header />
            </HeaderWrapper>
            <Suspense fallback={<Loader />}>
              {holidayMode && (
                <Snowfall
                  speed={[0.5, 1]}
                  wind={[-0.5, 0.25]}
                  snowflakeCount={isMobile ? 13 : 31}
                  images={[snowflake]}
                  radius={[5, 15]}
                />
              )}

              <BodyWrapper>
                <Popups />
                <Web3ReactManager>
                  <Routes>
                    <Route element={<DarkModeQueryParamReader />} />

                    <Route path={`${APP_PATHS.SWAP}/:network/:fromCurrency-to-:toCurrency`} element={<SwapPage />} />
                    <Route path={`${APP_PATHS.SWAP}/:network/:fromCurrency`} element={<SwapPage />} />
                    <Route path={`${APP_PATHS.SWAP}/:network`} element={<SwapPage />} />

                    {getLimitOrderContract(chainId) && (
                      <>
                        <Route
                          path={`${APP_PATHS.LIMIT}/:network/:fromCurrency-to-:toCurrency`}
                          element={<SwapPage />}
                        />
                        <Route path={`${APP_PATHS.LIMIT}/:network/:fromCurrency`} element={<SwapPage />} />
                        <Route path={`${APP_PATHS.LIMIT}/:network`} element={<SwapPage />} />
                      </>
                    )}

                    <Route path={`${APP_PATHS.FIND_POOL}`} element={<PoolFinder />} />
                    <Route path={`${APP_PATHS.POOLS}/:network`} element={<Pools />} />
                    <Route path={`${APP_PATHS.POOLS}/:network/:currencyIdA`} element={<Pools />} />
                    <Route path={`${APP_PATHS.POOLS}`} element={<RedirectPathToPoolsNetwork />} />
                    <Route path={`${APP_PATHS.POOLS}/:network/:currencyIdA/:currencyIdB`} element={<Pools />} />
                    <Route path={`${APP_PATHS.FARMS}/:network`} element={<Farm />} />
                    <Route path={`${APP_PATHS.FARMS}`} element={<RedirectPathToFarmNetwork />} />
                    <Route path={`${APP_PATHS.MY_POOLS}/:network`} element={<Pool />} />
                    <Route path={`${APP_PATHS.MY_POOLS}`} element={<RedirectPathToMyPoolsNetwork />} />

                    <Route path={`${APP_PATHS.CLASSIC_CREATE_POOL}`} element={<CreatePool />} />
                    <Route
                      path={`${APP_PATHS.CLASSIC_CREATE_POOL}/:currencyIdA`}
                      element={<RedirectOldCreatePoolPathStructure />}
                    />
                    <Route
                      path={`${APP_PATHS.CLASSIC_CREATE_POOL}/:currencyIdA/:currencyIdB`}
                      element={<RedirectCreatePoolDuplicateTokenIds />}
                    />

                    <Route path={`${APP_PATHS.CLASSIC_ADD_LIQ}/:currencyIdA/`} element={<AddLiquidity />} />
                    <Route path={`${APP_PATHS.CLASSIC_ADD_LIQ}/:currencyIdA/:currencyIdB`} element={<AddLiquidity />} />
                    <Route
                      path={`${APP_PATHS.CLASSIC_ADD_LIQ}/:currencyIdA/:currencyIdB/:pairAddress`}
                      element={<AddLiquidity />}
                    />

                    <Route
                      path={`${APP_PATHS.CLASSIC_REMOVE_POOL}/:currencyIdA/:currencyIdB/:pairAddress`}
                      element={<RemoveLiquidity />}
                    />
                    <Route path={`${APP_PATHS.ELASTIC_REMOVE_POOL}/:tokenId`} element={<ProAmmRemoveLiquidity />} />

                    <Route path={`${APP_PATHS.ELASTIC_CREATE_POOL}/`} element={<RedirectDuplicateTokenIds />} />
                    <Route
                      path={`${APP_PATHS.ELASTIC_CREATE_POOL}/:currencyIdA`}
                      element={<RedirectDuplicateTokenIds />}
                    />
                    <Route
                      path={`${APP_PATHS.ELASTIC_CREATE_POOL}/:currencyIdA/:currencyIdB`}
                      element={<RedirectDuplicateTokenIds />}
                    />
                    <Route
                      path={`${APP_PATHS.ELASTIC_CREATE_POOL}/:currencyIdA/:currencyIdB/:feeAmount`}
                      element={<RedirectDuplicateTokenIds />}
                    />

                    <Route
                      path={`${APP_PATHS.ELASTIC_INCREASE_LIQ}/:currencyIdA/:currencyIdB/:feeAmount/:tokenId`}
                      element={<IncreaseLiquidity />}
                    />
                    <Route path={`${APP_PATHS.KYBERDAO_STAKE}`} element={<KyberDAOStakeKNC />} />
                    <Route path={`${APP_PATHS.KYBERDAO_VOTE}`} element={<KyberDAOVote />} />
                    <Route path={`${APP_PATHS.ABOUT}/kyberswap`} element={<AboutKyberSwap />} />
                    <Route path={`${APP_PATHS.ABOUT}/knc`} element={<AboutKNC />} />
                    <Route path={`${APP_PATHS.KYBERAI}`} element={<Navigate to={APP_PATHS.KYBERAI_ABOUT} replace />} />
                    <Route
                      path={`${APP_PATHS.KYBERAI_ABOUT}`}
                      element={
                        <ProtectedRouteKyberAI waitUtilAuthenEndOnly>
                          <KyberAILandingPage />
                        </ProtectedRouteKyberAI>
                      }
                    />
                    <Route
                      path={`${APP_PATHS.KYBERAI_RANKINGS}`}
                      element={
                        <ProtectedRouteKyberAI redirectUrl={APP_PATHS.KYBERAI_ABOUT}>
                          <KyberAIExplore />
                        </ProtectedRouteKyberAI>
                      }
                    />
                    <Route
                      path={`${APP_PATHS.KYBERAI_EXPLORE}`}
                      element={
                        <ProtectedRouteKyberAI redirectUrl={APP_PATHS.KYBERAI_ABOUT}>
                          <KyberAIExplore />
                        </ProtectedRouteKyberAI>
                      }
                    />
                    <Route
                      path={`${APP_PATHS.KYBERAI_EXPLORE}/:chain/:address`}
                      element={
                        <ProtectedRouteKyberAI redirectUrl={APP_PATHS.KYBERAI_ABOUT}>
                          <KyberAIExplore />
                        </ProtectedRouteKyberAI>
                      }
                    />
                    <Route path={`${APP_PATHS.BUY_CRYPTO}`} element={<BuyCrypto />} />
                    <Route path={`${APP_PATHS.CAMPAIGN}`} element={<Campaign />} />
                    <Route path={`${APP_PATHS.CAMPAIGN}/:slug`} element={<Campaign />} />
                    {/*<Route path={`${APP_PATHS.BRIDGE}`} element={<Bridge />} />*/}
                    <Route path={`${APP_PATHS.VERIFY_EXTERNAL}`} element={<Verify />} />
                    <Route path={`${APP_PATHS.NOTIFICATION_CENTER}`} element={<NotificationCenter />} />
                    <Route path={`${APP_PATHS.NOTIFICATION_CENTER}/*`} element={<NotificationCenter />} />
                    <Route path={`${APP_PATHS.GRANT_PROGRAMS}`} element={<GrantProgramPage />} />
                    <Route path={`${APP_PATHS.GRANT_PROGRAMS}/:slug`} element={<GrantProgramPage />} />
                    {ENV_LEVEL === ENV_TYPE.LOCAL && <Route path="/icons" element={<Icons />} />}

                    <Route path={`${APP_PATHS.ELASTIC_LEGACY}`} element={<ElasticLegacy />} />
                    <Route path={`elastic-swap`} element={<ElasticSwap />} />

                    <Route path="*" element={<RedirectPathToSwapV3Network />} />
                  </Routes>
                </Web3ReactManager>
              </BodyWrapper>
              {showFooter && <Footer />}
              <TruesightFooter />
            </Suspense>
            <ModalConfirm />
          </AppWrapper>
        </>
      )}
    </ErrorBoundary>
  )
}
