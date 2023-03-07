import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  QNLiveStreamingState as QLiveState,
  QNTranscodingLiveStreamingConfig,
} from 'qnweb-rtc'
import { client } from '../api'
import { ThunkAPI } from '../store'
import { delay, getRandomId } from '../utils'
import refStore from './tracks'

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
      ? refStore.localTracks.get(directConfig.videoTrackId)
      : undefined
    const audioTrack = directConfig.audioTrackId
      ? refStore.localTracks.get(directConfig.audioTrackId)
      : undefined

    const streamID = getRandomId()
    const flag = {
      done: false,
    }

    async function handler(_: string, state: QLiveState) {
      if (state == QLiveState.STARTED) {
        flag.done = true
        console.log('LiveState:', state, 'flag:', flag.done)
        if (lastStreamId && lastLiveMode) {
          // wait for state-changed handling
          // no more than 1s
          const result = await Promise.race([
            new Promise<void>((resolve) => {
              console.time('flag.done')
              const id = setInterval(() => {
                if (flag.done) {
                  console.timeEnd('flag.done')
                  resolve()
                  clearInterval(id)
                }
              }, 1)
            }),
            delay(1000).then(() => {
              return 'it took too long to wait'
            }),
          ])
          console.warn(result)
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
      await client.startTranscodingLiveStreaming({
        url,
        streamID,
        ...composedConfig,
      })
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

export type StreamState = {
  liveState: LiveState
  liveMode: LiveMode
  serialNum: number
  lastLiveMode?: LiveMode
  lastStreamId?: string
  directConfig: {
    videoTrackId?: string
    audioTrackId?: string
  }
  composedConfig: Omit<QNTranscodingLiveStreamingConfig, 'streamID' | 'url'>
}

const initialState: StreamState = {
  liveState: 'idle',
  liveMode: 'direct',
  serialNum: 0,
  lastLiveMode: undefined,
  lastStreamId: undefined,
  directConfig: {},
  composedConfig: {
    width: 640,
    height: 480,
    background: {
      url: 'http://pili-playback.qnsdk.com/ivs_background_1280x720.png',
      x: 0,
      y: 0,
      width: 640,
      height: 480,
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
      .addMatcher(
        (action) => action.type.includes('rejected'),
        (state, { error }) => {
          console.error(error.message, '\n', error.stack ?? 'Unknown Error')
          state.liveState = 'idle'
        }
      )
  },
})

export default streamSlice.reducer
export const { changeMode, updateDirectConfig, updateComposedConfig } =
  streamSlice.actions
