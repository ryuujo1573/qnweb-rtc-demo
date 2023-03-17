import {
  QNCameraVideoTrack,
  QNCustomAudioTrack,
  QNLocalTrack,
  QNMicrophoneAudioTrack,
  QNRemoteTrack,
  QNScreenVideoTrack,
  QNConnectionState as QState,
} from 'qnweb-rtc'
import { WebRTCState } from './webrtcSlice'

export interface RemoteUser {
  userID: string
  userData?: string
  state: QState
  trackIds: string[]
}

const refStore = {
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
      if (id) {
        yield this.localTracksMap.get(id)
      } else {
        yield undefined
      }
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
      if (id) {
        yield this.remoteTracksMap.get(id)
      }
    }
  },
  get allTracks() {
    return Array.of<QNLocalTrack | QNRemoteTrack>(
      ...this.localTracksMap.values(),
      ...this.remoteTracksMap.values()
    )
  },
}

export default refStore
