import { FlipRounded, PlayArrowRounded } from '@mui/icons-material'
import {
  Box,
  IconButton,
  ToggleButton,
  Typography,
  useTheme,
} from '@mui/material'
import { grey } from '@mui/material/colors'
import QNRTC, { QNLocalVideoTrack } from 'qnweb-rtc'
import { useEffect, useRef, useState } from 'react'

export interface VideoPreviewProps {
  autoplay?: boolean
}

const VideoPreview = ({ autoplay }: VideoPreviewProps) => {
  const [mirror, setMirror] = useState(true)

  const boxRef = useRef<HTMLDivElement>()
  const [track, setTrack] = useState<QNLocalVideoTrack>()

  const shouldPlay = autoplay || track != undefined
  const theme = useTheme()

  useEffect(() => {
    console.log('## recreate')
    QNRTC.createCameraVideoTrack().then(setTrack)
  }, [])

  useEffect(() => {
    if (boxRef.current) {
      if (track) {
        track.play(boxRef.current, { mirror: false })
        return () => {
          track.destroy()
        }
      }
    }
  }, [boxRef.current, track])

  return (
    <>
      <Box
        {...(mirror ? { className: 'mirror' } : undefined)}
        ref={boxRef}
        sx={{
          position: 'relative',
          width: '280px',
          height: '180px',
          display: 'flex',
          background: grey[400],
        }}
      >
        <Typography
          variant="body2"
          sx={{
            position: 'absolute',
            bottom: 'calc(-1rem - 5px)',
          }}
        >
          {track?.getMediaStreamTrack()?.label}
        </Typography>
        {shouldPlay ? undefined : (
          <IconButton onClick={() => {}} sx={{ margin: 'auto' }}>
            <PlayArrowRounded />
          </IconButton>
        )}
      </Box>
      <ToggleButton
        value={true}
        selected={mirror}
        onChange={() => {
          setMirror(!mirror)
        }}
      >
        <FlipRounded />
      </ToggleButton>
    </>
  )
}

export default VideoPreview
