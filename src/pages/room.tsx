import {
  CallEndRounded,
  CameraswitchRounded,
  ContentCopyRounded,
  MicOffRounded,
  MicRounded,
  PushPinRounded,
  RestartAltRounded,
  ScreenShareRounded,
  VideocamOffRounded,
  VideocamRounded,
} from '@mui/icons-material'
import {
  Avatar,
  Box,
  Button,
  Grow,
  IconButton,
  Tooltip,
  styled,
} from '@mui/material'
import {
  QNCameraVideoTrack,
  QNLocalVideoTrack,
  QNMicrophoneAudioTrack,
  QNRemoteVideoTrack,
  QNScreenVideoTrack,
  QNConnectionState as QState,
} from 'qnweb-rtc'
import React, {
  MouseEventHandler,
  MutableRefObject,
  createContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Pagination } from 'swiper'
import 'swiper/css'
import 'swiper/css/pagination'
import { Swiper, SwiperSlide } from 'swiper/react'

import {
  DetailPanel,
  OobePanel,
  TooltipList,
  UserBox,
  VideoBox,
} from '../components'
import StreamingControl from '../components/StreamPanel'
import {
  checkDevices,
  save,
  setDefaultCamera,
  setDefaultMicrophone,
  update,
} from '../features/settingSlice'
import { startLive, updateDirectConfig } from '../features/streamSlice'
import {
  RemoteUser,
  createTrack,
  joinRoom,
  leaveRoom,
  pinTrack,
  refStore,
  removeTrack,
  unpinTrack,
} from '../features/webrtcSlice'
import { store, useAppDispatch, useAppSelector } from '../store'
import {
  checkRoomId,
  checkUserId,
  isMobile,
  isVideoTrack,
  stringToColor,
  useDebounce,
} from '../utils'
import Draggable from 'react-draggable'
import { useThrottle } from '../utils/hooks'
import { getRtmpUrl } from '../api'

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
    focusedTrackId,
  } = useAppSelector((s) => s.webrtc)
  const { liveState, lastLiveMode } = useAppSelector((s) => s.stream)
  const { camTrack, micTrack, screenVideoTrack, screenAudioTrack } =
    refStore.getQNTracks(localTrack)
  const [oobe, setOobe] = useState(!neverPrompt)

  useEffect(() => {
    dispatch(
      updateDirectConfig({
        audioTrackId: localTrack.microphone ?? localTrack.screenAudio,
        videoTrackId: localTrack.camera ?? localTrack.screenVideo,
      })
    )

    if (liveState == 'connected' && lastLiveMode == 'direct') {
      dispatch(startLive(getRtmpUrl(roomId, Date.now())))
    }
  }, [localTrack])

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
        // console.log('#create CAM')
        dispatch(createTrack('camera'))
      } else if (camMuted && camTrack) {
        // console.log('#remove CAM')
        dispatch(removeTrack('camera'))
      }

      // the same logic as camera
      if (!micMuted && !micTrack) {
        // console.log('#create MIC')
        dispatch(createTrack('microphone'))
      } else if (micMuted && micTrack) {
        // console.log('#remove MIC')
        dispatch(removeTrack('microphone'))
      }
    }
  }, [state, camMuted, micMuted])

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
      evt.stopPropagation()
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

  // const [usersShown, setUsersShown] = useState(true)

  const camBoxRef = useRef<HTMLDivElement>(null)
  // const screenBoxRef = useRef<HTMLDivElement>(null)
  const singleClickHandler = useThrottle(
    (e: React.MouseEvent<HTMLDivElement>) => {
      let elem = e.target as HTMLElement

      // loop from the most inner to the current level
      // to find out if there's an ancestor button
      while (elem.parentElement && elem.parentElement != e.currentTarget) {
        if ('type' in elem && elem.type == 'button') {
          // stop propagation
          return
        }
        elem = elem.parentElement
      }
      if (mobile) {
        setBottomBarShown((t) => !t)
        closeBottomBar()
      }
    },
    200
  )

  // console.log('# RoomPage render, track', camTrack)
  Object.assign(window, { camTrack })

  return (
    <Box
      display="flex"
      flexDirection="column"
      maxHeight="100%"
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
        <StreamingControl />
        {mobile ? (
          camTrack && (
            <Draggable
              bounds="body"
              nodeRef={camBoxRef}
              defaultPosition={{
                y: -60,
                x: 0,
              }}
            >
              <FloatVideoBox ref={camBoxRef} videoTrack={camTrack} />
            </Draggable>
          )
        ) : (
          <MonitorBox>
            {camTrack && <VideoBox videoTrack={camTrack} />}
            {screenVideoTrack && <VideoBox videoTrack={screenVideoTrack} />}
          </MonitorBox>
        )}

        {mobile ? (
          <RoomPage_S boxRef={pinnedBoxRef} />
        ) : (
          <RoomPage_L boxRef={pinnedBoxRef} />
        )}
        {bottomBarShown && (
          <Grow in={bottomBarShown}>
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
                    onClick={(e) => {
                      navigator.clipboard.writeText(window.location.href)
                      e.stopPropagation()
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
                    onClick={(e) => {
                      micTrack?.setMuted(true)
                      setMicMuted(!micMuted)
                      e.stopPropagation()
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
                        alert(JSON.stringify(cameras))
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
                    onClick={(e) => {
                      camTrack?.setMuted(true)
                      setCamMuted(!camMuted)
                      e.stopPropagation()
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
                      disabled={!connected || !camTrack}
                      onClick={async (e) => {
                        const parent = camTrack?.mediaElement?.parentElement
                        if (parent) {
                          const [w, h] = [
                            parent.offsetWidth,
                            parent.offsetHeight,
                          ]
                          parent.style.width = w + 'px'
                          parent.style.height = h + 'px'
                          await camTrack.switchCamera()
                          // TODO: fix flickering
                          camTrack.play(parent, { mirror: false })
                          // debouncing
                          closeBottomBar()
                        }
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
          </Grow>
        )}
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
  boxRef,
}: {
  boxRef: MutableRefObject<HTMLDivElement | undefined>
}) {
  const { users, pinnedTrackId, focusedTrackId } = useAppSelector(
    (s) => s.webrtc
  )
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
          <SwiperSlide>
            <IconButton
              sx={{
                position: 'absolute',
                right: 0,
                bottom: '60px',
                margin: 2,
              }}
            >
              <PushPinRounded />
            </IconButton>
            <Box
              ref={boxRef}
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
  boxRef,
}: {
  boxRef: MutableRefObject<HTMLDivElement | undefined>
}) {
  const { users, pinnedTrackId, focusedTrackId } = useAppSelector(
    (s) => s.webrtc
  )
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
          ref={boxRef}
          sx={{
            display: 'contents',
            backgroundColor: 'black',
            '&>video': {
              // width: 'inherit !important',
              margin: 'auto',
            },
          }}
          onDoubleClick={() => {
            if (pinnedTrackId == undefined && focusedTrackId) {
              dispatch(pinTrack(focusedTrackId))
            } else {
              dispatch(unpinTrack())
            }
          }}
        ></Box>
      </Box>
    </>
  )
}

const FloatVideoBox = styled(VideoBox)({
  zIndex: 1000,
  maxHeight: '240px',
  maxWidth: '240px',
  height: 'fit-content',
  width: 'fit-content',
  margin: '1rem',
  position: 'fixed',
  bottom: 0,
  right: 0,
  border: '2px solid',
  borderColor: 'ActiveBorder',
  borderRadius: '1rem',
  overflow: 'clip',
})

const MonitorBox = styled(Box)({
  position: 'fixed',
  display: 'flex',
  margin: '1rem',
  gap: '1rem',
  bottom: 0,
  left: 0,
  zIndex: 1000,
  '& .videoBox': {
    width: '240px',
    height: '160px',
  },
})
