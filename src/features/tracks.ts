import {
  QNLocalTrack,
  QNRemoteTrack,
  QNConnectionState as QState,
  QNRemoteAudioTrack,
  QNRemoteVideoTrack,
} from 'qnweb-rtc'

export interface RemoteUser {
  userID: string
  userData?: string
  state: QState
  trackIds: string[]
}

const refStore = {
  localTracks: new Map<string, QNLocalTrack>(),
  remoteTracks: new Map<string, QNRemoteTrack>(),
  *matchLocalTracks(...ids: (string | undefined)[]) {
    for (const id of ids) {
      if (id) {
        yield this.localTracks.get(id)
      } else {
        yield undefined
      }
    }
  },
  queryRemoteTracks(ids: string[]) {
    const result = []
    for (const [id, track] of this.remoteTracks) {
      if (ids.includes(id)) {
        result.push(track)
      }
    }
    return result
  },
  *matchRemoteTracks(...ids: (string | undefined)[]) {
    for (const id of ids) {
      if (id) {
        yield this.remoteTracks.get(id)
      }
    }
  },
  get allTracks() {
    return Array.of<QNLocalTrack | QNRemoteTrack>(
      ...this.localTracks.values(),
      ...this.remoteTracks.values()
    )
  },
}

export default refStore
