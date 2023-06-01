import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { checkUserId } from '../utils'

export interface IdentityState {
  userId: string | null
  token: string | null
}

const initialState: IdentityState = {
  userId: localStorage.getItem('userid'),
  token: location.search.match(/token=([^&]+)/)?.pop() || null,
}

export const identitySlice = createSlice({
  name: 'identity',
  initialState,
  reducers: {
    updateToken: (state, { payload }: PayloadAction<string>) => {
      state.token = payload
    },
    updateUserId: (state, { payload }: PayloadAction<string>) => {
      state.userId = payload
      state.userId && localStorage.setItem('userid', state.userId)
    },
    updateUserIdFromToken: (state, { payload }: PayloadAction<string>) => {
      state.userId = payload
    },
  },
})

export const { updateToken, updateUserId, updateUserIdFromToken } =
  identitySlice.actions
export default identitySlice.reducer
