import { createSlice, PayloadAction } from "@reduxjs/toolkit";


export interface IdentityState {
  auth?: 'anonymous',
  nickname: string | null,
}

const initialState: IdentityState = {
  auth: undefined,
  nickname: null
}

export const identitySlice = createSlice({
  name: 'identity',
  initialState,
  reducers: {
    changeNickname(state, { payload }: PayloadAction<string>) {
      state.nickname = payload
    },
    logout(state) {
      switch (state.auth) {
        case 'anonymous':
          // haha
          state.nickname = null
        case undefined:
          console.log('?');
      }
    }
  }
})

export const { changeNickname, logout } = identitySlice.actions;
export default identitySlice.reducer;