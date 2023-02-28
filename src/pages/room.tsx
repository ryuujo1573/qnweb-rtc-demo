import {
  CallEndRounded,
  CloseRounded,
  LayersRounded,
  MicOffRounded,
  MicRounded,
  RestartAltRounded,
  ScreenShareRounded,
  StreamRounded,
  TuneRounded,
  VideocamOffRounded,
  VideocamRounded,
} from '@mui/icons-material'
import {
  Box,
  Button,
  IconButton,
  useTheme,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  Fade,
} from '@mui/material'
import QNRTC, {
  QNCameraVideoTrack,
  QNConnectionDisconnectedInfo,
  QNConnectionState as QState,
  QNCustomAudioTrack,
  QNLocalVideoTrack,
  QNMicrophoneAudioTrack,
  QNRemoteAudioTrack,
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
import { useNavigate, useParams } from 'react-router-dom'
import { client } from '../api'

import { DetailPanel, TooltipList, UserBox, VideoBox } from '../components'
import { StreamingControl } from '../components/StreamPanel'
import { error, message } from '../features/messageSlice'
import { updateDirectConfig } from '../features/streamSlice'
import refStore, { RemoteUser } from '../features/tracks'
import { useAppDispatch, useAppSelector } from '../store'
import { checkUserId, checkRoomId, notNull } from '../utils'

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
  const { mirror, facingMode, appId, liveStreamBaseUrl } = useAppSelector(
    (s) => s.settings
  )

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
      client.leave()

      QNRTC.onCameraChanged = undefined
      QNRTC.onMicrophoneChanged = undefined
      QNRTC.onPlaybackDeviceChanged = undefined
    }
  }, [])

  const isConnected = state == QState.CONNECTED || state == QState.RECONNECTED

  const isConnecting =
    state == QState.CONNECTING || state == QState.RECONNECTING

  const [playbackId, setPlaybackId] = useState<string>('default')
  const [cameraId, setCameraId] = useState<string>('default')
  const [microphoneId, setMicrophoneId] = useState<string>('default')

  const [camTrack, setCamTrack] = useState<QNCameraVideoTrack | null>(null)
  const [micTrack, setMicTrack] = useState<QNMicrophoneAudioTrack | null>(null)
  const [[screenVideo, screenAudio], setScreenShare] = useState<
    [QNScreenVideoTrack | null, QNCustomAudioTrack | null]
  >([null, null])

  // TODO: user device switch setting
  const [micMuted, setMicMuted] = useState(true)
  const [camMuted, setCamMuted] = useState(true)
  const screenSharing = screenVideo != null

  const [cameras, setCameras] = useState<MediaDeviceInfo[]>()
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>()
  const [playbacks, setPlaybacks] = useState<MediaDeviceInfo[]>()

  ;[camTrack, micTrack, screenVideo, screenAudio]
    .filter(notNull)
    .forEach((t) => {
      refStore.localTracks.set(t.trackID!, t)
    })

  // handle track mute & unmute
  useEffect(() => {
    if (isConnected) {
      // create `camTrack` only if set unmuted to true
      if (!camMuted && camTrack == null) {
        QNRTC.createCameraVideoTrack({
          cameraId,
        }).then(async (track) => {
          await client.publish(track)
          setCamTrack(track)
        })
      } else if (camMuted && camTrack != null) {
        client.unpublish(camTrack).then(() => {
          setCamTrack(null)
          camTrack.destroy()
        })
      }

      // the same logic as camera
      if (!micMuted && micTrack == null) {
        QNRTC.createMicrophoneAudioTrack({
          microphoneId,
        }).then(async (track) => {
          await client.publish(track)
          setMicTrack(track)
        })
      } else if (micMuted && micTrack != null) {
        client.unpublish(micTrack).then(() => {
          setMicTrack(null)
          micTrack.destroy()
        })
      }
    } else if (!isConnecting) {
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
  }, [state, camMuted, micMuted])

  useEffect(() => {
    dispatch(
      updateDirectConfig({
        videoTrackId: camTrack?.trackID!,
        audioTrackId: micTrack?.trackID!,
      })
    )
  }, [camTrack, micTrack])

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
      <DetailPanel tracks={[camTrack, micTrack, screenVideo, screenAudio]} />
      <StreamingControl
        {...{
          state,
          // videoTracks: [camTrack, screenVideo].filter(notNull),
          // audioTracks: [micTrack, screenAudio].filter(notNull),
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
      const result = await QNRTC.createScreenVideoTrack({}, 'auto')
      await client.publish(result)
      if (Array.isArray(result)) {
        const [screenVideo, _screenAudio] = result
        setScreenShare(result)
        screenVideo.on('ended', function () {
          setScreenShare([null, null])
        })
      } else {
        const screenVideo = result
        setScreenShare([screenVideo, null])
        screenVideo.on('ended', function () {
          setScreenShare([null, null])
        })
      }
    } else {
      setScreenShare((oldTracks) => {
        oldTracks.forEach((t) => {
          if (t) {
            client.unpublish(t)
            t.destroy()
          }
        })
        return [null, null]
      })
    }
  }

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
      setUsers((users) => [
        ...users,
        {
          userID: uid,
          userData,
          state: QState.CONNECTED,
          trackIds: [],
        },
      ])
    })
    client.addListener('user-left', (uid: string) => {
      setUsers((users) => {
        const user = users.find((u) => u.userID == uid)!
        for (const trackId of user.trackIds) {
          refStore.remoteTracks.delete(trackId)
        }
        return users.filter((u) => u != user)
      })
    })
    client.addListener(
      'user-published',
      async (uid: string, qntracks: QNRemoteTrack[]) => {
        console.log('user-published', uid, qntracks)
        const { audioTracks, videoTracks } = await client.subscribe(qntracks)
        setUsers((users) => {
          const user = users.find((u) => u.userID == uid)!
          for (const track of [...audioTracks, ...videoTracks]) {
            // record track id & save track
            user.trackIds.push(track.trackID!)
            refStore.remoteTracks.set(track.trackID!, track)
          }
          return users.slice()
        })
      }
    )
    client.addListener(
      'user-unpublished',
      async (uid: string, unpublishingTracks: QNRemoteTrack[]) => {
        setUsers((users) => {
          const user = users.find((u) => u.userID == uid)!
          const removalIds = unpublishingTracks
            .map((t) => t.trackID!)
            // double confimation for removing IDs
            .filter((tid) => user.trackIds.includes(tid))

          for (const trackId of removalIds) {
            refStore.remoteTracks.delete(trackId)
          }
          return users.slice()
        })
        // await client.unsubscribe(unpublishingTracks)
      }
    )
    client.addListener('user-reconnecting', (uid: string) => {
      setUsers((users) => {
        const user = users.find((u) => u.userID == uid)!
        user.state = QState.RECONNECTING
        return users.slice()
      })
    })
    client.addListener('user-reconnected', (uid: string) => {
      setUsers((users) => {
        const user = users.find((u) => u.userID == uid)!
        user.state = QState.RECONNECTED
        return users.slice()
      })
    })
  }
}
