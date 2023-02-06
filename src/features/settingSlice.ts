import { createListenerMiddleware, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RootState } from "../store"

export type ThemeCode = 'light' | 'auto' | 'dark'

interface Settings {
  nickname?: string
  themeCode: ThemeCode
}

const initialState: Settings = {
  themeCode: 'dark',
}

export const settingSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setNickname: (state, action: PayloadAction<string>) => { state.nickname = action.payload },
    changeTheme: (state, { payload: code }: PayloadAction<ThemeCode>) => {
      state.themeCode = code
    },
  }
})

export const { setNickname, changeTheme } = settingSlice.actions
export const selectNickname = (state: RootState) => state.settings.nickname;
export const selectTheme = (state: RootState) => state.settings.themeCode;
export default settingSlice.reducer;
