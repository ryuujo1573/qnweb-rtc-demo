import {
  CallEndRounded,
  CloseRounded,
  ContentCopyRounded,
  MicOffRounded,
  MicRounded,
  RestartAltRounded,
  ScreenShareRounded,
  VideocamOffRounded,
  VideocamRounded,
} from '@mui/icons-material'
import { Avatar, Box, Button, Fade, IconButton, Tooltip } from '@mui/material'
import {
  QNLocalVideoTrack,
  QNRemoteVideoTrack,
  QNConnectionState as QState,
} from 'qnweb-rtc'
import React, {
  MouseEventHandler,
  createContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Pagination } from 'swiper'
import 'swiper/css'
import 'swiper/css/pagination'
import { Swiper, SwiperSlide } from 'swiper/react'

import { createPortal } from 'react-dom'
import { client, fetchToken } from '../api'
import {
  DetailPanel,
  OobePanel,
  TooltipList,
  UserBox,
  VideoBox,
} from '../components'
import { StreamingControl } from '../components/StreamPanel'
import {
  checkDevices,
  save,
  setDefaultCamera,
  setDefaultMicrophone,
  update,
} from '../features/settingSlice'
import { updateDirectConfig } from '../features/streamSlice'
import refStore, { RemoteUser } from '../features/tracks'
import {
  createTrack,
  joinRoom,
  leaveRoom,
  pinTrack,
  removeTrack,
} from '../features/webrtcSlice'
import { useAppDispatch, useAppSelector } from '../store'
import {
  checkRoomId,
  checkUserId,
  isMobile,
  isVideoTrack,
  stringToColor,
  useDebounce,
} from '../utils'
import { useTopRightBox } from './layout'

export type QNVisualTrack = QNLocalVideoTrack | QNRemoteVideoTrack

export const StageContext = createContext<{
  track: QNVisualTrack | undefined
  setTrack: React.Dispatch<React.SetStateAction<QNVisualTrack | undefined>>
  boxRef: React.MutableRefObject<HTMLDivElement | undefined>
}>({ setTrack: () => {}, track: undefined, boxRef: { current: undefined } })

