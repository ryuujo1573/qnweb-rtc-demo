import { createAsyncThunk, createEntityAdapter, createSlice, PayloadAction } from "@reduxjs/toolkit";
import QNRTC, { QNConnectionState, QNElectronScreenSource, QNRemoteUser } from "qnweb-rtc";

interface MediaDeviceInfoData {
  readonly deviceId: string;
  readonly groupId: string;
  readonly kind: MediaDeviceKind;
  readonly label: string;
}

type FacingMode = 'environment' | 'user';

export const refStore: {
  device?: {
    cameras: MediaDeviceInfoData[],
    microphones: MediaDeviceInfoData[],
    playbacks: MediaDeviceInfoData[],
    // screenSources: QNElectronScreenSource[]
  }
} = {}
export interface LocalState {
  connectionState: QNConnectionState,
  facingMode: FacingMode,
  mirror: boolean,
  device?: {
    cameras: MediaDeviceInfoData[],
    microphones: MediaDeviceInfoData[],
    playbacks: MediaDeviceInfoData[],
    // screenSources: QNElectronScreenSource[]
  }
}

const userAdapter = createEntityAdapter<QNRemoteUser>()
const initialState = userAdapter.getInitialState<LocalState>({
  connectionState: QNConnectionState.DISCONNECTED,
  facingMode: 'user',
  mirror: false,
  device: refStore.device,
})

type DeviceInfo = Exclude<LocalState['device'], undefined>;

export const fetchDeviceInfo = createAsyncThunk<DeviceInfo | undefined>('webrtc/fetchDevideInfo', async () => (
  undefined
  //   {
  //   cameras: await QNRTC.getCameras(),
  //   microphones: await QNRTC.getMicrophones(),
  //   playbacks: await QNRTC.getPlaybackDevices(),
  //   screenSources: await QNRTC.getElectronScreenSources(),
  // }
))

export const webrtcSlice = createSlice({
  name: 'webrtc',
  initialState,
  reducers: {
    updateState(state, { payload }: PayloadAction<QNConnectionState>) {
      state.connectionState = payload
    },
    userJoin: userAdapter.addOne,
    userLeave: userAdapter.removeOne,
    updateFacingMode(state, { payload }: PayloadAction<FacingMode>) {
      state.facingMode = payload
    },
    toggleMirror(state, { payload }: PayloadAction<boolean>) {
      state.mirror = payload
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchDeviceInfo.pending, state => {
        refStore.device = undefined
      })
      .addCase(fetchDeviceInfo.fulfilled, (state, { payload }) => {
        refStore.device = payload
      })
  }
})

export const { updateState, updateFacingMode, toggleMirror, } = webrtcSlice.actions;
export default webrtcSlice.reducer;
