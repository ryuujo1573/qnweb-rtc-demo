import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import QNRTC from 'qnweb-rtc'
import { RootState } from '../store'

export type ThemeCode = 'light' | 'auto' | 'dark'

export type FacingMode = 'environment' | 'user'

type PlainDeviceInfo = Omit<MediaDeviceInfo, 'toJSON'>

interface Settings {
  themeCode: ThemeCode
  appId: string
  facingMode: FacingMode
  mirror: boolean
  liveStreamBaseUrl: string
  sei: string | null
  playbacks: PlainDeviceInfo[]
  microphones: PlainDeviceInfo[]
  cameras: PlainDeviceInfo[]
  defaultCamera?: string
  defaultMicrophone?: string
  defaultPlayback?: string
}

const initialState: Settings = {
  themeCode: (localStorage.getItem('color-theme') as ThemeCode) ?? 'dark',
  appId: localStorage.getItem('app-id') ?? 'd8lk7l4ed', // demo only
  facingMode: (localStorage.getItem('facing-mode') as FacingMode) ?? 'user',
  mirror: localStorage.getItem('mirror') == 'true' ?? false,
  liveStreamBaseUrl:
    localStorage.getItem('livestream-url') ??
    'rtmp://pili-publish.qnsdk.com/sdk-live',
  sei: 'timestamp: ${ts}',
  playbacks: [],
  microphones: [],
  cameras: [],
}

export const checkDevices = createAsyncThunk(
  'checkDevices',
  async function checkDevices() {
    const deviceInfos = await QNRTC.getDevices()
    return deviceInfos.map((info) => info.toJSON())
  }
)

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
      localStorage.setItem('app-id', appId)
    },
    setLiveStreamBaseUrl: (state, { payload: url }: PayloadAction<string>) => {
      state.liveStreamBaseUrl = url
      localStorage.setItem('livestream-url', url)
    },
    updateFacingMode(
      state,
      { payload: facingMode }: PayloadAction<FacingMode>
    ) {
      state.facingMode = facingMode
      localStorage.setItem('facing-mode', facingMode)
    },
    toggleMirror(state, { payload: mirror }: PayloadAction<boolean>) {
      state.mirror = mirror
      localStorage.setItem('mirror', mirror ? 'true' : 'false')
    },
    setDefaultCamera(state, { payload }: PayloadAction<string>) {
      if (state.cameras.find((p) => p.groupId == payload)) {
        state.defaultCamera = payload
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(
      checkDevices.fulfilled,
      (state, { payload: deviceInfos }) => {
        state.cameras = []
        state.microphones = []
        state.playbacks = []
        for (const device of deviceInfos) {
          switch (device.kind) {
            case 'videoinput':
              state.cameras.push(device)
              break
            case 'audioinput':
              state.microphones.push(device)
              break
            case 'audiooutput':
              state.playbacks.push(device)
              break
          }
        }
      }
    )
  },
})

export const {
  setTheme,
  setAppId,
  setLiveStreamBaseUrl,
  updateFacingMode,
  toggleMirror,
  setDefaultCamera,
} = settingSlice.actions
export const selectTheme = (state: RootState) => state.settings.themeCode
export default settingSlice.reducer
