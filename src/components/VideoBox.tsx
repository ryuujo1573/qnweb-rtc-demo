import { Box, BoxProps, SxProps, Theme } from '@mui/material'
import { CSSProperties } from '@mui/material/styles/createMixins'
import {
  QNLocalAudioTrack,
  QNLocalTrack,
  QNLocalVideoTrack,
  QNRemoteAudioTrack,
  QNRemoteTrack,
  QNRemoteVideoTrack,
} from 'qnweb-rtc'
import { useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { client } from '../api'
import { StageContext } from '../pages/room'

export interface VideoBoxProps extends BoxProps {
  videoTrack: QNRemoteVideoTrack | QNLocalVideoTrack | undefined
  audioTracks?: (QNRemoteAudioTrack | QNLocalAudioTrack)[]
  // mirror?: boolean
}

export default function VideoBox({
  videoTrack,
  audioTracks,
  className,
  sx,
  children,
}: VideoBoxProps) {
  const boxRef = useRef<HTMLDivElement>()
  const {
    boxRef: pinnedBoxRef,
    setTrack: setPinnedTrack,
    track: pinnedTrack,
  } = useContext(StageContext)

  const pinned = videoTrack != undefined && pinnedTrack == videoTrack
  if (pinned) console.log('pinned!', pinnedTrack)

  useEffect(() => {
    // const target = pinned ? pinnedBoxRef.current : boxRef.current
    const target = pinned ? pinnedBoxRef.current : boxRef.current
    console.log('pinned?', pinned, target)
    if (target == undefined || !videoTrack) return

    // if it's remote track
    if ('isSubscribed' in videoTrack) {
      console.log('remoteTrack', videoTrack.isSubscribed())
      if (videoTrack.isSubscribed()) {
        videoTrack.play(target, { mirror: false })
      } else {
        // TODO: subscribe and save returned track
        target.append('not subscribed')
      }
    } else {
      videoTrack.play(target, { mirror: false })
    }

    if (audioTracks) {
      const unsubscribedTracks = audioTracks.filter(
        (t): t is QNRemoteAudioTrack => 'isSubscribed' in t && !t.isSubscribed()
      )
      // make sure to subscribe before play
      if (unsubscribedTracks.length) {
        // Client.subscribe(...unsubscribedTracks).then(({ audioTracks }) => {
        //   audioTracks.forEach((t) => t.play(target!))
        // })
      }
      // play the rest tracks
      audioTracks
        .filter(
          (t) =>
            unsubscribedTracks.findIndex((ut) => ut.trackID == t.trackID) != -1
        )
        .forEach((t) => t.play(target!))
    }
    // }, [target, mirror])
  }, [boxRef.current, videoTrack, audioTracks, pinned])

  return (
    <Box
      className={className}
      ref={boxRef}
      bgcolor={'black'}
      sx={{
        height: '100%',
        width: '100%',
        position: 'relative',
        display: pinned ? 'none' : 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&>*': {
          position: 'absolute',
        },
        ...sx,
      }}
      onDoubleClick={() => {
        if (videoTrack) {
          setPinnedTrack(videoTrack)
        }
      }}
    >
      {children}
    </Box>
  )
}
