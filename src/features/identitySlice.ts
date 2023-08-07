import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { joinRoom } from './roomSlice'

export interface IdentityState {
  userId: string | null
  token: string | null
}

const initialState: IdentityState = {
  userId: localStorage.getItem('userid'),
  token: new URLSearchParams(location.search).get('roomToken'),
}

if (initialState.token) {
  console.info('token from url', initialState.token)
}

export const identitySlice = createSlice({
  name: 'auth',
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
  extraReducers(builder) {
    builder.addCase(joinRoom.rejected, (state, action) => {
      state.token = null
    })
  },
})

export const { updateToken, updateUserId, updateUserIdFromToken } =
  identitySlice.actions
export default identitySlice.reducer
