import { createListenerMiddleware, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RootState } from "../store"

export type ThemeCode = 'light' | 'auto' | 'dark'

interface Settings {
  themeCode: ThemeCode,
  appId: string,
}

const initialState: Settings = {
  themeCode: localStorage.getItem('color-theme') as ThemeCode ?? 'dark',
  appId: 'd8lk7l4ed', // demo only
}

export const settingSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, { payload: code }: PayloadAction<ThemeCode>) => {
      state.themeCode = code
      localStorage.setItem('color-theme', code)
    },
    setAppId: (state, { payload: appId }: PayloadAction<string>) => {
      state.appId = appId
    },
  },
})

export const { setTheme, setAppId } = settingSlice.actions
export const selectTheme = (state: RootState) => state.settings.themeCode;
export default settingSlice.reducer;
