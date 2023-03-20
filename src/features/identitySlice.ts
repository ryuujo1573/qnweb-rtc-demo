import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { checkUserId } from '../utils'

export interface IdentityState {
  userId: string | null
}

const initialState: IdentityState = {
  userId: localStorage.getItem('userid'),
}

const updateUserIdReducer = function (
  state: { userId: string | null },
  { payload: userId }: PayloadAction<string>
) {
  if (checkUserId(userId) == false) {
    return
  }
  state.userId = userId
}

export const identitySlice = createSlice({
  name: 'identity',
  initialState,
  reducers: {
    updateUserId: (state, action) => {
      updateUserIdReducer(state, action)
      state.userId && localStorage.setItem('userid', state.userId)
    },
    updateUserIdTemp: updateUserIdReducer,
  },
})

export const { updateUserId, updateUserIdTemp } = identitySlice.actions
export default identitySlice.reducer
