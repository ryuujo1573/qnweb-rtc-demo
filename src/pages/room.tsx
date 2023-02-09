import { CallEndRounded, CallRounded, ContentCopyRounded, FlipRounded } from "@mui/icons-material"
import { Box, Button, IconButton, ToggleButton, Typography, useTheme } from "@mui/material"
import QNRTC, { QNConnectionDisconnectedInfo, QNConnectionState, QNLocalTrack } from "qnweb-rtc"
import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { client } from "../api"
import { success } from "../features/messageSlice"
import { toggleMirror, updateState } from "../features/webrtcSlice"
import { useAppDispatch, useAppSelector } from "../store"
import { checkRoomId } from "../utils"

const log = console.log

export default function RoomPage() {
  log("render")
  const { roomId } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()

  const boxRef = useRef<HTMLDivElement>(null)

  const dispatch = useAppDispatch()
  const { connectionState, facingMode, device, mirror } = useAppSelector((s) => s.webrtc)

  const microphoneAndCameraTracks = useRef<QNLocalTrack[]>([])
  const roomToken = useRef("")
  const { nickname, auth } = useAppSelector((s) => s.identity)

  const { appId } = useAppSelector((s) => s.settings)

  const startConnection = async () => {
    log("startConnection")

    await client.join(roomToken.current)
    await client.publish(microphoneAndCameraTracks.current)

    dispatch(success({ message: "成功加入房间" }))
  }

  const stopConnection = async () => {
    log("stopConnection")
    await client.leave()
    log("stopConnection | leaved")
  }

  useEffect(() => {
    (async () => {
      log("roomId useEffect:", roomId)
      if (!roomId || !checkRoomId(roomId) || !nickname) {
        return navigate(-1)
      }

      roomToken.current = await fetch(
        `https://api-demo.qnsdk.com/v1/rtc/token/admin/app/${appId}/room/${roomId}/user/${nickname}?bundleId=demo-rtc.qnsdk.com`
      ).then((resp) => resp.text())

      // this takes 150ms+, cache for performance.
      const tracks = await QNRTC.createMicrophoneAndCameraTracks()
      microphoneAndCameraTracks.current = tracks
      tracks.forEach((track) => track.isVideo() && boxRef.current && track.play(boxRef.current, { mirror }))

      await startConnection()

      return async () => {
        log("roomId clearEffect:", roomId)
        await stopConnection()
        tracks.forEach((track) => track.destroy)
      }
    })()
  }, [])

  useEffect(() => {
    microphoneAndCameraTracks.current && microphoneAndCameraTracks.current.forEach((track) => track.isVideo() && boxRef.current && track.play(boxRef.current, { mirror }))
  }, [mirror])

  const handleCopyInvitation = () => {
    navigator.clipboard.writeText(window.location.href)
  }
  
  const handleCallButton = (connected: boolean) => async () => {
    !connected ? startConnection() : stopConnection()
  }

  return (
    <>
      <Box
        component="aside"
        sx={{
          position: "fixed",
          margin: "1ch",
          padding: "1ch",
          maxWidth: "90%",
          backgroundColor: "#eeeeee20",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <b>房间:&nbsp</b>
          {roomId}
          <Typography color={theme.palette.secondary.main} pl="1ch" fontWeight={700}>
            {connectionState}
          </Typography>
          <IconButton
            onClick={handleCopyInvitation}
            sx={{
              marginLeft: "auto",
            }}
          >
            <ContentCopyRounded />
          </IconButton>
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: 1,
          }}
        >
          {...Object.entries({
            视频丢包率: "114514",
            音频丢包率: "0.00 %",
            屏幕分享丢包率: "0.00 %",
            视频实时码率: "459.19 kbps",
            音频实时码率: "22.11 kbps",
            屏幕分享实时码率: "0.00 kbps",
          }).map(([k, v], i) => (
            <>
              <Typography
                key={`k${i}`}
                variant="body2"
                align="right"
                sx={{
                  fontWeight: 700,
                }}
              >
                {k}
              </Typography>
              <Typography key={`v${i}`} variant="body2" align="left">
                {v}
              </Typography>
            </>
          ))}
        </Box>
      </Box>
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
    return (
      <Box
        sx={{
          position: "fixed",
          bottom: "1ch",
        }}
      >
        <ToggleButton
          value={true}
          selected={mirror}
          onChange={() => {
            dispatch(toggleMirror(!mirror))
          }}
        >
          <FlipRounded />
        </ToggleButton>
        <Button
          variant="contained"
          color={connected ? "error" : "success"}
          onClick={handleCallButton(connected)}
          disabled={connectionState == QNConnectionState.CONNECTING}
        >
          {connected ? <CallEndRounded key="CallEndRounded" /> : <CallRounded key="CallRounded" />}
        </Button>
      </Box>
    )
  }
}
