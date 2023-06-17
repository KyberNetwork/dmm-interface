import { createApi } from '@reduxjs/toolkit/query/react'
import baseQueryOauth from 'services/baseQueryOauth'

import { BFF_API } from 'constants/env'
import { Topic } from 'hooks/useNotification'
import { UserProfile } from 'state/authen/reducer'

const url = ENV_LEVEL === ENV_TYPE.LOCAL ? '/v1/profile/me' : '/v1/profiles'
const identityApi = createApi({
  reducerPath: 'identityApi',
  baseQuery: baseQueryOauth({ baseUrl: BFF_API }),
  endpoints: builder => ({
    getOrCreateProfile: builder.mutation<UserProfile, void>({
      query: () => ({
        url: '/v1/profile/me',
        method: 'POST',
      }),
      transformResponse: (data: any) => data?.data?.profile,
    }),
    connectWalletToProfile: builder.mutation<any, { walletAddress: string }>({
      query: body => ({
        url: '/v1/profile/me/connected-wallets',
        body,
        method: 'POST',
      }),
    }),
    sendOtp: builder.mutation<any, { email: string }>({
      query: body => ({
        url: '/v1/profile/me/link-email',
        body,
        method: 'PUT',
      }),
    }),
    verifyOtp: builder.mutation<any, { code: string; email: string }>({
      query: body => ({
        url: '/v1/profile/me/confirm-email',
        body,
        method: 'PUT',
      }),
    }),
    updateProfile: builder.mutation<any, { nickname?: string; avatarURL?: string }>({
      query: body => ({
        url: `/v1/profile/me`,
        body,
        method: 'PATCH',
      }),
    }),
    getSubscriptionTopics: builder.query<{ topicGroups: Topic[] }, void>({
      query: () => ({
        url: '/v1/profile/me/notification-subscriptions',
      }),
      transformResponse: (data: any) => data?.data,
    }),
    subscribeTopics: builder.mutation<any, { topicIds: number[] }>({
      query: body => ({
        url: '/v1/profile/me/notification-subscriptions',
        body,
        method: 'PUT',
      }),
    }),
    createWatchWallet: builder.mutation<any, { walletAddress: string }>({
      query: body => ({
        url: '/v1/profile/me/watched-wallets',
        body,
        method: 'POST',
      }),
    }),
  }),
})

export const {
  useConnectWalletToProfileMutation,
  useGetOrCreateProfileMutation,
  useSendOtpMutation,
  useVerifyOtpMutation,
  useGetSubscriptionTopicsQuery,
  useSubscribeTopicsMutation,
  useUpdateProfileMutation,
  useCreateWatchWalletMutation,
} = identityApi

export default identityApi
