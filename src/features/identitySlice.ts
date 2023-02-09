import { createSlice, PayloadAction } from "@reduxjs/toolkit";


type AllAuth = 'anonymous';

export interface IdentityState {
  auth: AllAuth | null,
  nickname: string | null,
}

const initialState: IdentityState = {
  auth: localStorage.getItem('auth') as unknown as IdentityState['auth'],
  nickname: localStorage.getItem('nickname'),
}

export const identitySlice = createSlice({
  name: 'identity',
  initialState,
  reducers: {
    updateNickname(state, { payload }: PayloadAction<string>) {
      state.auth = 'anonymous'
      state.nickname = payload
    },
    logout(state) {
      switch (state.auth) {
        case 'anonymous':
          // haha
          state.auth = null
          state.nickname = null
        case undefined:
          console.log('?');
      }
    }
  }
})

export const { updateNickname, logout } = identitySlice.actions;
export default identitySlice.reducer;
