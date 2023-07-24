import { Box } from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import { HlsPlayer } from '../components'

import { checkRoomId, getRandomId } from '../utils'
import { fetchToken, listUsers } from '../api'
import { useAppDispatch } from '../store'
import { useEffect, useState } from 'react'
import { joinRoom, setLivemode } from '../features/roomSlice'
import { message } from '../features/messageSlice'
import { useIdentityState, useSettings } from '../utils/hooks'

export default function LiveRoomPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { liveId } = useParams()
  const { appId } = useSettings()
  const { userId } = useIdentityState()
  if (!liveId || !checkRoomId(liveId)) {
    navigate('/')
    return <></>
  }

  const [src, setSrc] = useState<string>()
  // const src = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'

  const [shouldJoinRoom] = useState(false)

  useEffect(() => {
    if (shouldJoinRoom) {
      dispatch(setLivemode(true))
      fetchToken({
        roomId: liveId,
        appId,
        userId: userId ?? `anonymous_${getRandomId()}`,
      }).then((token) => {
        dispatch(joinRoom(token))
      })
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
        {src && <HlsPlayer src={src} autoPlay />}
      </Box>
    </>
  )
}
