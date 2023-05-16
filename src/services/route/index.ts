import { createApi } from '@reduxjs/toolkit/query/react'
import baseQueryOauth from 'services/baseQueryOauth'
import { BuildRoutePayload, BuildRouteResponse } from 'services/route/types/buildRoute'

import { GetRouteParams, GetRouteResponse, GetTokenScoreParams, GetTokenScoreResponse } from './types/getRoute'

const routeApi = createApi({
  reducerPath: 'routeApi',
  baseQuery: baseQueryOauth({ baseUrl: '' }),
  endpoints: builder => ({
    getTokenScore: builder.query<
      GetTokenScoreResponse,
      {
        url: string
        params: GetTokenScoreParams
        authentication: boolean
      }
    >({
      query: ({ params, url, authentication }) => ({
        url,
        params,
        authentication,
      }),
      keepUnusedDataFor: 86400,
    }),
    getRoute: builder.query<
      GetRouteResponse,
      {
        url: string
        params: GetRouteParams
        authentication: boolean
      }
    >({
      query: ({ params, url, authentication }) => ({
        url,
        params,
        authentication,
      }),
    }),
    buildRoute: builder.mutation<
      BuildRouteResponse,
      { url: string; payload: BuildRoutePayload; signal: AbortSignal; authentication: boolean }
    >({
      query: ({ url, payload, signal, authentication }) => ({
        url,
        method: 'POST',
        body: payload,
        signal,
        authentication,
      }),
    }),
  }),
})

export default routeApi
