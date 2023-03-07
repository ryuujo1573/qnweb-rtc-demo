import {
  CallEndRounded,
  CloseRounded,
  MicOffRounded,
  MicRounded,
  RestartAltRounded,
  ScreenShareRounded,
  TuneRounded,
  VideocamOffRounded,
  VideocamRounded,
} from '@mui/icons-material'
import { Box, Button, IconButton, useTheme, Tooltip } from '@mui/material'
import QNRTC, {
  QNCameraVideoTrack,
  QNConnectionDisconnectedInfo,
  QNConnectionState as QState,
  QNCustomAudioTrack,
  QNLocalVideoTrack,
  QNMicrophoneAudioTrack,
  QNRemoteTrack,
  QNRemoteVideoTrack,
  QNScreenVideoTrack,
} from 'qnweb-rtc'
import React, {
  MouseEventHandler,
  useEffect,
  useRef,
  useState,
  createContext,
  useMemo,
} from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { client } from '../api'

import { DetailPanel, TooltipList, UserBox, VideoBox } from '../components'
import { StreamingControl } from '../components/StreamPanel'
import { error, message } from '../features/messageSlice'
import {
  setDefaultCamera,
  setDefaultMicrophone,
  setDefaultPlayback,
} from '../features/settingSlice'
import { updateDirectConfig } from '../features/streamSlice'
import refStore, { RemoteUser } from '../features/tracks'
import {
  createTrack,
  joinRoom,
  leaveRoom,
  removeTrack,
} from '../features/webrtcSlice'
import { useAppDispatch, useAppSelector } from '../store'
import {
  checkUserId,
  checkRoomId,
  notNull,
  isVideoTrack,
  fetchToken,
} from '../utils'

export type QNVisualTrack = QNLocalVideoTrack | QNRemoteVideoTrack

export const StageContext = createContext<{
  track: QNVisualTrack | undefined
  setTrack: React.Dispatch<React.SetStateAction<QNVisualTrack | undefined>>
  boxRef: React.MutableRefObject<HTMLDivElement | undefined>
}>({ setTrack: () => {}, track: undefined, boxRef: { current: undefined } })

type LocationState = {
  token: string
}
function isLocationState(s: any): s is LocationState {
  return s && typeof s == 'object' && typeof s.token == 'string'
}

