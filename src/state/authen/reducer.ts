import { LoginMethod } from '@kybernetwork/oauth2'
import { createReducer } from '@reduxjs/toolkit'

import { updatePossibleWalletAddress, updateProcessingLogin, updateProfile, updateSession } from './actions'

export type UserProfile = { email: string; identityId: string }
export interface AuthenState {
  readonly possibleConnectedWalletAddress: null | string | undefined // null is checking
  readonly anonymousUserInfo: { username: string } | undefined
  readonly userInfo: UserProfile | undefined
  readonly isLogin: boolean
  readonly pendingAuthentication: boolean
}

const DEFAULT_AUTHEN_STATE: AuthenState = {
  possibleConnectedWalletAddress: null,
  anonymousUserInfo: undefined,
  userInfo: undefined,
  isLogin: false,
  pendingAuthentication: true,
}

export default createReducer(DEFAULT_AUTHEN_STATE, builder =>
  builder
    .addCase(updatePossibleWalletAddress, (state, { payload: possibleConnectedWalletAddress }) => {
      state.possibleConnectedWalletAddress = possibleConnectedWalletAddress
    })
    .addCase(updateSession, (state, { payload: session }) => {
      if (session.loginMethod === LoginMethod.ANONYMOUS) state.anonymousUserInfo = session.userInfo
    })
    .addCase(updateProcessingLogin, (state, { payload: processing }) => {
      state.pendingAuthentication = processing
    })
    .addCase(updateProfile, (state, { payload: userInfo }) => {
      state.userInfo = userInfo
      state.isLogin = true
    }),
)
