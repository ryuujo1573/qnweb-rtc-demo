import { Box } from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import { VideoPlayer } from '../components'

import { checkRoomId } from '../utils'
import { listUsers } from '../api'
import { useAppDispatch, useAppSelector } from '../store'
import { useEffect, useState } from 'react'
import { joinRoom, setLivemode } from '../features/webrtcSlice'
import { message } from '../features/messageSlice'

export default function LiveRoomPage() {
  const navigate = useNavigate()
  const { liveId } = useParams()
  const dispatch = useAppDispatch()
  const { appId } = useAppSelector((s) => s.settings)
  if (!liveId || !checkRoomId(liveId)) {
    navigate('/')
    return <></>
  }

  const [src, setSrc] = useState<string>()
  // const src = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'

  const [shouldJoinRoom] = useState(false)

  useEffect(() => {
    if (shouldJoinRoom) {
      dispatch(setLivemode(false))
      dispatch(joinRoom(liveId))
    }
    listUsers({ appId, roomId: liveId! }).then((users) => {
      if (users.length == 0) {
        dispatch(message({ message: '加入直播房间失败，房间为空。' }))
        navigate('/')
      } else {
        setSrc(`https://pili-hls.qnsdk.com/sdk-live/${liveId!}.m3u8`)
      }
    })

    return () => {}
  }, [])

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
        {src && <VideoPlayer src={src} autoPlay />}
      </Box>
    </>
  )
}
