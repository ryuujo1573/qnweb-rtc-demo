import QNRTC, {
  QNConnectionDisconnectedInfo,
  QNConnectionState,
  QNLocalVideoTrack,
  QNRemoteUser,
  QNRemoteVideoTrack,
  QNRemoteTrack,
  QNCustomMessage,
  QNLiveStreamingState,
  QNMediaRelayState,
  QNRemoteAudioTrack,
  QNVolumeIndicator,
} from 'qnweb-rtc'
import { success } from './features/messageSlice'
import { store } from './store'

const startTime = Date.now()
export const client = QNRTC.createClient()

// designed for integration of React Hooks
export namespace QNExternalStore {
  // typings
  export type QNExternalStore = {
    pinnedVisualTrack?: QNRemoteVideoTrack | QNLocalVideoTrack
    roomMembers: QNRemoteUser[]
    // publishedTracks: QNRemoteTrack[]
    // subscriptions: QNRemoteTrack[]
    connectionState: QNConnectionState
  }

  export type Callback = () => void

  // function interfaces
  export function getSnapshot() {
    return qnStore
  }

  export function subscribe(listener: Callback) {
    listeners = [...listeners, listener]
    return function cleanup() {
      listeners = listeners.filter((v) => listener !== v)
    }
  }

  export function notifyListeners() {
    for (const listener of listeners) {
      listener()
    }
  }

  // variables
  let qnStore: QNExternalStore = {
    roomMembers: [],
    // publishedTracks: [],
    // subscriptions: [],
    connectionState: QNConnectionState.DISCONNECTED,
  }

  let listeners: Callback[] = []

  // bindings
  client.on('user-joined', (remoteUserID: string, _userData?: string) => {
    // qnStore.roomMembers.push(remoteUserID)
    qnStore.roomMembers = client.remoteUsers
    return notifyListeners()
  })
  client.on('user-left', (remoteUserID: string) => {
    // qnStore.roomMembers = qnStore.roomMembers.filter((id) => remoteUserID != id)
    qnStore.roomMembers = client.remoteUsers
    return notifyListeners()
  })
  client.on(
    'user-published',
    async (_userID: string, qntracks: (QNRemoteAudioTrack | QNRemoteVideoTrack)[]) => {
      // possible vulnurability: remote track ID == undefined deliberately
      // qnStore.publishedTracks = [...qnStore.publishedTracks, ...qntracks]
      // client.subscribe(qntracks)
    qnStore.roomMembers = client.remoteUsers
    await client.subscribe(qntracks)
    notifyListeners()
    }
  )
  client.on(
    'user-unpublished',
    (userID: string, qntrack: (QNRemoteAudioTrack | QNRemoteVideoTrack)[]) => {
      // // there'd always be a trackID on remote tracks.
      // const trackIds = qntrack.map((track) => track.trackID!)
      // qnStore.publishedTracks = qnStore.publishedTracks.filter((t) =>
      //   trackIds.includes(t.trackID!)
      // )
    qnStore.roomMembers = client.remoteUsers
    return notifyListeners()
    }
  )
  client.on(
    'connection-state-changed',
    (state: QNConnectionState, info?: QNConnectionDisconnectedInfo) => {
      info && console.log('disconnected:', info)
      qnStore.connectionState = state
      return notifyListeners()
    }
  )
  client.on('user-reconnecting', (remoteUserID: string) => {
    console.log('[event user-reconnecting]', remoteUserID)
    // return notifyListeners()
  })
  client.on('user-reconnected', (remoteUserID: string) => {
    console.log('[event user-reconnected]', remoteUserID)
    // return notifyListeners()
  })
  // client.on("message-received", (message: QNCustomMessage) => {
  //   //
  //   return notifyListeners()
  // })
  // client.on(
  //   "direct-livestreaming-state-changed",
  //   (streamID: string, state: QNLiveStreamingState) => {
  //     //
  //   }
  // )
  // client.on(
  //   "media-relay-state-changed",
  //   (roomName: string, state: QNMediaRelayState) => {
  //     //
  //   }
  // )
  // client.on(
  //   "transcoding-livestreaming-state-changed",
  //   (streamID: string, state: QNLiveStreamingState) => {
  //     //
  //     return notifyListeners()
  //   }
  // )
  // client.on("volume-indicator", (volumes: QNVolumeIndicator) => {
  //   //
  //   return notifyListeners()
  // })

  // timing
  const finishTime = Date.now()
  store.dispatch(success({ message: `loaded! (${finishTime - startTime} ms)` }))
}
