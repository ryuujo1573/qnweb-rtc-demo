import {
  AsyncThunk,
  createAsyncThunk,
  createSlice,
  PayloadAction,
  Reducer,
} from '@reduxjs/toolkit'
import QNRTC, {
  QNCameraVideoTrack,
  QNConnectionState as QState,
  QNLocalTrack,
  QNRemoteTrack,
  QNScreenVideoTrack,
  QNMicrophoneAudioTrack,
  QNCustomAudioTrack,
} from 'qnweb-rtc'
import { client } from '../api'
import type { ThunkAPI } from '../store'
import { error, success } from './messageSlice'

type GenericAsyncThunk = AsyncThunk<unknown, unknown, any>

type PendingAction = ReturnType<GenericAsyncThunk['pending']>
type RejectedAction = ReturnType<GenericAsyncThunk['rejected']>
type FulfilledAction = ReturnType<GenericAsyncThunk['fulfilled']>

export const createTrack = createAsyncThunk<
  WebRTCState['localTrack'],
  TrackTag,
  ThunkAPI
>(
  'webrtc/createTrack',
  async (tag, { dispatch, getState }) => {
    let tracks: QNLocalTrack[] = []
    const store = getState()
    const {
      facingMode,
      cameraPreset,
      defaultCamera,
      defaultMicrophone,
      defaultPlayback,
    } = store.settings
    const { localTrack } = store.room

    // for (const tag of trackTags)
    switch (tag) {
      case 'microphone': {
        tracks.push(
          await QNRTC.createMicrophoneAudioTrack({
            tag,
            microphoneId: defaultMicrophone,
            encoderConfig: 'HIGH',
          }),
        )
        break
      }
      case 'camera': {
        tracks.push(
          await QNRTC.createCameraVideoTrack({
            tag,
            cameraId: defaultCamera,
            encoderConfig: cameraPreset,
            facingMode: undefined,
          }),
        )
        break
      }
      case 'screenVideo': {
        // FIXME: this may cause problems
        const result = await QNRTC.createScreenVideoTrack(
          {
            screenVideoTag: 'screenVideo',
            screenAudioTag: 'screenAudio',
          },
          'auto',
        )
        if (Array.isArray(result)) {
          const [videoTrack, audioTrack] = result
          videoTrack.on('ended', screenShareCleanup)
          tracks.push(videoTrack, audioTrack)
        } else {
          result.on('ended', screenShareCleanup)
          tracks.push(result)
        }
        break
      }
      default:
        break
    }

    await client.publish(tracks)
    tracks.forEach((t) => refStore.localTracksMap.set(t.trackID!, t))

    return Object.fromEntries(tracks.map((t) => [t.tag!, t.trackID!]))

    function screenShareCleanup() {
      dispatch(removeTrack('screenVideo'))
      dispatch(removeTrack('screenAudio'))
    }
  },
  {
    condition: (tag, { getState }) => {
      const { localTrack } = getState().room
      const condition = localTrack[tag] === undefined
      // no creation will be triggered if `localTrack.tag` is defined

      return condition
    },
  },
)

export const joinRoom = createAsyncThunk<void, string, ThunkAPI>(
  'webrtc/joinRoom',
  async (token, { getState, dispatch, rejectWithValue }) => {
    const state = getState()
    const { appId } = state.settings
    const { userId } = state.identity
    if (!userId) {
      return rejectWithValue('加入房间失败，用户名为空！')
    }

    try {
      await client.join(token, userId)
    } catch (e: any) {
      return rejectWithValue(JSON.stringify(e))
    }
    dispatch(success({ message: '成功加入房间' }))
    // const demo: RemoteUser[] = new Array(11).fill(0).map((_, i) => ({
    //   userID: `C${i}eeper`,
    //   state: QState.CONNECTED,
    //   trackIds: [],
    // }))
    // demo.forEach((u) => dispatch(userJoined(u)))
  },
)

export const leaveRoom = createAsyncThunk<void, void, ThunkAPI>(
  'webrtc/leaveRoom',
  async (_, { dispatch }) => {
    try {
      await client.leave()
    } catch (e: any) {
      // TODO: figure out possible errors
      dispatch(error({ message: e.message }))
    }
  },
)

export const subscribe = createAsyncThunk(
  'webrtc/subscribe',
  async (tracks: QNRemoteTrack[]) => {
    const { videoTracks, audioTracks } = await client.subscribe(tracks)
    const allTracks = [...videoTracks, ...audioTracks]
    const userId = allTracks[0].userID!
    for (const track of allTracks) {
      refStore.remoteTracksMap.set(track.trackID!, track)
    }
    return { trackIds: allTracks.map((t) => t.trackID!), userId }
  },
)

export const unsubscribe = createAsyncThunk(
  'webrtc/unsubscribe',
  async (tracks: QNRemoteTrack[]) => {
    const userId = tracks[0].userID!
    const removalIds = tracks.map((t) => t.trackID!)

    await client.unsubscribe(tracks)
    for (const trackId of removalIds) {
      refStore.remoteTracksMap.delete(trackId)
    }
    return { trackIds: removalIds, userId }
  },
)

const supportedTracks = [
  'camera',
  'microphone',
  'screenVideo',
  'screenAudio',
  // 'canvas',
] as const

export type TrackTag = (typeof supportedTracks)[number]

export type WebRTCState = {
  localTrack: {
    [key in (typeof supportedTracks)[number]]?: string
  }
  connectionState: QState
  users: RemoteUser[]
  livemode: boolean
  pinnedTrackId?: string
  focusedTrackId?: string
  cameraMuted: boolean
  microphoneMuted: boolean
}

