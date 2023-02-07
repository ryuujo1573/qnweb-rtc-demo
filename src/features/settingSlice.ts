import { createListenerMiddleware, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RootState } from "../store"

export type ThemeCode = 'light' | 'auto' | 'dark'

interface Settings {
  nickname?: string,
  themeCode: ThemeCode,
  appId: string,
}

const initialState: Settings = {
  nickname: undefined,
  themeCode: 'dark',
  appId: 'd8lk7l4ed', // demo only
}

export const settingSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setNickname: (state, action: PayloadAction<string>) => { state.nickname = action.payload },
    setTheme: (state, { payload: code }: PayloadAction<ThemeCode>) => {
      state.themeCode = code
    },
    setAppId: (state, { payload: appId }: PayloadAction<string>) => {
      state.appId = appId
    },
  },
})

export const { setNickname, setTheme, setAppId } = settingSlice.actions
export const selectNickname = (state: RootState) => state.settings.nickname;
export const selectTheme = (state: RootState) => state.settings.themeCode;
export default settingSlice.reducer;
