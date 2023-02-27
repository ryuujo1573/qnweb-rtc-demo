import { Box } from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import { VideoPlayer } from '../components'

import { checkRoomId } from '../utils'

export default function LiveRoomPage() {
  const navigate = useNavigate()
  const { liveId } = useParams()
  if (!liveId || !checkRoomId(liveId)) {
    navigate('/')
  }

  const src = `https://pili-hls.qnsdk.com/sdk-live/${liveId!}.m3u8`
  // const src = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
  // console.log(src)

  return (
    <>
      <Box
        component="main"
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <VideoPlayer src={src} autoPlay />
      </Box>
    </>
  )
}