export default function RoomPage() {
  let autoJoin = true
  if (import.meta.env.DEV) {
    autoJoin = false
  }

  const navigate = useNavigate()
  const theme = useTheme()
  const dispatch = useAppDispatch()

  const { roomId } = useParams()
  const { state: routeState } = useLocation()
  const tokenRef = useRef<string>()
  if (isLocationState(routeState)) {
    tokenRef.current = routeState.token
  }
  const { userId: localUserID, auth: localAuth } = useAppSelector(
    (s) => s.identity
  )

  if (
    !roomId ||
    !checkRoomId(roomId) ||
    !localUserID ||
    !checkUserId(localUserID)
  ) {
    navigate('/')
    return <></>
  }
  const {
    appId,
    cameras,
    microphones,
    playbacks,
    mirror,
    facingMode,
    cameraPreset,
    defaultCamera,
    defaultMicrophone,
    defaultPlayback,
  } = useAppSelector((s) => s.settings)

  // session states
  const {
    connectionState: state,
    users,
    localTrack,
  } = useAppSelector((s) => s.webrtc)
  const { camera, microphone, screenVideo, screenAudio } = localTrack
  const [camTrack, micTrack, screenVideoTrack, screenAudioTrack] =
    refStore.matchLocalTracks(camera, microphone, screenVideo, screenAudio)

  useEffect(() => {
    if (tokenRef.current) {
      dispatch(joinRoom(tokenRef.current))
    } else {
      fetchToken(roomId!, appId, localUserID).then((token) => {
        dispatch(joinRoom(token))
      })
    }
    return () => {
      dispatch(leaveRoom())
    }
  }, [])

  const isConnected = state == QState.CONNECTED || state == QState.RECONNECTED

  const isConnecting =
    state == QState.CONNECTING || state == QState.RECONNECTING

  const [micMuted, setMicMuted] = useState(true)
  const [camMuted, setCamMuted] = useState(true)
  const screenSharing = screenVideoTrack != null

  // handle track mute & unmute
  useEffect(() => {
    if (isConnected) {
      // create `camTrack` only if set unmuted to true
      if (!camMuted && !camTrack) {
        dispatch(createTrack('camera'))
      } else if (camMuted && camTrack) {
        dispatch(removeTrack('camera'))
      }

      // the same logic as camera
      if (!micMuted && !micTrack) {
        dispatch(createTrack('microphone'))
      } else if (micMuted && micTrack) {
        dispatch(removeTrack('microphone'))
      }
    } else if (!isConnecting) {
      // clean up if disconnected
      dispatch(removeTrack())
    }
  }, [state, camMuted, micMuted])

  useEffect(() => {
    dispatch(
      updateDirectConfig({
        videoTrackId: camera,
        audioTrackId: microphone,
      })
    )
  }, [camera, microphone])

  // TODO: throttle
  const onCallButtonClick =
    (isConnected: boolean): MouseEventHandler<HTMLButtonElement> =>
    async (evt) => {
      if (isConnected) {
        await client.leave()
        const modKey = /Mac|iPhone|iPad/.test(navigator.userAgent)
          ? 'metaKey'
          : 'ctrlKey'
        // if click whilst holding ctrl/cmd key,
        if (!evt[modKey]) {
          // the page won't navigate on dev purpose.
          navigate('/')
        }
      } else {
        if (tokenRef.current) {
          dispatch(joinRoom(tokenRef.current))
        }
      }
    }

  const pinnedBoxRef = useRef<HTMLDivElement>()

  const [pinnedTrack, setPinnedTrack] = useState<QNVisualTrack>()
  const stageContextValue = useMemo(
    () => ({
      track: pinnedTrack,
      setTrack: setPinnedTrack,
      boxRef: pinnedBoxRef,
    }),
    [pinnedTrack]
  )

  return (
    <StageContext.Provider value={stageContextValue}>
      <DetailPanel
        tracks={[camTrack, micTrack, screenVideoTrack, screenAudioTrack]}
      />
      <StreamingControl
        {...{
          state,
        }}
      />
      <Box
        component="header"
        sx={{
          display: 'flex',
          width: '100%',
          bgcolor: '#aaaaaa10',
          justifyContent: 'center',
        }}
      >
        {users.map((user) => {
          return <UserBox key={user.userID} user={user} />
        })}
      </Box>
      <Box
        component="main"
        sx={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          height: 'calc(100% - 180px)',
        }}
      >
        <Box
          ref={pinnedBoxRef}
          sx={{
            display: 'contents',
            backgroundColor: 'black',
            '&>video': {
              width: 'inherit !important',
              margin: 'auto',
            },
          }}
        >
          <IconButton
            sx={{
              position: 'absolute',
              right: 0,
              top: 0,
              zIndex: 10,
              display: pinnedTrack ? 'static' : 'none',
            }}
            onClick={() => {
              setPinnedTrack(undefined)
            }}
          >
            <CloseRounded fontSize="medium" />
          </IconButton>
        </Box>
        {camTrack ? (
          <VideoBox
            sx={{
              position: 'absolute',
              left: '30px',
              bottom: '30px',
              width: '240px',
              height: '160px',
            }}
            videoTrack={isVideoTrack(camTrack) ? camTrack : undefined}
            className={mirror ? 'mirror' : undefined}
          />
        ) : undefined}
      </Box>
      <Box
        component="footer"
        sx={{
          position: 'fixed',
          height: '60px',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box>
          <Tooltip
            arrow
            leaveDelay={200}
            title={
              playbacks ? (
                <TooltipList
                  list={playbacks}
                  initialIndex={playbacks.findIndex(
                    (pb) => pb.deviceId == defaultPlayback
                  )}
                  onSelect={async ({ deviceId }) => {
                    dispatch(setDefaultPlayback(deviceId))
                  }}
                />
              ) : (
                '无音频输出'
              )
            }
          >
            <span>
              <IconButton
                disabled={!isConnected || !playbacks}
                children={<TuneRounded />}
              />
            </span>
          </Tooltip>
          <Tooltip
            arrow
            leaveDelay={200}
            title={
              microphones ? (
                <TooltipList
                  list={microphones}
                  initialIndex={microphones.findIndex(
                    (mic) => mic.deviceId == defaultMicrophone
                  )}
                  onSelect={({ deviceId }) => {
                    dispatch(setDefaultMicrophone(deviceId))
                  }}
                />
              ) : (
                '无可用麦克风'
              )
            }
          >
            <span>
              <IconButton
                disabled={!isConnected || !microphones}
                onClick={() => {
                  micTrack?.setMuted(!micMuted)
                  setMicMuted(!micMuted)
                }}
                children={micMuted ? <MicOffRounded /> : <MicRounded />}
              />
            </span>
          </Tooltip>
          <Button
            variant="contained"
            color={isConnected ? 'error' : 'success'}
            onClick={onCallButtonClick(isConnected)}
            disabled={isConnecting}
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
              cameras ? (
                <TooltipList
                  list={cameras}
                  initialIndex={cameras.findIndex(
                    (cam) => cam.deviceId == defaultCamera
                  )}
                  onSelect={({ deviceId }) => {
                    dispatch(setDefaultCamera(deviceId))
                  }}
                />
              ) : (
                '无可用摄像头'
              )
            }
          >
            <span>
              <IconButton
                disabled={!isConnected || !cameras}
                onClick={() => {
                  camTrack?.setMuted(!camMuted)
                  setCamMuted(!camMuted)
                }}
                children={
                  camMuted ? <VideocamOffRounded /> : <VideocamRounded />
                }
              />
            </span>
          </Tooltip>
          <Tooltip leaveDelay={200} title={'屏幕共享'}>
            <span>
              <IconButton
                onClick={onScreenShareClick}
                color={screenSharing ? 'primary' : 'default'}
                disabled={!isConnected}
                children={<ScreenShareRounded />}
              />
            </span>
          </Tooltip>
        </Box>
      </Box>
    </StageContext.Provider>
  )

  async function onScreenShareClick(
    _evt: React.MouseEvent<Element, MouseEvent>
  ) {
    if (screenSharing == false) {
      dispatch(createTrack('screenVideo'))
    } else {
      dispatch(removeTrack('screenVideo'))
      dispatch(removeTrack('screenAudio'))
    }
  }

  // function addEventHandlers() {
  //   client.addListener('user-reconnecting', (uid: string) => {
  //     setUsers((users) => {
  //       const user = users.find((u) => u.userID == uid)!
  //       user.state = QState.RECONNECTING
  //       return users.slice()
  //     })
  //   })
  //   client.addListener('user-reconnected', (uid: string) => {
  //     setUsers((users) => {
  //       const user = users.find((u) => u.userID == uid)!
  //       user.state = QState.RECONNECTED
  //       return users.slice()
  //     })
  //   })
  // }
}
