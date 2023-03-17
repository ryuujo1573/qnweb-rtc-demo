import {
  QNTrack,
  QNLocalTrack,
  QNLocalAudioTrack,
  QNRemoteTrack,
  QNRemoteAudioTrack,
  QNLocalVideoTrack,
  QNRemoteVideoTrack,
} from 'qnweb-rtc'

export function isAudioTrack<T extends QNTrack | undefined | null>(
  track: T
): track is T extends QNLocalTrack
  ? QNLocalAudioTrack
  : T extends QNRemoteTrack
  ? QNRemoteAudioTrack
  : any {
  return !!track?.isAudio()
}

export function isVideoTrack<T extends QNTrack | undefined | null>(
  track: T
): track is T extends QNLocalTrack
  ? QNLocalVideoTrack
  : T extends QNRemoteTrack
  ? QNRemoteVideoTrack
  : any {
  return !!track?.isVideo()
}
