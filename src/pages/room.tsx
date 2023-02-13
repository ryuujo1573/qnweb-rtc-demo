import {
  CallEndRounded,
  MicOffRounded,
  MicRounded,
  RestartAltRounded,
  VideocamOffRounded,
  VideocamRounded,
} from '@mui/icons-material'
import { Box, Button, IconButton, useTheme } from '@mui/material'
import QNRTC, { QNConnectionState, QNLocalTrack } from 'qnweb-rtc'
import {
  MouseEventHandler,
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  useState,
  useDebugValue,
  useCallback,
  Fragment,
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Client, getRoomToken } from '../api'
import { DetailPanel, VideoBox } from '../components'
import { useAppDispatch, useAppSelector } from '../store'
import { checkRoomId } from '../utils'

const verbose = console.log

export default function RoomPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()

  const dispatch = useAppDispatch()

  const { userId, auth } = useAppSelector((s) => s.identity)
  const { mirror, facingMode } = useAppSelector((s) => s.settings)

  const { pinnedVisualTrack, roomMembers, connectionState, localTracks } =
    useSyncExternalStore(Client.register, Client.getSnapshot)

  const isConnected = () => connectionState == QNConnectionState.CONNECTED

  const videoTrack = localTracks.find((t) => t.isVideo())
  const audioTrack = localTracks.find((t) => t.isAudio())

  const [roomToken, setRoomToken] = useState<string>()

  // identity -> roomToken
  useEffect(() => {
    // check validity
    if (!roomId || !checkRoomId(roomId) || !userId) {
      return navigate('/')
    }

    getRoomToken(roomId, userId).then(setRoomToken)
  }, [roomId, userId])

  // roomToken -> (connect) connectionState
  useEffect(() => {
    if (!roomToken) return
    const promise = Client.connect(roomToken)

    return () => {
      if (isConnected()) {
        promise.then(Client.disconnect)
      }
    }
  }, [roomToken])

  // [connectionState, localTracks] -> (publish)
  useEffect(() => {
    const promise = (async () => {
      if (isConnected()) {
        Client.publish(localTracks)
      }
    })()

    return () => {
      promise.finally(async () => {
        // unpublish the old ones
        if (isConnected()) {
          await Client.unpublish(localTracks)
        }
      })
    }
  }, [connectionState, localTracks])

  // roomMembers -> (subscribe) -- allTracks
  useEffect(() => {
    const promise = (async () => {
      console.time('subscribe allTracks')
      const allTracks = roomMembers.flatMap((user) => [
        ...user.getAudioTracks(),
        ...user.getVideoTracks(),
      ])
      console.log('allTracks', allTracks)
      await Client.subscribe(allTracks)
      console.timeEnd('subscribe allTracks')
      return allTracks
    })()

    return () => {
      promise.then(async (allTracks) => {
        if (isConnected()) await Client.unsubscribe(allTracks)
      })
    }
  }, [roomMembers])

  // TODO: throttle
  const onCallButtonClick: MouseEventHandler<HTMLButtonElement> = (evt) => {
    if (isConnected()) {
      Client.disconnect()
      const modKey = /Mac|iPhone|iPad/.test(navigator.userAgent)
        ? 'metaKey'
        : 'ctrlKey'
      // if click whilst holding ctrl/cmd key,
      // the page won't navigate on dev purpose.
      if (!evt[modKey]) {
        navigate('/')
      }
    } else if (roomToken) {
      Client.connect(roomToken)
    }
  }

  useEffect(() => {
    if (videoTrack) {
      verbose(';publish', videoTrack)
      Client.publish(videoTrack)
    }
    if (audioTrack) {
      verbose(';publish', audioTrack)
      Client.publish(audioTrack)
    }
  }, [videoTrack, audioTrack])

  const [micMuted, setMicMuted] = useState(audioTrack?.isMuted())
  const [camMuted, setCamMuted] = useState(videoTrack?.isMuted())
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
            justifyContent: 'center',
          }}
        >
          {roomMembers.map((user, i) => {
            const tracks = user.getVideoTracks()
            if (tracks.length) {
              const firstTrack = tracks.shift()!
              return (
                <Fragment key={i}>
                  <VideoBox
                    key={user.userID}
                    videoTrack={firstTrack}
                    audioTracks={user.getAudioTracks()}
                  />
                  {tracks.map((track) => {
                    return <VideoBox key={user.userID} videoTrack={track} />
                  })}
                </Fragment>
              )
            } else {
              return <Fragment key={i}>NO SIGNAL</Fragment>
            }
          })}
        </Box>
      </header>
      <main>
        {videoTrack ? (
          <VideoBox
            videoTrack={videoTrack}
            width="100%"
            height="100%"
            className={mirror ? 'mirror' : undefined}
          />
        ) : undefined}
      </main>
      <footer>
        <ToolBar />
      </footer>
    </>
  )

  function ToolBar() {
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: '1ch',
        }}
      >
        <IconButton
          disabled={!audioTrack}
          onClick={() => {
            setMicMuted(!micMuted)
            audioTrack?.setMuted(!micMuted)
          }}
          children={
            audioTrack?.isMuted() && micMuted ? (
              <MicOffRounded />
            ) : (
              <MicRounded />
            )
          }
        />
        <Button
          variant="contained"
          color={isConnected() ? 'error' : 'success'}
          onClick={onCallButtonClick}
          disabled={connectionState == QNConnectionState.CONNECTING}
        >
          {isConnected() ? (
            <CallEndRounded key="CallEndRounded" />
          ) : (
            <RestartAltRounded key="RestartAltRounded" />
          )}
        </Button>
        <IconButton
          disabled={!videoTrack}
          onClick={() => {
            setCamMuted(!camMuted)
            videoTrack?.setMuted(!camMuted)
          }}
          children={
            videoTrack?.isMuted() && camMuted ? (
              <VideocamOffRounded />
            ) : (
              <VideocamRounded />
            )
          }
        />
      </Box>
    )
  }
}
