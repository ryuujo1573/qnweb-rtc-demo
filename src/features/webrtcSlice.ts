import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { QNConnectionState } from "qnweb-rtc";


export interface WebRTCState {
  connectionState: QNConnectionState,
  devices?: {
    videoTracks: [],
    audioTracks: [],
  }
}

const initialState: WebRTCState = {
  connectionState: QNConnectionState.DISCONNECTED
}

export const webrtcSlice = createSlice({
  name: 'webrtc',
  initialState,
  reducers: {
    updateState(state, { payload }: PayloadAction<QNConnectionState>) {
      state.connectionState = payload
    }
  }
})

export const { updateState } = webrtcSlice.actions;
export default webrtcSlice.reducer;
