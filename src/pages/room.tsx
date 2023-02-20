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
  QNLocalAudioTrack,
  QNLocalTrack,
  QNLocalVideoTrack,
  QNMicrophoneAudioTrack,
  QNRemoteAudioTrack,
  QNRemoteTrack,
  QNRemoteVideoTrack,
  QNScreenVideoTrack,
  QNTrack,
} from 'qnweb-rtc'
import React, {
  MouseEventHandler,
  useEffect,
  useRef,
  useState,
  createContext,
  useMemo,
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { client } from '../api'

import { TooltipList, UserBox, VideoBox } from '../components'
import { error, message } from '../features/messageSlice'
import { useAppDispatch, useAppSelector } from '../store'
import { checkUserId, checkRoomId } from '../utils'

export interface RemoteUser {
  userID: string
  userData?: string
  state: QState
  videoTracks: QNRemoteVideoTrack[]
  audioTracks: QNRemoteAudioTrack[]
}

function isAudioTrack<T extends QNTrack>(
  track: T
): track is T extends QNLocalTrack
  ? QNLocalAudioTrack
  : T extends QNRemoteTrack
  ? QNRemoteAudioTrack
  : any {
  return track.isAudio()
}

function isVideoTrack<T extends QNTrack>(
  track: T
): track is T extends QNLocalTrack
  ? QNLocalVideoTrack
  : T extends QNRemoteTrack
  ? QNRemoteVideoTrack
  : any {
  return track.isVideo()
}

export type QNVisualTrack = QNLocalVideoTrack | QNRemoteVideoTrack

export const StageContext = createContext<{
  track: QNVisualTrack | undefined
  setTrack: React.Dispatch<React.SetStateAction<QNVisualTrack | undefined>>
  boxRef: React.MutableRefObject<HTMLDivElement | undefined>
}>({ setTrack: () => {}, track: undefined, boxRef: { current: undefined } })

export default function RoomPage() {
  let autoJoin = true
  if (import.meta.hot) {
    autoJoin = false
  }

  const navigate = useNavigate()
  const theme = useTheme()
  const dispatch = useAppDispatch()

  const { roomId } = useParams()
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
  }
  const { mirror, facingMode, appId } = useAppSelector((s) => s.settings)

  // session states
  const [state, setState] = useState(QState.DISCONNECTED)
  const [users, setUsers] = useState<RemoteUser[]>([])

  useEffect(() => {
    // add event handlers
    addEventHandlers()

    // auto join
    if (autoJoin) {
      joinRoom()
    }

    // check devices
    async function checkDevices() {
      const deviceInfos = await QNRTC.getDevices()
      const cams = [],
        mics = [],
        pbs = []
      for (const device of deviceInfos) {
        switch (device.kind) {
          case 'videoinput':
            cams.push(device)
            break
          case 'audioinput':
            mics.push(device)
            break
          case 'audiooutput':
            pbs.push(device)
            break
        }
      }
      setCameras(cams)
      setMicrophones(mics)
      setPlaybacks(pbs)
    }

    checkDevices()
    QNRTC.onCameraChanged = checkDevices
    QNRTC.onMicrophoneChanged = checkDevices
    QNRTC.onPlaybackDeviceChanged = checkDevices

    return () => {
      client.removeAllListeners()
      //
      if (isConnected(state)) {
        client.leave()
      }

      QNRTC.onCameraChanged = undefined
      QNRTC.onMicrophoneChanged = undefined
      QNRTC.onPlaybackDeviceChanged = undefined
    }
  }, [])

  const isConnected = (_state: QState) =>
    _state == QState.CONNECTED || _state == QState.RECONNECTED

  const isConnecting = (_state: QState) =>
    _state == QState.CONNECTING || _state == QState.RECONNECTING

  const [playbackId, setPlaybackId] = useState<string>('default')
  const [cameraId, setCameraId] = useState<string>('default')
  const [microphoneId, setMicrophoneId] = useState<string>('default')
  const [camTrack, setCamTrack] = useState<QNCameraVideoTrack | null>(null)
  const [micTrack, setMicTrack] = useState<QNMicrophoneAudioTrack | null>(null)
  const [[screenVideo, screenAudio], setScreenShare] = useState<
    [QNScreenVideoTrack | null, QNCustomAudioTrack | null]
  >([null, null])

  const [micMuted, setMicMuted] = useState(true)
  const [camMuted, setCamMuted] = useState(true)

  const [cameras, setCameras] = useState<MediaDeviceInfo[]>()
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>()
  const [playbacks, setPlaybacks] = useState<MediaDeviceInfo[]>()

  // handle track mute & unmute
  useEffect(() => {
    if (isConnected(state)) {
      if (!camMuted) {
        if (camTrack == null) {
          QNRTC.createCameraVideoTrack({
            cameraId,
          }).then(async (track) => {
            await client.publish(track)
            setCamTrack(track)
          })
        } else {
          camTrack.setMuted(false)
        }
      } else {
        if (camTrack != null) {
          camTrack.destroy()
          setCamTrack(null)
        }
      }
      if (!micMuted) {
        if (micTrack == null) {
          QNRTC.createMicrophoneAudioTrack({
            microphoneId,
          }).then(async (track) => {
            await client.publish(track)
            setMicTrack(track)
          })
        } else {
          micTrack.setMuted(false)
        }
      } else {
        if (micTrack != null) {
          micTrack.destroy()
          setMicTrack(null)
        }
      }
    } else if (!isConnecting(state)) {
      // clean up if disconnected
      if (camTrack != null) {
        camTrack.destroy()
        setCamTrack(null)
      }
      if (micTrack != null) {
        micTrack.destroy()
        setMicTrack(null)
      }
    }
  }, [state, camMuted, micMuted, camTrack, micTrack])

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
        joinRoom()
      }
    }

  const pinnedBoxRef = useRef<HTMLDivElement>()

  // useEffect(() => {
  //   if (pinnedBoxRef.current && pinnedVisualTrack) {
  //     pinnedVisualTrack.play(pinnedBoxRef.current, { mirror: false })
  //     setShowPinnedButton(true)
  //   }
  // }, [showPinnedButton, pinnedVisualTrack, pinnedBoxRef.current])

  const [pinnedTrack, setPinnedTrack] = useState<QNVisualTrack>()
  const stageContextValue = useMemo(
    () => ({
      track: pinnedTrack,
      setTrack: setPinnedTrack,
      boxRef: pinnedBoxRef,
    }),
    []
  )

  return (
    <StageContext.Provider value={stageContextValue}>
      {/* <DetailPanel /> */}
      <Box
        component="header"
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
        {users.map((user) => {
          return <UserBox key={user.userID} user={user} />
        })}
      </Box>
      <main>
        <Box
          ref={pinnedBoxRef}
          sx={{
            position: 'relative',
            width: '640px',
            height: '480px',
          }}
        >
          <IconButton
            sx={{
              position: 'absolute',
              right: 0,
              top: 0,
              zIndex: 10,
              display: pinnedTrack ? 'inherit' : 'none',
            }}
            onClick={() => {
              // startTransition(() => {
              setPinnedTrack(undefined)
              // })
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
            videoTrack={camTrack}
            className={mirror ? 'mirror' : undefined}
          />
        ) : undefined}
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
              playbacks ? (
                <TooltipList
                  list={playbacks}
                  initialIndex={playbacks.findIndex(
                    (pb) => pb.deviceId == playbackId
                  )}
                  onSelect={async ({ deviceId }) => {
                    setPlaybackId(deviceId)
                  }}
                />
              ) : (
                '无音频输出'
              )
            }
          >
            <span>
              <IconButton
                disabled={!isConnected(state)}
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
                    (mic) => mic.deviceId == microphoneId
                  )}
                  onSelect={({ deviceId }) => {
                    setMicrophoneId(deviceId)
                  }}
                />
              ) : (
                '无可用麦克风'
              )
            }
          >
            <span>
              <IconButton
                disabled={!isConnected(state)}
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
            color={isConnected(state) ? 'error' : 'success'}
            onClick={onCallButtonClick(isConnected(state))}
            disabled={state == QState.CONNECTING}
          >
            {isConnected(state) ? (
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
                    (cam) => cam.deviceId == cameraId
                  )}
                  onSelect={({ deviceId }) => {
                    setCameraId(deviceId)
                  }}
                />
              ) : (
                '无可用摄像头'
              )
            }
          >
            <span>
              <IconButton
                disabled={!isConnected(state)}
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
                onClick={() => {}}
                disabled={!isConnected(state)}
                children={<ScreenShareRounded />}
              />
            </span>
          </Tooltip>
        </Box>
      </footer>
    </StageContext.Provider>
  )

  async function joinRoom() {
    const resp = await fetch(
      `https://api-demo.qnsdk.com/v1/rtc/token/admin/app/${appId}/room/${roomId}/user/${localUserID}?bundleId=demo-rtc.qnsdk.com`
    )
    const token = await resp.text()
    try {
      await client.join(token)
    } catch (e: any) {
      dispatch(error({ message: JSON.stringify(e.message) }))
    }
  }

  function addEventHandlers() {
    client.addListener(
      'connection-state-changed',
      (state: QState, info?: QNConnectionDisconnectedInfo) => {
        if (info) {
          dispatch(message({ message: 'disconnected:' + info.errorMessage }))
        }
        setState(state)
      }
    )
    client.addListener('user-joined', (uid: string, userData?: string) => {
      debugger
      setUsers((users) => [
        ...users,
        {
          userData,
          userID: uid,
          state: QState.CONNECTED,
          videoTracks: [],
          audioTracks: [],
        },
      ])
    })
    client.addListener('user-left', (uid: string) => {
      setUsers((users) => users.filter((u) => u.userID != uid))
    })
    client.addListener(
      'user-published',
      async (uid: string, qntracks: QNRemoteTrack[]) => {
        console.log('user-published', uid, qntracks)
        const { audioTracks, videoTracks } = await client.subscribe(qntracks)
        setUsers((users) => {
          const user = users.find((u) => u.userID == uid)!
          debugger
          user.audioTracks.push(...audioTracks)
          user.videoTracks.push(...videoTracks)
          console.log('user', user)
          return users.slice()
        })
      }
    )
    client.addListener(
      'user-unpublished',
      async (uid: string, qntracks: QNRemoteTrack[]) => {
        const user = users.find((u) => u.userID == uid)!
        const removalIds = qntracks.map((t) => t.trackID!)
        await client.unsubscribe(qntracks)

        user.audioTracks = user.audioTracks.filter(
          (t) => !removalIds.includes(t.trackID!)
        )
        user.videoTracks = user.videoTracks.filter(
          (t) => !removalIds.includes(t.trackID!)
        )
        setUsers(users.slice())
      }
    )
    client.addListener('user-reconnecting', (uid: string) => {
      const user = users.find((u) => u.userID == uid)!
      user.state = QState.RECONNECTING
      setUsers(users.slice())
    })
    client.addListener('user-reconnected', (uid: string) => {
      const user = users.find((u) => u.userID == uid)!
      user.state = QState.RECONNECTED
      setUsers(users.slice())
    })
  }
}
