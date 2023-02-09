import { CallEndRounded, CallRounded, ContentCopyRounded, FlipRounded } from "@mui/icons-material"
import { Box, Button, IconButton, ToggleButton, Typography, useTheme } from "@mui/material"
import QNRTC, { QNConnectionDisconnectedInfo, QNConnectionState } from "qnweb-rtc"
import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { client } from "../api"
import { success } from "../features/messageSlice"
import { toggleMirror, updateState } from "../features/webrtcSlice"
import { useAppDispatch, useAppSelector } from "../store"
import { checkRoomId } from "../utils"

const log = console.log

export default function RoomPage() {
  log(';render')
  const { roomId } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()

  const boxRef = useRef<HTMLDivElement>(null)

  const dispatch = useAppDispatch()
  const {
    connectionState, facingMode, device, mirror
  } = useAppSelector(s => s.webrtc)

  const { nickname, auth } = useAppSelector(s => s.identity)
  const { appId } = useAppSelector(s => s.settings)

  // this takes 150ms+, cache for performance.
  const tracksPromise = useMemo(() => QNRTC.createMicrophoneAndCameraTracks(), [])
  // const tracksPromise = QNRTC.createMicrophoneAndCameraTracks()
  const roomTokenPromise = useMemo(
    () => fetch(`https://api-demo.qnsdk.com/v1/rtc/token/admin/app/${appId}/room/${roomId}/user/${nickname}?bundleId=demo-rtc.qnsdk.com`)
      .then(resp => resp.text()),
    [appId, roomId, nickname]
  )

  const startConnection = async () => {
    log(';startConnection')
    const roomToken = await roomTokenPromise
    // Given the same name & id, it'll take < 0.02ms.

    const [audioTrack, videoTrack] = await tracksPromise

    await client.join(roomToken)
    await client.publish(videoTrack)

    dispatch(success({ message: '成功加入房间' }))
  }

  const stopConnection = async () => {
    log(';stopConnection')
    await client.leave().then(() => {
      log(';stopConnection | leaved')
    })
  }

  useEffect(() => {
    log(';roomId useEffect:', roomId)
    if (!roomId || !checkRoomId(roomId) || !nickname) {
      return navigate(-1)
    }

    const promise = startConnection()

    return () => {
      log(';roomId clearEffect:', roomId)
      promise.then(stopConnection).finally(async () => {
        const tracks = await tracksPromise
        tracks.forEach(t => t.destroy())
      })
    }
  }, [])

  const handleCopyInvitation = () => {
    navigator.clipboard.writeText(window.location.href)
  }

  const promises = useRef<Promise<unknown>[]>([])
  const handleCallButton = (connected: boolean) => async () => {
    // connected ? *DISCONNECT* : *CONNECT*
    await Promise.all(promises.current)
    promises.current = [
      !connected ? startConnection() : stopConnection()
    ]
  }

  tracksPromise.then(([audioTrack, videoTrack]) => {
    log('box:', boxRef.current)
    videoTrack.play(boxRef.current!, { mirror })
  })

  return <>
    <Box component='aside' sx={{
      position: 'fixed',
      margin: '1ch',
      padding: '1ch',
      maxWidth: '90%',
      backgroundColor: '#eeeeee20',
    }}
    >
      <Typography variant='caption' sx={{
        display: 'flex',
        alignItems: 'center',
      }}>
        <b>房间:&nbsp;</b>{roomId}
        <Typography color={theme.palette.secondary.main} pl='1ch' fontWeight={700}>
          {connectionState}
        </Typography>
        <IconButton onClick={handleCopyInvitation} sx={{
          marginLeft: 'auto'
        }}><ContentCopyRounded /></IconButton>
      </Typography>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        columnGap: 1,
      }}>
        {...Object.entries({
          '视频丢包率': '114514',
          '音频丢包率': '0.00 %',
          '屏幕分享丢包率': '0.00 %',
          '视频实时码率': '459.19 kbps',
          '音频实时码率': '22.11 kbps',
          '屏幕分享实时码率': '0.00 kbps',
        }).map(([k, v], i) => <>
          <Typography key={`k${i}`} variant="body2" align="right" sx={{
            fontWeight: 700,
          }}>{k}</Typography>
          <Typography key={`v${i}`} variant="body2" align="left">{v}</Typography>
        </>)}
      </Box>
    </Box>
    <main>
      <Box id="videoBox" ref={boxRef} sx={{
        zIndex: -1,
      }} />
    </main>
    <footer>
      <ToolBar />
    </footer>
  </>

  function ToolBar() {
    const connected = connectionState == QNConnectionState.CONNECTED
    return <Box sx={{
      position: 'fixed',
      bottom: '1ch'
    }}>
      <ToggleButton value={true} selected={mirror} onChange={() => {
        dispatch(toggleMirror(!mirror))
      }}><FlipRounded /></ToggleButton>
      <Button
        variant="contained"
        color={connected ? 'error' : 'success'}
        onClick={handleCallButton(connected)}
        disabled={connectionState == QNConnectionState.CONNECTING}
      >
        {connected ? <CallEndRounded key='CallEndRounded' /> : <CallRounded key='CallRounded' />}
      </Button>
    </Box>
  }
}