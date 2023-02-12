import { Box } from '@mui/material'
import { QNRemoteTrack } from 'qnweb-rtc'
import { createRef, useEffect } from 'react'
import { client } from '../api'

export interface VideoPreviewRemoteProps {
  track: QNRemoteTrack
}

export default function VideoPreviewRemote({ track }: VideoPreviewRemoteProps) {
  const boxRef = createRef<HTMLDivElement>()

  useEffect(() => {
    console.log('play!!!!', boxRef.current)
    if (boxRef.current && track.isSubscribed()) track.play(boxRef.current)
  }, [boxRef.current])
  return (
    <Box
      ref={boxRef}
      sx={{
        height: '180px',
        width: '240px',
        position: 'relative',
        "&>*": {
          position: 'absolute',
        }
      }}
    >
      <b>VIDEO</b>
    </Box>
  )
}
