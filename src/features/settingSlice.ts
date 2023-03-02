import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import QNRTC, { SUPPORT_VIDEO_ENCODER_CONFIG_LIST } from 'qnweb-rtc'
import { RootState } from '../store'

export type ThemeCode = 'light' | 'auto' | 'dark'

export type FacingMode = 'environment' | 'user'

export type PlainDeviceInfo = Omit<MediaDeviceInfo, 'toJSON'>

export type Preset = keyof typeof SUPPORT_VIDEO_ENCODER_CONFIG_LIST
export function isValidPreset(str: string): str is Preset {
  return Object.keys(SUPPORT_VIDEO_ENCODER_CONFIG_LIST).includes(str)
}

interface Settings {
  themeCode: ThemeCode
  appId: string
  facingMode: FacingMode
  mirror: boolean
  liveStreamBaseUrl: string
  sei?: string
  playbacks: PlainDeviceInfo[]
  microphones: PlainDeviceInfo[]
  cameras: PlainDeviceInfo[]
  defaultCamera?: string
  defaultMicrophone?: string
  defaultPlayback?: string
  cameraPreset: Preset
}

const initialState: Settings = {
  themeCode: (localStorage.getItem('color-theme') as ThemeCode) ?? 'dark',
  appId: localStorage.getItem('app-id') ?? 'g2m0ya7w7', // demo only
  facingMode: (localStorage.getItem('facing-mode') as FacingMode) ?? 'user',
  mirror: localStorage.getItem('mirror') == 'true' ?? false,
  liveStreamBaseUrl:
    localStorage.getItem('livestream-url') ??
    'rtmp://pili-publish.qnsdk.com/sdk-live',
  sei: 'timestamp: ${ts}',
  playbacks: [],
  microphones: [],
  cameras: [],
  cameraPreset: '720p',
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
    setDefaultMicrophone(state, { payload }: PayloadAction<string>) {
      if (state.microphones.find((p) => p.groupId == payload)) {
        state.defaultMicrophone = payload
      }
    },
    setDefaultPlayback(state, { payload }: PayloadAction<string>) {
      if (state.playbacks.find((p) => p.groupId == payload)) {
        state.defaultPlayback = payload
      }
    },
    updateCameraPreset(state, { payload }: PayloadAction<Preset>) {
      state.cameraPreset = payload
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
  updateCameraPreset,
  setDefaultMicrophone,
  setDefaultPlayback,
} = settingSlice.actions
export const selectTheme = (state: RootState) => state.settings.themeCode
export default settingSlice.reducer
