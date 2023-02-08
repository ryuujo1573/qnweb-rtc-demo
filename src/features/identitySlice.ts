import { createSlice, PayloadAction } from "@reduxjs/toolkit";


export interface IdentityState {
  auth: 'anonymous' | null,
  nickname: string | null,
}

const initialState: IdentityState = {
  auth: null,
  nickname: null
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
