import {
  CallEndRounded,
  CameraswitchRounded,
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
  MutableRefObject,
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
import Draggable from 'react-draggable'
import { useThrottle } from '../utils/hooks'

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
    facingMode,
    defaultCamera,
    defaultMicrophone,
    defaultPlayback,
    neverPrompt,
    showProfile,
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

  const connected = state == QState.CONNECTED || state == QState.RECONNECTED

  const syncFlag = useRef('idle')

  useEffect(() => {
    // if no OOBE panel, do normal inits
    if (!oobe) {
      if (syncFlag.current == 'idle') {
        syncFlag.current = 'connecting'
        const token = tokenRef.current
        console.log('#join')
        if (token) {
          dispatch(joinRoom({ token }))
        } else {
          dispatch(joinRoom({ roomId }))
        }
      }

      if (syncFlag.current == 'connecting' && connected) {
        syncFlag.current = 'connected'
        return () => {
          if (syncFlag.current == 'connected') {
            console.log('#leave')
            dispatch(removeTrack())
            dispatch(leaveRoom())
          }
        }
      }
    }
  }, [oobe, state])

  useEffect(() => {
    dispatch(checkDevices())
    if (connected) {
      dispatch(leaveRoom())
    }
  }, [])

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
    if (connected) {
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
        dispatch(leaveRoom())
        const modKey = /Mac|iPhone|iPad/.test(navigator.userAgent)
          ? 'metaKey'
          : 'ctrlKey'
        // if click whilst holding ctrl/cmd key,
        if (!evt[modKey]) {
          // the page won't navigate on dev purpose.
          navigate('/')
        }
      } else {
        const token = tokenRef.current
        if (token) {
          dispatch(joinRoom({ token }))
        } else {
          dispatch(joinRoom({ roomId }))
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
  // const [usersShown, setUsersShown] = useState(true)

  // const camBoxRef = useRef<HTMLDivElement>(null)
  // const screenBoxRef = useRef<HTMLDivElement>(null)
  const singleClickHandler = useThrottle(() => {
    if (mobile) {
      setBottomBarShown((t) => !t)
      closeBottomBar()
    }
  }, 200)

  return (
    <Box
      display="contents"
      onDoubleClick={(e) => {
        // e.persist()
        console.log('# contents box dblclick')
      }}
      onClick={singleClickHandler}
    >
      <>
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
        {showProfile && (
          <DetailPanel
            tracks={[camTrack, micTrack, screenVideoTrack, screenAudioTrack]}
          />
        )}
        {boxRef.current &&
          createPortal(
            <StreamingControl disabled={!connected} mobile={mobile} />,
            boxRef.current
          )}
        <Box
          sx={{
            position: 'fixed',
            display: 'flex',
            zIndex: 1000,
            bottom: 0,
          }}
        >
          {camTrack && (
            <VideoBox
              sx={{
                zIndex: 114514,
                width: '240px',
                height: '160px',
                m: 'calc(1rem + 60px) 1rem',
              }}
              videoTrack={isVideoTrack(camTrack) ? camTrack : undefined}
            />
          )}
          {screenVideoTrack && (
            <VideoBox
              sx={{
                width: '240px',
                height: '160px',
              }}
              videoTrack={
                isVideoTrack(screenVideoTrack) ? screenVideoTrack : undefined
              }
              onClick={() => {
                console.log('#clicked')
              }}
            />
          )}
        </Box>
        {mobile ? (
          <RoomPage_S boxRef={pinnedBoxRef} />
        ) : (
          <RoomPage_L boxRef={pinnedBoxRef} />
        )}
        <Fade in={bottomBarShown}>
          <Box
            component="footer"
            sx={{
              position: 'fixed',
              height: '60px',
              zIndex: 114514,
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
                  disabled={!connected}
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                  }}
                >
                  <ContentCopyRounded />
                </IconButton>
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
                  disabled={!connected || !microphones}
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
              color={connected ? 'error' : 'success'}
              onClick={onCallButtonClick(connected)}
              disabled={isConnecting || oobe}
            >
              {connected ? (
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
                  disabled={!connected || !cameras}
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
            {mobile ? (
              <Tooltip title="镜头翻转">
                <span>
                  <IconButton
                    children={<CameraswitchRounded />}
                    disabled={!connected}
                    onClick={() => {
                      dispatch(
                        update({
                          facingMode:
                            facingMode == 'user' ? 'environment' : 'user',
                        })
                      )
                    }}
                  />
                </span>
              </Tooltip>
            ) : (
              <Tooltip leaveDelay={200} title="屏幕共享">
                <span>
                  <IconButton
                    onClick={onScreenShareClick}
                    color={screenSharing ? 'primary' : 'default'}
                    disabled={!connected || mobile}
                    children={<ScreenShareRounded />}
                  />
                </span>
              </Tooltip>
            )}
          </Box>
        </Fade>
      </>
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
}

function RoomPage_S({
  boxRef: ref,
}: {
  boxRef: MutableRefObject<HTMLDivElement | undefined>
}) {
  const { users, pinnedTrackId } = useAppSelector((s) => s.webrtc)
  const dispatch = useAppDispatch()

  // const parts = useMemo(() => {
  const parts: RemoteUser[][] = []
  users.forEach((_, i, array) => {
    const n = 4
    // truncate digits using bitwise ops
    const period = (i / n) >> 0
    if (i % n == 0) {
      parts.push(array.slice(period * n, period * n + n))
    }
  })
  // return parts
  // }, [users])

  const modules = useRef([Pagination])
  let touching = false
  const touchDuration = 800
  return (
    <Box flex={1}>
      <Swiper pagination modules={modules.current}>
        {pinnedTrackId && (
          <SwiperSlide
            onTouchStart={() => {
              touching = true
              setTimeout(
                () => touching && dispatch(pinTrack(undefined)),
                touchDuration
              )
            }}
            onTouchEnd={() => {
              touching = false
            }}
          >
            <Box
              ref={ref}
              sx={{
                display: 'contents',
              }}
            ></Box>
          </SwiperSlide>
        )}
        {parts.map((page, i) => (
          <SwiperSlide key={`page-${i}`}>
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
                      '& .videoBox': {
                        width: '100%',
                        height: '100%',
                      },
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
  )
}

function RoomPage_L({
  boxRef: ref,
}: {
  boxRef: MutableRefObject<HTMLDivElement | undefined>
}) {
  const { users, pinnedTrackId } = useAppSelector((s) => s.webrtc)
  const dispatch = useAppDispatch()
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
          ref={ref}
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
      </Box>
    </>
  )
}
