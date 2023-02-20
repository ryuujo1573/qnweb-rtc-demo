import api from 'qnweb-rtc'

export const client = api.createClient()

// designed for integration of React Hooks
// export namespace Client {
//   // typings
//   export type QNExternalStore = {
//     localTracks: QNLocalTrack[]
//     pinnedVisualTrack?: QNRemoteVideoTrack | QNLocalVideoTrack
//     roomMembers: QNRemoteUser[]
//     playbackDevices: MediaDeviceInfo[]
//     publishedTracks: QNLocalTrack[]
//     subscriptions: {
//       videoTracks: QNRemoteVideoTrack[]
//       audioTracks: QNRemoteAudioTrack[]
//     }
//     connectionState: QNConnectionState
//   }

//   export type Callback = () => void

//   // variables
//   let qnStore: QNExternalStore = {
//     localTracks: [],
//     roomMembers: [],
//     playbackDevices: [],
//     publishedTracks: [],
//     subscriptions: {
//       videoTracks: [],
//       audioTracks: [],
//     },
//     connectionState: QNConnectionState.DISCONNECTED,
//   }

//   let listeners: Callback[] = []

//   // function interfaces
//   export function getSnapshot() {
//     return qnStore
//   }

//   export function register(listener: Callback) {
//     listeners = [...listeners, listener]
//     return function cleanup() {
//       listeners = listeners.filter((v) => listener !== v)
//     }
//   }

//   const counter: {
//     [key: string]: number
//   } = {
//     total: 0,
//   }

//   function setState(newState: Partial<QNExternalStore>) {
//     qnStore = {
//       ...qnStore,
//       ...newState,
//     }

//     notifyListeners()
//     return (who: string) => {
//       counter[who] = counter[who] ?? 0
//       counter[who]++
//       counter.total++
//       console.log(
//         `%c[${counter.total}] %cupdate %c${who} %c(${counter[who]})`,
//         'color: grey;',
//         'color: inherit;',
//         'color: blue;',
//         'color: red;'
//       )
//     }
//   }

//   export function notifyListeners() {
//     for (const listener of listeners) {
//       listener()
//     }
//   }

//   export function setPlayback(device: MediaDeviceInfo) {}

//   export async function publish(...tracks: QNLocalTrack[]) {
//     try {
//       await client.publish(tracks)
//     } catch (e) {
//       console.error(e)
//       return
//     }
//     setState({
//       publishedTracks: [...qnStore.publishedTracks, ...tracks],
//     })('publish')
//     return
//   }

//   export async function unpublish(...tracks: QNLocalTrack[]) {
//     await client.unpublish(tracks)
//     const removingIds = tracks.map((t) => t.trackID)
//     qnStore.publishedTracks = qnStore.publishedTracks.filter((track) =>
//       removingIds.includes(track.trackID)
//     )
//     return setState({})('unpublish')
//   }

//   let limit = 0
//   export async function subscribe(...tracks: QNRemoteTrack[]) {
//     debugger
//     const result = await client.subscribe(tracks)
//     const { videoTracks, audioTracks } = result
//     if (videoTracks.length || audioTracks.length) {
//       setState({})('subscribe')
//     }
//     return result
//   }

//   export async function unsubscribe(...tracks: QNRemoteTrack[]) {
//     await client.unsubscribe(tracks)
//     const allId = tracks.map((t) => t.trackID!).sort()
//     const index = allId.findIndex((s) => s.startsWith('v'))

//     const audioIds = allId.splice(0, index - 0)
//     const videoIds = allId
//     console.log('vid:', videoIds, 'aid:', audioIds)

//     qnStore.subscriptions.videoTracks =
//       qnStore.subscriptions.videoTracks.filter(
//         (t) => t.trackID && videoIds.includes(t.trackID)
//       )
//     qnStore.subscriptions.audioTracks =
//       qnStore.subscriptions.audioTracks.filter(
//         (t) => t.trackID && audioIds.includes(t.trackID)
//       )
//     setState({})('unsubscribe')
//   }

//   export async function livestream(config: QNDirectLiveStreamingConfig) {
//     await client.startDirectLiveStreaming(config)
//   }

