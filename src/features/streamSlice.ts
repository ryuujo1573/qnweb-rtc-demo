import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  QNLiveStreamingState as QLiveState,
  QNTranscodingLiveStreamingConfig,
} from 'qnweb-rtc'
import { client } from '../api'
import { ThunkAPI } from '../store'
import { delay, getRandomId } from '../utils'
import { refStore } from './webrtcSlice'

type QStream = {
  liveMode: LiveMode
  streamID: string
  replacing?: boolean
}

export const startLive = createAsyncThunk<QStream, string, ThunkAPI>(
  'stream/startLive',
  async function (url, api) {
    const { getState, dispatch } = api
    const {
      liveMode,
      directConfig,
      composedConfig,
      lastStreamId,
      lastLiveMode,
    } = getState().stream

    const videoTrack = directConfig.videoTrackId
      ? refStore.localTracksMap.get(directConfig.videoTrackId)
      : undefined
    const audioTrack = directConfig.audioTrackId
      ? refStore.localTracksMap.get(directConfig.audioTrackId)
      : undefined

    const streamID = getRandomId()

    function handler(_: string, state: QLiveState) {
      if (state == QLiveState.STARTED) {
        if (lastStreamId && lastLiveMode) {
          dispatch(
            stopLive({
              liveMode: lastLiveMode,
              streamID: lastStreamId,
              replacing: true,
            })
          )
        }
      }
    }

    if (liveMode == 'direct') {
      client.once('direct-livestreaming-state-changed', handler)
      await client.startDirectLiveStreaming({
        url,
        streamID,
        videoTrack,
        audioTrack,
      })
    } else if (liveMode == 'composed') {
      client.once('transcoding-livestreaming-state-changed', handler)
      const { transcodingTracks, ...rest } = composedConfig
      console.log('# composed', composedConfig)
      await client.startTranscodingLiveStreaming({
        url,
        streamID,
        ...rest,
      })
      console.log("# here i'm not stuck!")
      if (transcodingTracks) {
        await client.setTranscodingLiveStreamingTracks(
          streamID,
          transcodingTracks
        )
      }
    }

    // return rejectWithValue('live state is not idle.')

    return { streamID, liveMode }
  }
)

export const stopLive = createAsyncThunk(
  'stream/stopLive',
  async function (specified: QStream) {
    // const { lastLiveMode, lastStreamId } = getState().stream

    const { liveMode, streamID } = specified

    if (liveMode == 'composed') {
      await client.stopTranscodingLiveStreaming(streamID)
    } else {
      await client.stopDirectLiveStreaming(streamID)
    }
    return specified.replacing
  }
)

export type LiveMode = 'direct' | 'composed'
export type LiveState = 'idle' | 'connected' | 'processing'

export type ComposedConfig = Omit<
  QNTranscodingLiveStreamingConfig,
  'streamID' | 'url'
>

export type DirectConfig = {
  videoTrackId?: string
  audioTrackId?: string
}

export type StreamState = {
  liveState: LiveState
  liveMode: LiveMode
  lastLiveMode?: LiveMode
  lastStreamId?: string
  directConfig: DirectConfig
  composedConfig: ComposedConfig
}

const initialState: StreamState = {
  liveState: 'idle',
  liveMode: 'direct',
  lastLiveMode: undefined,
  lastStreamId: undefined,
  directConfig: {},
  composedConfig: {
    bitrate: 1200,
    width: 1280,
    height: 720,
    background: {
      url: 'http://pili-playback.qnsdk.com/ivs_background_1280x720.png',
      x: 0,
      y: 0,
      width: 1280,
      height: 720,
    },
    transcodingTracks: [],
  },
}

export const streamSlice = createSlice({
  name: 'stream',
  initialState,
  reducers: {
    changeMode: (state) => {
      if (state.liveMode == 'composed') {
        state.liveMode = 'direct'
      } else {
        state.liveMode = 'composed'
      }
    },
    updateDirectConfig: (
      state,
      { payload }: PayloadAction<StreamState['directConfig']>
    ) => {
      state.directConfig = payload
    },
    updateComposedConfig: (
      state,
      { payload }: PayloadAction<StreamState['composedConfig']>
    ) => {
      state.composedConfig = payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startLive.pending, (state) => {
        state.liveState = 'processing'
      })
      .addCase(startLive.fulfilled, (state, action) => {
        state.lastStreamId = action.payload.streamID
        state.lastLiveMode = action.payload.liveMode
        state.liveState = 'connected'
      })
      .addCase(stopLive.pending, (state) => {
        state.liveState = 'processing'
      })
      .addCase(stopLive.fulfilled, (state, { payload: isReplacing }) => {
        if (isReplacing) {
          state.liveState = 'connected'
        } else {
          state.liveState = 'idle'
          delete state.lastLiveMode
          delete state.lastStreamId
        }
      })
      .addCase(stopLive.rejected, (state, action) => {
        const { replacing } = action.meta.arg
        if (!replacing) {
          state.liveState = 'idle'
        }
      })
      .addMatcher(
        (action) => action.type.includes('rejected'),
        (state, { error }) => {
          console.warn(error)
          state.liveState = 'idle'
        }
      )
  },
})

export default streamSlice.reducer
export const { changeMode, updateDirectConfig, updateComposedConfig } =
  streamSlice.actions
