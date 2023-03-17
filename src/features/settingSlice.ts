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

type PrimaryColors = Omit<typeof import('@mui/material/colors'), 'common'>

export interface Settings {
  themeCode: ThemeCode
  primaryColor: keyof PrimaryColors
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
  cameraMuted?: boolean
  microphoneMuted?: boolean
  neverPrompt: boolean
  showProfile: boolean
}

const storageKeys = {
  themeCode: 'color-theme',
  primaryColor: 'primary',
  appId: 'appid',
  facingMode: 'facing-mode',
  mirror: 'mirror',
  liveStreamBaseUrl: 'livestream-url',
  sei: 'sei',
  cameraPreset: 'camera-preset',
  cameraMuted: 'camera-muted',
  microphoneMuted: 'microphone-muted',
  defaultCamera: 'default-camera',
  defaultMicrophone: 'default-microphone',
  defaultPlayback: 'microphone',
  neverPrompt: 'never-prompt',
  showProfile: 'show-profile',
} as const satisfies Partial<Record<keyof Settings, string>>

const initialState: Settings = {
  themeCode:
    (localStorage.getItem(storageKeys.themeCode) as ThemeCode) ?? 'dark',
  primaryColor: 'lightBlue',
  appId: localStorage.getItem(storageKeys.appId) ?? 'd8lk7l4ed',
  facingMode:
    (localStorage.getItem(storageKeys.facingMode) as FacingMode) ?? 'user',
  mirror: localStorage.getItem(storageKeys.mirror) == 'true' ?? false,
  liveStreamBaseUrl:
    localStorage.getItem(storageKeys.liveStreamBaseUrl) ??
    'rtmp://pili-publish.qnsdk.com/sdk-live',
  sei: 'timestamp: ${ts}',
  playbacks: [],
  microphones: [],
  cameras: [],
  cameraPreset: '720p',
  cameraMuted: localStorage.getItem(storageKeys.cameraMuted) == 'true' ?? false,
  microphoneMuted:
    localStorage.getItem(storageKeys.microphoneMuted) == 'true' ?? false,
  neverPrompt: localStorage.getItem(storageKeys.neverPrompt) == 'true' ?? false,
  showProfile: localStorage.getItem(storageKeys.showProfile) == 'true' ?? false,
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
    changeTheme: (state, { payload }: PayloadAction<ThemeCode>) => {
      state.themeCode = payload
    },
    changeColor: (state, { payload }: PayloadAction<keyof PrimaryColors>) => {
      state.primaryColor = payload
    },
    update: (state, { payload }: PayloadAction<Partial<Settings>>) => {
      return {
        ...state,
        ...payload,
      }
    },
    save: (state, { payload }: PayloadAction<Partial<Settings>>) => {
      for (const key in payload) {
        if (key in storageKeys) {
          localStorage.setItem(
            storageKeys[<keyof typeof storageKeys>key],
            JSON.stringify(payload[<keyof typeof payload>key])
          )
        }
      }

      return {
        ...state,
        ...payload,
      }
    },
    setDefaultCamera(state, { payload }: PayloadAction<string>) {
      if (state.cameras.find((p) => p.deviceId == payload)) {
        state.defaultCamera = payload
      }
    },
    setDefaultMicrophone(state, { payload }: PayloadAction<string>) {
      if (state.microphones.find((p) => p.deviceId == payload)) {
        state.defaultMicrophone = payload
      }
    },
    setDefaultPlayback(state, { payload }: PayloadAction<string>) {
      if (state.playbacks.find((p) => p.deviceId == payload)) {
        state.defaultPlayback = payload
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
  changeTheme,
  changeColor,
  update,
  save,
  setDefaultCamera,
  setDefaultMicrophone,
  setDefaultPlayback,
} = settingSlice.actions
export const selectTheme = (state: RootState) => state.settings.themeCode
export default settingSlice.reducer
