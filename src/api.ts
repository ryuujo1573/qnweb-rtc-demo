import {
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
  QNLocalTrack,
  QNLocalAudioTrack,
  QNRTCClient,
} from 'qnweb-rtc'
import api from 'qnweb-rtc'
import { success, warning } from './features/messageSlice'
import { store } from './store'

const startTime = Date.now()
const client = api.createClient()

export async function getRoomToken(roomId: string, userId: string) {
  const appId = store.getState().settings.appId

  return fetch(
    `https://api-demo.qnsdk.com/v1/rtc/token/admin/app/${appId}/room/${roomId}/user/${userId}?bundleId=demo-rtc.qnsdk.com`
  ).then((resp) => resp.text())
}

// designed for integration of React Hooks
export namespace Client {
  // typings
  export type QNExternalStore = {
    localTracks: QNLocalTrack[]
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

  export function register(listener: Callback) {
    listeners = [...listeners, listener]
    return function cleanup() {
      listeners = listeners.filter((v) => listener !== v)
    }
  }

  const counter: {
    [key: string]: number
  } = {
    total: 0,
  }

  export function notifyListeners(who?: string) {
    if (who) {
      counter[who] = counter[who] ?? 0
      counter[who]++
      counter.total++
      console.log(
        `%c[${counter.total}] %cupdate %c${who} %c(${counter[who]})`,
        'color: grey;',
        'color: inherit;',
        'color: blue;',
        'color: red;'
      )
    }
    for (const listener of listeners) {
      listener()
    }
  }

  export async function connect(roomToken: string) {
    try {
      qnStore.connectionState = QNConnectionState.CONNECTING
      notifyListeners('startConect')
      await client.join(roomToken)
    } catch (e: any) {
      store.dispatch(warning({ message: e.error }))
      return notifyListeners('no-connect')
    }
    store.dispatch(success({ message: '成功加入房间' }))
    return notifyListeners('connected')
  }

  export async function disconnect() {
    await client.leave()
    console.log(';stopConnection | leaved')
    return notifyListeners('disconnected')
  }

  export async function publish(...args: Parameters<QNRTCClient['publish']>) {
    await client.publish(...args)
    return notifyListeners('publish')
  }

  export async function unpublish(
    ...args: Parameters<QNRTCClient['unpublish']>
  ) {
    await client.unpublish(...args)
    notifyListeners('unpublish')
  }

  export async function subscribe(
    ...args: Parameters<QNRTCClient['subscribe']>
  ) {
    await client.subscribe(...args)
    notifyListeners('subscribe')
  }

  export async function unsubscribe(
    ...args: Parameters<QNRTCClient['unsubscribe']>
  ) {
    await client.unsubscribe(...args)
    notifyListeners('unsubscribe')
  }

  // variables
  let qnStore: QNExternalStore = {
    localTracks: [],
    roomMembers: [],
    // publishedTracks: [],
    // subscriptions: [],
    connectionState: QNConnectionState.DISCONNECTED,
  }

  let listeners: Callback[] = []

  // bindings
  initialize().then(() => {
    // timing
    const finishTime = Date.now()
    store.dispatch(
      success({ message: `loaded! (${finishTime - startTime} ms)` })
    )
  })
  async function initialize() {
    qnStore.localTracks = [
      ...qnStore.localTracks,
      ...(await api.createMicrophoneAndCameraTracks()),
    ]
    notifyListeners('initialize')

    client.addListener(
      'user-joined',
      (_remoteUserID: string, _userData?: string) => {
        // qnStore.roomMembers.push(remoteUserID)
        qnStore.roomMembers = [...client.remoteUsers]
        return notifyListeners('e: user-joined')
      }
    )
    client.addListener('user-left', (_remoteUserID: string) => {
      // qnStore.roomMembers = qnStore.roomMembers.filter((id) => remoteUserID != id)
      qnStore.roomMembers = [...client.remoteUsers]
      return notifyListeners('e: user-left')
    })
    client.addListener(
      'user-published',
      async (
        _userID: string,
        qntracks: (QNRemoteAudioTrack | QNRemoteVideoTrack)[]
      ) => {
        // possible vulnurability: remote track ID == undefined deliberately
        // qnStore.publishedTracks = [...qnStore.publishedTracks, ...qntracks]
        // client.subscribe(qntracks)
        qnStore.roomMembers = [...client.remoteUsers]
        await client.subscribe(qntracks)
        return notifyListeners('e: user-published')
      }
    )
    client.addListener(
      'user-unpublished',
      async (
        _userID: string,
        qntracks: (QNRemoteAudioTrack | QNRemoteVideoTrack)[]
      ) => {
        // // there'd always be a trackID on remote tracks.
        // const trackIds = qntrack.map((track) => track.trackID!)
        // qnStore.publishedTracks = qnStore.publishedTracks.filter((t) =>
        //   trackIds.includes(t.trackID!)
        // )
        qnStore.roomMembers = [...client.remoteUsers]
        await client.unsubscribe(qntracks)
        return notifyListeners('e: user-unpublished')
      }
    )
    client.addListener(
      'connection-state-changed',
      (state: QNConnectionState, info?: QNConnectionDisconnectedInfo) => {
        info && console.log('disconnected:', info)
        qnStore.connectionState = state
        console.log('connection-state-changed', state)
        return notifyListeners('e: connection-state-changed')
      }
    )
    client.addListener('user-reconnecting', (remoteUserID: string) => {
      // console.log('[event user-reconnecting]', remoteUserID)
      return notifyListeners('e: user-reconnecting')
    })
    client.addListener('user-reconnected', (remoteUserID: string) => {
      // console.log('[event user-reconnected]', remoteUserID)
      return notifyListeners('e: user-reconnected')
    })
    // client.addListener("message-received", (message: QNCustomMessage) => {
    //   //
    //   return notifyListeners()
    // })
    // client.addListener(
    //   "direct-livestreaming-state-changed",
    //   (streamID: string, state: QNLiveStreamingState) => {
    //     //
    //   }
    // )
    // client.addListener(
    //   "media-relay-state-changed",
    //   (roomName: string, state: QNMediaRelayState) => {
    //     //
    //   }
    // )
    // client.addListener(
    //   "transcoding-livestreaming-state-changed",
    //   (streamID: string, state: QNLiveStreamingState) => {
    //     //
    //     return notifyListeners()
    //   }
    // )
    // client.addListener("volume-indicator", (volumes: QNVolumeIndicator) => {
    //   //
    //   return notifyListeners()
    // })
  }
}
