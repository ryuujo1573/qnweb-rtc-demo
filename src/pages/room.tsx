import { CallEndRounded, CallRounded, VideocamRounded } from "@mui/icons-material"
import { Box, Button, IconButton, useTheme } from "@mui/material"
import QNRTC, { QNConnectionState } from "qnweb-rtc"
import { MouseEventHandler, useEffect, useMemo, useRef, useSyncExternalStore } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { client, QNExternalStore } from "../api"
import { DetailPanel, VideoPreviewRemote } from "../components"
import { success } from "../features/messageSlice"
import { useAppDispatch, useAppSelector } from "../store"
import { checkRoomId } from "../utils"

const verbose = console.log

export default function RoomPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()

  const boxRef = useRef<HTMLDivElement>(null)

  const dispatch = useAppDispatch()
  const {
    facingMode, device, mirror
  } = useAppSelector(s => s.webrtc)

  const { nickname, auth } = useAppSelector(s => s.identity)
  const { appId } = useAppSelector(s => s.settings)

  const { pinnedVisualTrack, roomMembers, connectionState } =
    useSyncExternalStore(QNExternalStore.subscribe, QNExternalStore.getSnapshot)

  // this takes 150ms+, cache for performance.
  const tracksPromise = useMemo(() => QNRTC.createMicrophoneAndCameraTracks(), [])
  // const tracksPromise = QNRTC.createMicrophoneAndCameraTracks()
  const roomTokenPromise = useMemo(
    () => fetch(`https://api-demo.qnsdk.com/v1/rtc/token/admin/app/${appId}/room/${roomId}/user/${nickname}?bundleId=demo-rtc.qnsdk.com`)
      .then(resp => resp.text()),
    [appId, roomId, nickname]
  )

  const startConnection = async () => {
    verbose(';startConnection')
    const roomToken = await roomTokenPromise
    // Given the same name & id, it'll take < 0.02ms.

    const [audioTrack, videoTrack] = await tracksPromise

    await client.join(roomToken)
    await client.publish(videoTrack)

    dispatch(success({ message: '成功加入房间' }))
    console.timeEnd('useEffect')
  }

  const stopConnection = async () => {
    verbose(';stopConnection')
    await client.leave().then(() => {
      verbose(';stopConnection | leaved')
    })
  }

  useEffect(() => {
    verbose(';useEffect:', roomId)
    console.time('useEffect')
    if (!roomId || !checkRoomId(roomId) || !nickname) {
      return navigate(-1)
    }

    const promise = startConnection()

    return () => {
      verbose(';clearEffect:', roomId)
      console.time('clearEffect')
      promise.then(stopConnection).finally(async () => {
        const tracks = await tracksPromise
        tracks.forEach(t => t.destroy())
        console.timeEnd('clearEffect')
      })
    }
  }, [roomId])

  const onCallButtonClick: MouseEventHandler<HTMLButtonElement> = (evt) => {
    if (connectionState == QNConnectionState.CONNECTED) {
      stopConnection()
      const modKey = /Mac|iPhone|iPad/.test(navigator.userAgent) ? 'metaKey' : 'ctrlKey'
      // if click whilst holding ctrl/cmd key,
      // the page won't navigate on dev purpose.
      if (!evt[modKey]) {
        navigate(-1)
      }
    } else if (connectionState == QNConnectionState.DISCONNECTED) {
      startConnection()
    }
  }

  useEffect(() => {
    tracksPromise.then(([audioTrack, videoTrack]) => {
      videoTrack.play(boxRef.current!, { mirror })
      verbose(';play videoTrack')
    })
  }, [mirror])

  return (
    <>
      <DetailPanel roomId={roomId!} connectionState={connectionState} />
      <header>
        <Box
          sx={{
            display: 'flex',
            position: 'fixed',
            zIndex: 0,
            top: '0',
            width: '100%',
            bgcolor: '#aaaaaa10',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {roomMembers.map((user) => {
            return <VideoPreviewRemote key={user.userID} track={user.getVideoTracks()[0]} />
          })}
        </Box>
      </header>
      <main>
        <Box
          id="videoBox"
          ref={boxRef}
          sx={{
            zIndex: -1,
          }}
        />
      </main>
      <footer>
        <ToolBar />
      </footer>
    </>
  )

  function ToolBar() {
    const connected = connectionState == QNConnectionState.CONNECTED
    return <Box sx={{
      position: 'fixed',
      bottom: '1ch'
    }}>
      <Button
        variant="contained"
        color={connected ? 'error' : 'success'}
        onClick={onCallButtonClick}
        disabled={connectionState == QNConnectionState.CONNECTING}
      >
        {connected ? <CallEndRounded key='CallEndRounded' /> : <CallRounded key='CallRounded' />}
      </Button>
      <IconButton>
        <VideocamRounded />
      </IconButton>
    </Box>
  }
}