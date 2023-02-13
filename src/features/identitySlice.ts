import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type AllAuth = 'anonymous'

export interface IdentityState {
  auth: AllAuth | null
  userId: string | null
}

const initialState: IdentityState = {
  auth: localStorage.getItem('auth') as unknown as IdentityState['auth'],
  userId: localStorage.getItem('userId'),
}

export const identitySlice = createSlice({
  name: 'identity',
  initialState,
  reducers: {
    updateUserId(state, { payload: userId }: PayloadAction<string>) {
      state.auth = 'anonymous'
      state.userId = userId
      localStorage.setItem('auth', 'anonymous')
      localStorage.setItem('userId', userId)
    },
    logout(state) {
      switch (state.auth) {
        case 'anonymous':
          // haha
          state.auth = null
          state.userId = null
        case undefined:
          console.log('?')
      }
    },
  },
})

export const { updateUserId, logout } = identitySlice.actions
export default identitySlice.reducer
