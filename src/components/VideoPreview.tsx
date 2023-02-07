import { PlayArrowRounded, Stop } from "@mui/icons-material"
import { Box, Grow, IconButton, Link, Typography, useTheme } from "@mui/material"
import { grey } from "@mui/material/colors"
import QNRTC, { QNCameraVideoTrack } from "qnweb-rtc"
import { FC, useEffect, useState } from "react"

export interface VideoPreviewProps {
  autoplay?: boolean,
}

const VideoPreview: FC<VideoPreviewProps> = ({ autoplay }) => {
  const [mirror, setMirror] = useState(true)

  const [currentTrack, setTrack] = useState<QNCameraVideoTrack>()
  const shouldPlay = autoplay || currentTrack != undefined
  const theme = useTheme()

  useEffect(() => {
    if (currentTrack) {
      const div = document.getElementById('videoPreview')!
      currentTrack.play(div, { mirror })
      return () => {
        currentTrack.destroy()
      }
    }
  }, [currentTrack])

  const initTrack = () => {
    QNRTC.createCameraVideoTrack().then(track => {
      setTrack(track)
    })
  }

  return <>
    <Box id='videoPreview' sx={{
      position: 'relative',
      width: '280px',
      height: '180px',
      display: 'flex',
      background: grey[400],
    }}>
      <Typography variant="body2"
        sx={{
          position: "absolute",
          bottom: 'calc(-1rem - 5px)',
        }}
      >{currentTrack?.getMediaStreamTrack()?.label}
      </Typography>
      {shouldPlay ? undefined :
        <IconButton
          onClick={() => initTrack()}
          sx={{ margin: 'auto' }}
        >
          <PlayArrowRounded />
        </IconButton>}
    </Box>
    {shouldPlay ? <Grow appear>
      <Box>
        <IconButton onClick={() => setTrack(undefined)}><Stop /></IconButton>
      </Box>
    </Grow> : undefined}
  </>
}

export default VideoPreview