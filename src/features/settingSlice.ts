import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../store'

export type ThemeCode = 'light' | 'auto' | 'dark'

export type FacingMode = 'environment' | 'user'

interface Settings {
  themeCode: ThemeCode
  appId: string
  facingMode: FacingMode
  mirror: boolean
}

const initialState: Settings = {
  themeCode: (localStorage.getItem('color-theme') as ThemeCode) ?? 'dark',
  appId: localStorage.getItem('appId') ?? 'd8lk7l4ed', // demo only
  facingMode: (localStorage.getItem('facingMode') as FacingMode) ?? 'user',
  mirror: localStorage.getItem('mirror') == 'true' ?? false,
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
      localStorage.setItem('appId', appId)
    },
    updateFacingMode(
      state,
      { payload: facingMode }: PayloadAction<FacingMode>
    ) {
      state.facingMode = facingMode
      localStorage.setItem('facingMode', facingMode)
    },
    toggleMirror(state, { payload: mirror }: PayloadAction<boolean>) {
      state.mirror = mirror
      localStorage.setItem('mirror', mirror ? 'true' : 'false')
    },
  },
})

export const { setTheme, setAppId, updateFacingMode, toggleMirror } =
  settingSlice.actions
export const selectTheme = (state: RootState) => state.settings.themeCode
export default settingSlice.reducer