export default function RoomPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const { roomId } = useParams()
  const { state: roomToken } = useLocation()
  const tokenRef = useRef<string>()
  if (typeof roomToken == 'string') {
    tokenRef.current = roomToken
  }
  const { userId } = useAppSelector((s) => s.identity)

  if (!roomId || !checkRoomId(roomId) || !userId || !checkUserId(userId)) {
    navigate('/')
    return <></>
  }
  const {
    appId,
    cameras,
    microphones,
    playbacks,
    defaultCamera,
    defaultMicrophone,
    defaultPlayback,
    neverPrompt,
    cameraMuted,
    microphoneMuted,
  } = useAppSelector((s) => s.settings)

  const [camMuted, setCamMuted] = useState(cameraMuted)
  const [micMuted, setMicMuted] = useState(microphoneMuted)
  // session states
  const {
    connectionState: state,
    users,
    localTrack,
    pinnedTrackId,
  } = useAppSelector((s) => s.webrtc)
  const { camera, microphone, screenVideo, screenAudio } = localTrack
  const [camTrack, micTrack, screenVideoTrack, screenAudioTrack] =
    refStore.matchLocalTracks(camera, microphone, screenVideo, screenAudio)

  const [oobe, setOobe] = useState(!neverPrompt)

  const isConnected = state == QState.CONNECTED || state == QState.RECONNECTED

  useEffect(() => {
    dispatch(checkDevices())
    // if no OOBE panel, do normal inits
    if (!oobe && state == QState.DISCONNECTED) {
      if (tokenRef.current) {
        dispatch(joinRoom(tokenRef.current))
      } else {
        fetchToken({ roomId: roomId!, appId, userId }).then((token) => {
          console.log('#join')
          dispatch(joinRoom(token))
        })
      }
    }

    if (isConnected) {
      return () => {
        console.log('#leave')
        dispatch(leaveRoom())
      }
    }
  }, [oobe, state])

  useEffect(() => {}, [])

  const pinnedBoxRef = useRef<HTMLDivElement>()

  // handle video track get pinned
  useEffect(() => {
    if (!pinnedBoxRef.current) return
    if (pinnedTrackId) {
      const track = refStore.allTracks.find((t) => t.trackID == pinnedTrackId)
      if (track) {
        track.play(pinnedBoxRef.current)
      }
    }
  }, [pinnedBoxRef.current, pinnedTrackId])

  const isConnecting =
    state == QState.CONNECTING || state == QState.RECONNECTING

  const screenSharing = screenVideoTrack != null

  // handle track mute & unmute
  useEffect(() => {
    if (isConnected) {
      // create `camTrack` only if set unmuted to true
      if (!camMuted && !camTrack) {
        console.log('#create CAM')
        dispatch(createTrack('camera'))
      } else if (camMuted && camTrack) {
        console.log('#remove CAM')
        dispatch(removeTrack('camera'))
      }

      // the same logic as camera
      if (!micMuted && !micTrack) {
        console.log('#create MIC')
        dispatch(createTrack('microphone'))
      } else if (micMuted && micTrack) {
        console.log('#remove MIC')
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

  const mobile = isMobile()
  const [bottomBarShown, setBottomBarShown] = useState(true)
  const bottomBarTimeout = 3000
  const closeBottomBar = useDebounce(() => {
    setBottomBarShown(false)
  }, bottomBarTimeout)

  useEffect(() => {
    if (mobile) {
      closeBottomBar()
    }
  }, [mobile])

  const boxRef = useTopRightBox()

  return (
    <Box
      display="contents"
      onClick={() => {
        if (mobile) {
          setBottomBarShown((t) => !t)
          closeBottomBar()
        }
      }}
    >
      {oobe && (
        <OobePanel
          open
          onConfirm={(newSettings) => {
            setOobe(false)
            if (newSettings.neverPrompt) {
              dispatch(save(newSettings))
            } else {
              dispatch(update(newSettings))
            }
          }}
          // onClose={() => setOobe(false)}
        />
      )}
      <DetailPanel
        tracks={[camTrack, micTrack, screenVideoTrack, screenAudioTrack]}
      />
      {boxRef.current &&
        createPortal(
          <StreamingControl disabled={!isConnected} mobile={mobile} />,
          boxRef.current
        )}
      {mobile ? <RoomPage_S /> : <RoomPage_L />}
      <Fade in={bottomBarShown}>
        <Box
          component="footer"
          sx={{
            position: 'fixed',
            height: '60px',
            // zIndex: 114514,
            background: mobile ? '#00000080' : 'inherit',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Tooltip title="复制房间链接">
            <span>
              <IconButton
                disabled={!isConnected}
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                }}
              >
                <ContentCopyRounded />
              </IconButton>
            </span>
          </Tooltip>
          {/* <Tooltip
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
              </Tooltip> */}
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
                  micTrack?.setMuted(true)
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
            disabled={isConnecting || oobe}
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
                  camTrack?.setMuted(true)
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
                disabled={!isConnected || mobile}
                children={<ScreenShareRounded />}
              />
            </span>
          </Tooltip>
        </Box>
      </Fade>
    </Box>
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

  function RoomPage_S() {
    const dispatch = useAppDispatch()
    const { users } = useAppSelector((s) => s.webrtc)

    const parts: RemoteUser[][] = []
    users.forEach((_, i, array) => {
      const n = 4
      // truncate digits using bitwise ops
      const period = (i / n) >> 0
      if (i % n == 0) {
        parts.push(array.slice(period * n, period * n + n))
      }
    })

    return (
      <Box flex={1}>
        <Box
          sx={{
            height: '100%',
            width: '100%',
          }}
        >
          <Swiper pagination modules={[Pagination]}>
            {parts.map((page) => (
              <SwiperSlide>
                <Box
                  sx={{
                    display: 'grid',
                    height: '100%',
                    width: '100%',
                    gap: '.2ch',
                    grid: '1fr 1fr / 1fr 1fr',
                  }}
                >
                  {page.map((user, index, users) => {
                    const color = stringToColor(user.userID) + '80'
                    const bgcolor = stringToColor(user.userID)

                    let gridArea = (() => {
                      switch (users.length) {
                        case 1:
                          return '1 / 1 / span 3 / span 3'
                        case 2:
                          return 'auto / 1 / auto / span 3'
                        case 3:
                          return 'auto'
                        default:
                          return 'auto'
                      }
                    })()

                    return (
                      <UserBox
                        key={user.userID}
                        sx={{
                          // flex: '1 1 40%',
                          width: '100%',
                          height: '100%',
                          gridArea,
                        }}
                        user={user}
                      >
                        <Avatar
                          sx={{
                            margin: 'auto',
                            bgcolor,
                            color,
                            textTransform: 'uppercase',
                            '&>span': {
                              fontSize: '80%',
                              color: '#fff',
                              mixBlendMode: 'difference',
                            },
                          }}
                          children={<span>{user.userID.slice(0, 2)}</span>}
                        />
                      </UserBox>
                    )
                  })}
                </Box>
              </SwiperSlide>
            ))}
          </Swiper>
        </Box>
      </Box>
    )
  }

  function RoomPage_L() {
    const [usersShown, setUsersShown] = useState(true)

    return (
      <>
        <Box
          component="header"
          sx={{
            display: 'flex',
            width: '100%',
            bgcolor: '#aaaaaa10',
            overflow: 'auto',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              mx: 'auto',
            }}
          >
            {users.map((user) => {
              return (
                <UserBox
                  key={user.userID}
                  user={user}
                  sx={{
                    minWidth: '240px',
                    height: '180px',
                  }}
                />
              )
            })}
          </Box>
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
            onDoubleClick={() => {
              dispatch(pinTrack(undefined))
            }}
          >
            <IconButton
              sx={{
                position: 'absolute',
                right: 0,
                top: 0,
                zIndex: 1000,
                display: pinnedTrackId ? 'static' : 'none',
              }}
              onClick={() => {
                dispatch(pinTrack(undefined))
              }}
            >
              <CloseRounded fontSize="medium" />
            </IconButton>
          </Box>
          {camTrack ? (
            <VideoBox
              videoTrack={isVideoTrack(camTrack) ? camTrack : undefined}
              sx={{
                position: 'fixed',
                left: '30px',
                bottom: '30px',
                width: '240px',
                height: '160px',
              }}
            />
          ) : undefined}
        </Box>
      </>
    )
  }
}
