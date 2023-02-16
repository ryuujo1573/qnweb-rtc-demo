import {
  CallEndRounded,
  MicOffRounded,
  MicRounded,
  RestartAltRounded,
  ScreenShareRounded,
  TuneRounded,
  VideocamOffRounded,
  VideocamRounded,
} from '@mui/icons-material'
import {
  Box,
  Button,
  IconButton,
  Typography,
  useTheme,
  Tooltip,
} from '@mui/material'
import QNRTC, {
  QNConnectionState,
  QNLocalAudioTrack,
  QNLocalTrack,
  QNLocalVideoTrack,
} from 'qnweb-rtc'
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

import { Client } from '../api'
import { DetailPanel, TooltipList, UserBox, VideoBox } from '../components'
import { useAppDispatch, useAppSelector } from '../store'
import { checkRoomId, debounce } from '../utils'

export default function RoomPage() {
  let autoJoin = true
  if (import.meta.hot) {
    autoJoin = false
  }
  const { roomId } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()

  const dispatch = useAppDispatch()

  const { userId, auth } = useAppSelector((s) => s.identity)
  const { mirror, facingMode } = useAppSelector((s) => s.settings)

  const {
    connectionState,
    localTracks,
    publishedTracks,
    pinnedVisualTrack,
    playbackDevices,
    roomMembers,
  } = useSyncExternalStore(Client.register, Client.getSnapshot)

  const isConnected =
    connectionState == QNConnectionState.CONNECTED ||
    connectionState == QNConnectionState.RECONNECTED

  // identity -> roomToken
  useEffect(() => {
    // check validity
    if (!roomId || !checkRoomId(roomId) || !userId) {
      return navigate('/')
    }

    const promise = Client.getRoomToken(roomId, userId).then((token) => {
      if (autoJoin) {
        return Client.connect(token)
      }
    })
    if (autoJoin)
      return () => {
        if (isConnected) {
          promise.then(() => Client.disconnect())
        }
      }
  }, [])

  // roomToken -> (connect) connectionState

  const [audioTrack, setAudioTrack] = useState<QNLocalAudioTrack | undefined>()
  const [videoTrack, setVideoTrack] = useState<QNLocalVideoTrack | undefined>()

  const [micMuted, setMicMuted] = useState(true)
  const [camMuted, setCamMuted] = useState(true)

  // mute according to toggle status
  useEffect(() => {
    if (audioTrack) {
      audioTrack.setMuted(micMuted)
    }
    if (videoTrack) {
      videoTrack.setMuted(camMuted)
    }
  }, [audioTrack, videoTrack])

  // [connectionState, localTracks] -> (publish)
  useEffect(() => {
    if (isConnected && localTracks.length) {
      const promise = Client.publish(...localTracks).then(() => {
        if (localTracks.length) {
          setVideoTrack(
            localTracks.find((t): t is QNLocalVideoTrack => t.isVideo())
          )
          setAudioTrack(
            localTracks.find((t): t is QNLocalAudioTrack => t.isAudio())
          )
        }
      })

      return () => {
        promise.finally(() => {
          // unpublish the old ones
          if (isConnected) {
            return Client.unpublish(...localTracks)
          }
        })
      }
    }
  }, [connectionState, localTracks])

  // TODO: throttle
  const onCallButtonClick =
    (isConnected: boolean): MouseEventHandler<HTMLButtonElement> =>
    (evt) => {
      if (isConnected) {
        Client.disconnect()
        const modKey = /Mac|iPhone|iPad/.test(navigator.userAgent)
          ? 'metaKey'
          : 'ctrlKey'
        // if click whilst holding ctrl/cmd key,
        // the page won't navigate on dev purpose.
        if (!evt[modKey]) {
          navigate('/')
        }
      } else {
        Client.getRoomToken(roomId!, userId!).then(Client.connect)
      }
    }

  const [selected, setSelected] = useState<number>(0)

  return (
    <>
      <DetailPanel roomId={roomId!} />
      <header>
        <Box
          sx={{
            display: 'flex',
            position: 'fixed',
            zIndex: 0,
            top: '0',
            width: '100%',
            bgcolor: '#aaaaaa10',
            justifyContent: 'center',
          }}
        >
          {roomMembers.map((user) => {
            return <UserBox key={user.userID} user={user} />
          })}
        </Box>
      </header>
      <main>
        <Box
          sx={{
            position: 'absolute',
            left: '30px',
            bottom: '30px',
            width: '240px',
            height: '160px',
          }}
        >
          {videoTrack ? (
            <VideoBox
              videoTrack={videoTrack}
              width="100%"
              height="100%"
              className={mirror ? 'mirror' : undefined}
            />
          ) : undefined}
        </Box>
      </main>
      <footer>
        <Box
          sx={{
            position: 'fixed',
            bottom: '1ch',
          }}
        >
          <Tooltip
            arrow
            leaveDelay={200}
            title={
              <TooltipList
                index={selected}
                onSelect={(i) => setSelected(i)}
                list={playbackDevices}
              />
            }
          >
            <span>
              <IconButton
                disabled={!playbackDevices.length}
                children={<TuneRounded />}
              />
            </span>
          </Tooltip>
          <Tooltip
            arrow
            leaveDelay={200}
            title={
              <TooltipList
                index={selected}
                onSelect={(i) => setSelected(i)}
                list={localTracks
                  .filter((t): t is QNLocalAudioTrack => t.isAudio())
                  .map((t) => {
                    const track = t.getMediaStreamTrack()!
                    const label =
                      track.label == 'MediaStreamAudioDestinationNode'
                        ? '默认设备'
                        : track.label
                    return { label }
                  })}
              />
            }
          >
            <span>
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
            </span>
          </Tooltip>
          <Button
            variant="contained"
            color={isConnected ? 'error' : 'success'}
            onClick={onCallButtonClick(isConnected)}
            disabled={connectionState == QNConnectionState.CONNECTING}
          >
            {isConnected ? (
              <CallEndRounded key="CallEndRounded" />
            ) : (
              <RestartAltRounded key="RestartAltRounded" />
            )}
          </Button>
          <Tooltip
            arrow
            leaveDelay={200}
            title={
              <TooltipList
                index={selected}
                onSelect={(i) => setSelected(i)}
                list={localTracks
                  .filter((t): t is QNLocalVideoTrack => t.isVideo())
                  .map((t) => {
                    const { label } = t.getMediaStreamTrack()!
                    return { label }
                  })}
              />
            }
          >
            <span>
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
            </span>
          </Tooltip>
          <Tooltip leaveDelay={200} title={'屏幕共享'}>
            <span>
              <IconButton
                onClick={() => {}}
                children={<ScreenShareRounded />}
              />
            </span>
          </Tooltip>
        </Box>
      </footer>
    </>
  )
}
