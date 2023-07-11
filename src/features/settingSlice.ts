import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import QNRTC, {
  SUPPORT_SCREEN_ENCODER_CONFIG_LIST,
  SUPPORT_VIDEO_ENCODER_CONFIG_LIST,
} from 'qnweb-rtc'
import type { RootState } from '../store'

export type ThemeCode = 'light' | 'auto' | 'dark'

export type FacingMode = 'environment' | 'user'

export type PlainDeviceInfo = Omit<MediaDeviceInfo, 'toJSON'>

export type CameraPreset = keyof typeof SUPPORT_VIDEO_ENCODER_CONFIG_LIST
export type ScreenPreset = keyof typeof SUPPORT_SCREEN_ENCODER_CONFIG_LIST

export function isScreenPreset(str: string): str is ScreenPreset {
  return Object.keys(SUPPORT_SCREEN_ENCODER_CONFIG_LIST).includes(str)
}

export function isCameraPreset(str: string): str is CameraPreset {
  return Object.keys(SUPPORT_VIDEO_ENCODER_CONFIG_LIST).includes(str)
}

type PrimaryColors = Omit<typeof import('@mui/material/colors'), 'common'>

export interface Settings {
  appId: string
  // 应用设置
  themeCode: ThemeCode
  primaryColor: keyof PrimaryColors
  showProfile: boolean
  neverPrompt: boolean
  // 摄像头
  cameraMuted: boolean
  facingMode: FacingMode
  cameraPreset: CameraPreset
  mirror: boolean
  // 麦克风
  microphoneMuted: boolean
  // 屏幕共享
  screenPreset: ScreenPreset
  // 默认设备
  defaultCamera?: string
  defaultMicrophone?: string
  defaultPlayback?: string
  // 直播设置
  liveStreamBaseUrl: string
  sei?: string
  // TODO: 从设置中移出设备列表
  // 设备列表
  playbacks: PlainDeviceInfo[]
  microphones: PlainDeviceInfo[]
  cameras: PlainDeviceInfo[]
}

const storage: {
  readonly [key in (typeof keys)[number]]?: Settings[key]
} = {}

const keys = [
  'appId',
  'cameraMuted',
  'cameraPreset',
  'defaultCamera',
  'defaultMicrophone',
  'defaultPlayback',
  'facingMode',
  'liveStreamBaseUrl',
  'microphoneMuted',
  'mirror',
  'neverPrompt',
  'primaryColor',
  'screenPreset',
  'sei',
  'showProfile',
  'themeCode',
] as const

function isStorageKey(key: string): key is (typeof keys)[number] {
  return keys.includes(key as any)
}

for (const key of keys) {
  Object.defineProperty(storage, key, {
    get() {
      const item = localStorage.getItem(key)
      return item !== null ? JSON.parse(item) : undefined
    },
  })
}

const defaultSettings: Settings = {
  themeCode: 'dark',
  primaryColor: 'lightBlue',
  appId: 'd8lk7l4ed',
  facingMode: 'user',
  mirror: false,
  liveStreamBaseUrl: 'rtmp://pili-publish.qnsdk.com/sdk-live',
  sei: 'timestamp: ${ts}',
  playbacks: [],
  microphones: [],
  cameras: [],
  cameraPreset: '720p',
  screenPreset: '1080p',
  cameraMuted: false,
  microphoneMuted: false,
  neverPrompt: false,
  showProfile: false,
}

export const checkDevices = createAsyncThunk(
  'checkDevices',
  async function checkDevices() {
    const deviceInfos = await QNRTC.getDevices()
    return deviceInfos.map((info) => info.toJSON())
  },
)

const initialState: Settings = {
  ...defaultSettings,
  ...storage,
}

// 应当保存的设置
type SolidSettings = Omit<
  Partial<Settings>,
  'cameras' | 'microphones' | 'playbacks'
>

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
    save: (state, { payload }: PayloadAction<SolidSettings>) => {
      for (const key of Object.keys(payload)) {
        if (isStorageKey(key)) {
          localStorage.setItem(
            key,
            JSON.stringify(payload[<keyof typeof payload>key]),
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
      },
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