const initialState: WebRTCState = {
  localTrack: {},
  connectionState: QState.DISCONNECTED,
  users: [],
  livemode: false,
  cameraMuted: false,
  microphoneMuted: false,
}

export interface RemoteUser {
  userID: string
  userData?: string
  state: QState
  trackIds: string[]
}

export const refStore = {
  localTracksMap: new Map<string, QNLocalTrack>(),
  remoteTracksMap: new Map<string, QNRemoteTrack>(),
  getQNTracks({
    camera,
    microphone,
    screenVideo,
    screenAudio,
  }: WebRTCState['localTrack']) {
    return {
      camTrack: camera
        ? (this.localTracksMap.get(camera) as QNCameraVideoTrack | undefined)
        : undefined,
      micTrack: microphone
        ? (this.localTracksMap.get(microphone) as
            | QNMicrophoneAudioTrack
            | undefined)
        : undefined,
      screenVideoTrack: screenVideo
        ? (this.localTracksMap.get(screenVideo) as
            | QNScreenVideoTrack
            | undefined)
        : undefined,
      screenAudioTrack: screenAudio
        ? (this.localTracksMap.get(screenAudio) as
            | QNCustomAudioTrack
            | undefined)
        : undefined,
    }
  },
  *matchLocalTracks(...ids: (string | undefined)[]) {
    for (const id of ids) {
      yield this.localTracksMap.get(id!)
    }
  },
  queryRemoteTracks(ids: string[]) {
    const result = []
    for (const [id, track] of this.remoteTracksMap) {
      if (ids.includes(id)) {
        result.push(track)
      }
    }
    return result
  },
  *matchRemoteTracks(...ids: (string | undefined)[]) {
    for (const id of ids) {
      yield this.remoteTracksMap.get(id!)
    }
  },
  get allTracks() {
    return Array.of<QNLocalTrack | QNRemoteTrack>(
      ...this.localTracksMap.values(),
      ...this.remoteTracksMap.values(),
    )
  },
}

const roomSlice = createSlice({
  name: 'webrtc',
  initialState,
  reducers: {
    stateChanged: (state, { payload }: PayloadAction<QState>) => {
      state.connectionState = payload
    },
    setLivemode: (state, { payload }: PayloadAction<boolean>) => {
      state.livemode = payload
    },
    userJoined: (state, { payload }: PayloadAction<RemoteUser>) => {
      state.users.push(payload)
    },
    userLeft: (state, { payload: uid }: PayloadAction<string>) => {
      const user = state.users.find((u) => u.userID == uid)!
      for (const trackId of user.trackIds) {
        refStore.remoteTracksMap.delete(trackId)
      }
      state.users = state.users.filter((v) => v.userID != uid)
    },
    removeTrack: (
      state,
      { payload: tag }: PayloadAction<TrackTag | undefined>,
    ) => {
      if (tag) {
        // remove specified
        const trackId = state.localTrack[tag]
        if (trackId) {
          trackCleanup(trackId)
          delete state.localTrack[tag]
        }
      } else {
        // remove all
        Object.values(state.localTrack).map(trackCleanup)
        state.localTrack = {}
      }

      function trackCleanup(trackId: string) {
        const track = refStore.localTracksMap.get(trackId)
        if (track) {
          client.unpublish(track).catch(() => {})
          track.destroy()
          refStore.localTracksMap.delete(trackId)
        }
      }
    },
    pinTrack: (state, { payload }: PayloadAction<string>) => {
      state.pinnedTrackId = payload
    },
    unpinTrack: (state) => {
      state.pinnedTrackId = undefined
    },
    focusTrack: (state, { payload }: PayloadAction<string | undefined>) => {
      state.focusedTrackId = payload
    },
    unfocusTrack: (state) => {
      state.focusedTrackId = undefined
    },
    setCameraMuted: (state, action: PayloadAction<boolean>) => {
      state.cameraMuted = action.payload
    },
    setMicrophoneMuted: (state, action: PayloadAction<boolean>) => {
      state.microphoneMuted = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTrack.pending, (state, action) => {
        state.localTrack = {
          ...state.localTrack,
          [action.meta.arg]: null,
          // use `null` as pending flag
        }
      })
      .addCase(createTrack.fulfilled, (state, action) => {
        state.localTrack = {
          ...state.localTrack,
          ...action.payload,
        }
      })
      .addCase(createTrack.rejected, (state, action) => {
        delete state.localTrack[action.meta.arg]
      })
      .addCase(subscribe.fulfilled, (state, action) => {
        const { userId, trackIds } = action.payload
        const user = state.users.find((u) => u.userID == userId)!

        user.trackIds.push(...trackIds)
      })
      .addCase(unsubscribe.fulfilled, (state, action) => {
        const { userId, trackIds: removals } = action.payload
        const user = state.users.find((u) => u.userID == userId)!

        user.trackIds = user.trackIds.filter((id) => !removals.includes(id))
      })
      .addCase(leaveRoom.fulfilled, (state) => {
        state.users = []
      })
      .addMatcher(
        // matcher can be defined inline as a type predicate function
        (action): action is RejectedAction => action.type.endsWith('/rejected'),
        (state, action) => {},
      )
  },
})

export default roomSlice.reducer as Reducer<WebRTCState>

export const {
  stateChanged,
  userJoined,
  userLeft,
  removeTrack,
  setLivemode,
  pinTrack,
  unpinTrack,
  focusTrack,
  unfocusTrack,
  setCameraMuted,
  setMicrophoneMuted,
} = roomSlice.actions