//   let lastCallback: () => void
//   export function setPinnedVisualTrack(
//     track: QNLocalVideoTrack | QNRemoteVideoTrack | undefined,
//     callback?: () => void
//   ) {
//     if (lastCallback) lastCallback()
//     // startTransition(() =>
//     setState({ pinnedVisualTrack: track })('setPinnedVisualTrack')
//     // })
//     if (callback) lastCallback = callback
//   }

//   // bindings

//   export async function _initialize() {
//     // await api.createMicrophoneAndCameraTracks()
//     setState({
//       localTracks: [],
//     })('initialize')

//     const updatePlaybackDevices = () =>
//       api.getPlaybackDevices().then((devices) => {
//         qnStore.playbackDevices = devices
//       })
//     await updatePlaybackDevices()
//     api.onPlaybackDeviceChanged = () => updatePlaybackDevices()

//     console.time('addListener')
//     client.addListener(
//       'user-joined',
//       (_remoteUserID: string, _userData?: string) => {
//         // qnStore.roomMembers.push(remoteUserID)

//         return setState({ roomMembers: client.remoteUsers })('e: user-joined')
//       }
//     )
//     client.addListener('user-left', (_remoteUserID: string) => {
//       // qnStore.roomMembers = qnStore.roomMembers.filter((id) => remoteUserID != id)
//       return setState({ roomMembers: client.remoteUsers })('e: user-left')
//     })
//     client.addListener(
//       'user-published',
//       async (
//         _userID: string,
//         qntracks: (QNRemoteAudioTrack | QNRemoteVideoTrack)[]
//       ) => {
//         // await client.subscribe(qntracks)
//         return setState({ roomMembers: client.remoteUsers })(
//           'e: user-published'
//         )
//       }
//     )

//     client.addListener(
//       'user-unpublished',
//       async (
//         _userID: string,
//         qntracks: (QNRemoteAudioTrack | QNRemoteVideoTrack)[]
//       ) => {
//         await client.unsubscribe(qntracks)
//         return setState({ roomMembers: client.remoteUsers })(
//           'e: user-unpublished'
//         )
//       }
//     )
//     client.addListener(
//       'connection-state-changed',
//       (
//         connectionState: QNConnectionState,
//         info?: QNConnectionDisconnectedInfo
//       ) => {
//         info && console.log('disconnected:', info)
//         console.log('connection-state-changed', connectionState)
//         return setState({ connectionState })('e: connection-state-changed')
//       }
//     )
//     client.addListener('user-reconnecting', (remoteUserID: string) => {
//       // console.log('[event user-reconnecting]', remoteUserID)
//       return setState({ roomMembers: client.remoteUsers })(
//         'e: user-reconnecting'
//       )
//     })
//     client.addListener('user-reconnected', (remoteUserID: string) => {
//       // console.log('[event user-reconnected]', remoteUserID)
//       return setState({ roomMembers: client.remoteUsers })(
//         'e: user-reconnected'
//       )
//     })
//     // client.addListener("message-received", (message: QNCustomMessage) => {
//     //   //
//     //   return notifyListeners()
//     // })
//     // client.addListener(
//     //   "direct-livestreaming-state-changed",
//     //   (streamID: string, state: QNLiveStreamingState) => {
//     //     //
//     //   }
//     // )
//     // client.addListener(
//     //   "media-relay-state-changed",
//     //   (roomName: string, state: QNMediaRelayState) => {
//     //     //
//     //   }
//     // )
//     // client.addListener(
//     //   "transcoding-livestreaming-state-changed",
//     //   (streamID: string, state: QNLiveStreamingState) => {
//     //     //
//     //     return notifyListeners()
//     //   }
//     // )
//     // client.addListener("volume-indicator", (volumes: QNVolumeIndicator) => {
//     //   //
//     //   return notifyListeners()
//     // })
//     console.timeEnd('addListener')
//   }
// }

// Client._initialize().then(() => {
//   // timing
//   const finishTime = Date.now()
//   store.dispatch(success({ message: `loaded! (${finishTime - startTime} ms)` }))
// })
