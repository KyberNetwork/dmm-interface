/* eslint-disable prettier/prettier */
// Ordering is intentional and must be preserved: styling, polyfilling, tracing, and then functionality.
import * as Sentry from '@sentry/react'
import '@zkmelabs/widget/dist/style.css'
import AOS from 'aos'
import 'aos/dist/aos.css'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import 'inter-ui'
import mixpanel from 'mixpanel-browser'
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import TagManager from 'react-gtm-module'
import 'react-loading-skeleton/dist/skeleton.css'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import 'swiper/swiper-bundle.min.css'
import 'swiper/swiper.min.css'

import Web3Provider from 'components/Web3Provider'
import { ENV_LEVEL, GTM_ID, MIXPANEL_PROJECT_TOKEN, SENTRY_DNS, TAG } from 'constants/env'
import { ENV_TYPE } from 'constants/type'
import { useAffiliate } from 'hooks/useAffiliate'
import AuthProvider from 'hooks/useAuth'

import { sentryRequestId } from './constants'
import { LanguageProvider } from './i18n'
import App from './pages/App'
import * as serviceWorkerRegistration from './serviceWorkerRegistration'
import store from './state'
import ApplicationUpdater from './state/application/updater'
import CustomizeDexesUpdater from './state/customizeDexes/updater'
import ListsUpdater from './state/lists/updater'
import MulticallUpdater from './state/multicall/updater'
import TransactionUpdater from './state/transactions/updater'
import UserUpdater from './state/user/updater'
import ThemeProvider, { FixedGlobalStyle, ThemedGlobalStyle } from './theme'

dayjs.extend(utc)
dayjs.extend(duration)
dayjs.extend(relativeTime)

mixpanel.init(MIXPANEL_PROJECT_TOKEN, {
  debug: ENV_LEVEL < ENV_TYPE.PROD,
})

if (ENV_LEVEL > ENV_TYPE.LOCAL) {
  Sentry.init({
    dsn: SENTRY_DNS,
    environment: 'production',
    ignoreErrors: ['AbortError'],
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: 1.0,
    normalizeDepth: 5,
    replaysSessionSampleRate: 1.0,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event, hint) {
      const error = hint?.originalException as Error
      const { name, message } = error
      if (
        (name === 'TypeError' && message === 'Load failed') || // Almost come from mobile safari fetch API issues
        (name === 'ChunkLoadError' && message.includes('Failed to fetch')) || // https://sentry.io/answers/chunk-load-errors-javascript/
        (name === 'Error' && message.includes('Java object is gone')) || // coming from the WebView to Java bridge in Chrome, something went wrong with Chrome Mobile WebView from some Android devices
        (name === 'UnhandledRejection' && message.includes('Non-Error promise rejection captured with value')) ||
        (name === '<unknown>' && message.includes('Non-Error promise rejection captured with value')) || // this always happens when a some external library throws an error, checked with all issues in Sentry logs
        (name === '<unknown>' && message.includes('Object captured as promise rejection with keys')) // this always happens when a some external library throws an error, checked with all issues in Sentry logs
      )
        return null

      if (name === 'TypeError' && message.includes('Failed to fetch')) {
        event.level = 'warning'
      }

      return event
    },
  })
  Sentry.setTag('request_id', sentryRequestId)
  Sentry.setTag('version', TAG)

  if (GTM_ID) {
    TagManager.initialize({
      gtmId: GTM_ID,
    })
  }
}

AOS.init()

if (window.ethereum) {
  window.ethereum.autoRefreshOnNetworkChange = false
}

function Updaters() {
  useAffiliate()

  return (
    <>
      <ListsUpdater />
      <UserUpdater />
      <ApplicationUpdater />
      <TransactionUpdater />
      <MulticallUpdater />
      <CustomizeDexesUpdater />
    </>
  )
}

const preloadhtml = document.querySelector('.preloadhtml')
const preloadhtmlStyle = document.querySelector('.preloadhtml-style')

const hideLoader = () => {
  setTimeout(() => {
    preloadhtml?.remove()
    preloadhtmlStyle?.remove()
  }, 100)
}

const ReactApp = () => {
  useEffect(hideLoader, [])
  return (
    <StrictMode>
      <FixedGlobalStyle />
      <Provider store={store}>
        <BrowserRouter>
          <LanguageProvider>
            <Web3Provider>
              <AuthProvider>
                <Updaters />
                <ThemeProvider>
                  <ThemedGlobalStyle />
                  <App />
                </ThemeProvider>
              </AuthProvider>
            </Web3Provider>
          </LanguageProvider>
        </BrowserRouter>
      </Provider>
    </StrictMode>
  )
}

const container = document.getElementById('app') as HTMLElement
const root = createRoot(container)
root.render(<ReactApp />)

serviceWorkerRegistration.unregister()
//serviceWorkerRegistration.register({
//  onSuccess: () => {
//    //
//  },
//  onUpdate: serviceWorkerRegistration => {
//    store.dispatch(updateServiceWorker(serviceWorkerRegistration))
//  },
//})
