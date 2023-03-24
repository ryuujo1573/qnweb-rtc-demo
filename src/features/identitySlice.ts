import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { checkUserId } from '../utils'

export interface IdentityState {
  userId: string | null
}

const initialState: IdentityState = {
  userId: localStorage.getItem('userid'),
}

export const identitySlice = createSlice({
  name: 'identity',
  initialState,
  reducers: {
    updateUserId: (state, { payload: userId }: PayloadAction<string>) => {
      state.userId = userId
      state.userId && localStorage.setItem('userid', state.userId)
    },
    updateUserIdTemp: (state, { payload: userId }: PayloadAction<string>) => {
      state.userId = userId
    },
  },
})

export const { updateUserId, updateUserIdTemp } = identitySlice.actions
export default identitySlice.reducer
