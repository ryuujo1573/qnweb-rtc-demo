import { Box } from '@mui/material'
import { CSSProperties } from '@mui/material/styles/createMixins'
import {
  QNLocalAudioTrack,
  QNLocalTrack,
  QNRemoteAudioTrack,
  QNRemoteTrack,
} from 'qnweb-rtc'
import { useEffect, useRef, useState } from 'react'
import { Client } from '../api'

export interface VideoBoxProps {
  videoTrack: QNRemoteTrack | QNLocalTrack | undefined
  audioTracks?: (QNRemoteAudioTrack | QNLocalAudioTrack)[]
  height?: CSSProperties['height']
  width?: CSSProperties['width']
  className?: string
  // mirror?: boolean
}

export default function VideoBox({
  videoTrack: propTrack,
  audioTracks,
  className,
  // mirror,
  ...size
}: VideoBoxProps) {
  const boxRef = useRef<HTMLDivElement>()

  const [videoTrack, setVideoTrack] = useState(propTrack)

  useEffect(() => {
    console.log('playEffect', boxRef.current)
    if (boxRef.current == undefined || !videoTrack) return

    // if it's remote track
    if ('isSubscribed' in videoTrack) {
      console.log('remoteTrack', videoTrack.isSubscribed())
      if (videoTrack.isSubscribed()) {
        videoTrack.play(boxRef.current, { mirror: false })
      } else {
        // subscribe and set returned track
        // The only track returned is subscribed, playable
        Client.subscribe(videoTrack).then(({ videoTracks }) => {
          const newTrack = videoTracks.pop()
          setVideoTrack(newTrack)
        })
      }
    } else {
      videoTrack.play(boxRef.current, { mirror: false })
    }
    if (audioTracks) {
      const unsubscribedTracks = audioTracks.filter(
        (t): t is QNRemoteAudioTrack => 'isSubscribed' in t && !t.isSubscribed()
      )
      // make sure to subscribe before play
      if (unsubscribedTracks.length) {
        Client.subscribe(...unsubscribedTracks).then(({ audioTracks }) => {
          audioTracks.forEach((t) => t.play(boxRef.current!))
        })
      }
      // play the rest tracks
      audioTracks
        .filter(
          (t) =>
            unsubscribedTracks.findIndex((ut) => ut.trackID == t.trackID) != -1
        )
        .forEach((t) => t.play(boxRef.current!))
    }
    // }, [boxRef.current, mirror])
  }, [boxRef.current, videoTrack, audioTracks])

  return (
    <Box
      className={className}
      ref={boxRef}
      bgcolor={'black'}
      sx={{
        height: '180px',
        width: '240px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&>*': {
          position: 'absolute',
        },
        ...size,
      }}
    ></Box>
  )
}
