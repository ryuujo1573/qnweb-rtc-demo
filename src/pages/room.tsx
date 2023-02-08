import { CallEndRounded, ContentCopyRounded, FlipRounded } from "@mui/icons-material"
import { Box, Button, IconButton, ToggleButton, Typography, useTheme } from "@mui/material"
import QNRTC, { QNConnectionDisconnectedInfo, QNConnectionState } from "qnweb-rtc"
import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { client } from "../api"
import { updateState } from "../features/webrtcSlice"
import { useAppDispatch, useAppSelector } from "../store"
import { checkRoomId } from "../utils"

export default function RoomPage() {
  const { roomId } = useParams()
  const navigation = useNavigate()
  const theme = useTheme()

  const dispatch = useAppDispatch()
  const webrtcState = useAppSelector(s => s.webrtc)
  const tracksPromise = useMemo(() => QNRTC.createMicrophoneAndCameraTracks(), [])

  const [state, _setState] = useState({
    mirror: false,
  })
  const setState = (changes: Partial<typeof state>) => {
    _setState({
      ...state,
      ...changes,
    })
  }

  useEffect(() => {
    if (!roomId || !checkRoomId(roomId)) {
      return navigation(-1)
    }

    // TODO: SDK auto typing.
    const stateChangedHandler = (state: QNConnectionState, info?: QNConnectionDisconnectedInfo) => {
      dispatch(updateState(state))

      info && console.log(info)
    }
    client.addListener('connection-state-changed', stateChangedHandler)

    // init tracks
    const startConnection = async () => {
      const appId = "d8lk7l4ed"
      const roomToken = await (await fetch(`https://api-demo.qnsdk.com/v1/rtc/token/admin/app/${appId}/room/test/user/admin?bundleId=demo-rtc.qnsdk.com`)).text()
      console.log(roomToken);

      const userId = 'admin'
      await client.join(roomToken, userId)

      // const sessionToken = await fetch(`https://rtc.qiniuapi.com/v3/apps/${appId}/rooms/test/auth?user=${userId}&token=${roomToken}`
      const [audioTrack, videoTrack] = await tracksPromise

      client.publish(videoTrack)
      videoTrack.play(document.getElementById('videoBox')!)
    }

    startConnection()
    return () => {
      client.removeListener('connection-state-changed', stateChangedHandler)
    }
  }, [roomId])

  const handleCopyInvitation = () => {
    navigator.clipboard.writeText(window.location.href)
  }

  const handleExit = () => {
    client.leave().then(async () => {
      const tracks = await tracksPromise
      tracks.forEach(t => t.destroy())
      // navigation(-1)
    })
  }

  useEffect(() => {
    // (async () => {
    //   const [audioTrack, videoTrack] = await tracksPromise
    //   videoTrack.??
    // })()
    const box = document.getElementById('videoBox')!
    box.classList.toggle('mirror')
  }, [state.mirror])

  return <>
    <Box component='aside' sx={{
      position: 'fixed',
      margin: '1ch',
      padding: '1ch',
      maxWidth: '90%',
      backgroundColor: '#eeeeee20',
    }}
    >
      <Typography variant='body1'>房间: {roomId}
        <IconButton onClick={handleCopyInvitation}><ContentCopyRounded /></IconButton>
      </Typography>
    </Box>
    <main>
      <Box id="videoBox" sx={{

      }} />
      <ToggleButton value={true} selected={state.mirror} onChange={() => {
        setState({ mirror: !state.mirror })
      }}><FlipRounded /></ToggleButton>
      <Button variant="contained" color='error' onClick={handleExit}><CallEndRounded /></Button>
    </main>
    <footer><Typography variant="body2">room: <b>{roomId}</b>, state: <b>{webrtcState.connectionState}</b></Typography></footer>
  </>
}