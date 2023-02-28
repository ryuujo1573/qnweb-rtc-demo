import {
  QNLocalTrack,
  QNRemoteTrack,
  QNTrack,
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
  queryRemoteTracks(ids: string[]) {
    const result = []
    for (const id of ids) {
      const track = this.remoteTracks.get(id)
      if (track) {
        result.push(track)
      }
    }
    return result
  },
  get allTracks() {
    return Array.of<QNTrack>(
      ...this.localTracks.values(),
      ...this.remoteTracks.values()
    )
  },
}

export default refStore
