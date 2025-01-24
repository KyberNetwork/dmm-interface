import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

import { AFFILIATE_SERVICE_URL } from 'constants/env'
import { useWeb3React } from 'hooks'
import { useWalletModalToggle } from 'state/application/hooks'

import { useAuth } from './useAuth'

export const useAffiliate = () => {
  const [searchParams] = useSearchParams()
  const refCode = searchParams.get('refCode')

  const { account } = useWeb3React()
  const toggleWalletModal = useWalletModalToggle()

  const { accessToken, login } = useAuth()

  const ref = useRef(false)

  useEffect(() => {
    if (!refCode) return

    // connect wallet first
    if (!account) {
      toggleWalletModal()
      return
    }

    if (!accessToken) {
      login()
    } else if (!ref.current) {
      ref.current = true
      fetch(`${AFFILIATE_SERVICE_URL}/v1/public/affiliates/session`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refCode }),
      })
        .then(res => res.json())
        .then(console.log)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refCode, accessToken, account, login])
}
