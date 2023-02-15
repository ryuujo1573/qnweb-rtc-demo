import { VideocamOffOutlined } from '@mui/icons-material'
import { Box } from '@mui/material'
import { CSSProperties } from '@mui/material/styles/createMixins'
import {
  QNLocalAudioTrack,
  QNLocalTrack,
  QNRemoteAudioTrack,
  QNRemoteTrack,
} from 'qnweb-rtc'
import { createRef, useEffect, useSyncExternalStore } from 'react'
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
  videoTrack,
  audioTracks,
  className,
  // mirror,
  ...size
}: VideoBoxProps) {
  const boxRef = createRef<HTMLDivElement>()

  useEffect(() => {
    console.log('play? ', boxRef.current)
    if (!boxRef.current || !videoTrack) return

    if ('isSubscribed' in videoTrack) {
      if (videoTrack.isSubscribed()) {
        // videoTrack.play(boxRef.current, { mirror })
        videoTrack.play(boxRef.current, { mirror: false })
      }
    } else {
      // videoTrack.play(boxRef.current, { mirror })
      videoTrack.play(boxRef.current, { mirror: false })
    }
    if (audioTracks)
      for (const audioTrack of audioTracks) {
        audioTrack.play(boxRef.current, { mirror: false })
      }
    // }, [boxRef.current, mirror])
  }, [boxRef.current])

  return (
    <Box
      className={className}
      ref={boxRef}
      bgcolor={'Background'}
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
