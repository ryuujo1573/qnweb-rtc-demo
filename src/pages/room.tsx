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
  QNLocalVideoTrack,
  QNRemoteVideoTrack,
  QNConnectionState as QState,
} from 'qnweb-rtc'
import React, {
  MouseEventHandler,
  MutableRefObject,
  createContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Pagination } from 'swiper'
import 'swiper/css'
import 'swiper/css/pagination'
import { Swiper, SwiperSlide } from 'swiper/react'

import Draggable from 'react-draggable'
import { SwiperModule } from 'swiper/types'
import { fetchToken, getRtmpUrl } from '../api'
import {
  BottomBar,
  DetailPanel,
  OobePanel,
  StrokeIcon,
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
  joinRoom,
  leaveRoom,
  pinTrack,
  refStore,
  removeTrack,
  unpinTrack,
  setCameraMuted,
  setMicrophoneMuted,
  createTrack,
} from '../features/roomSlice'
import { ThunkAPI, useAppDispatch, useAppSelector } from '../store'
import {
  checkRoomId,
  checkUserId,
  doubleClickHelper,
  isMobile,
  stringToColor,
  useDebounce,
} from '../utils'
import {
  useLiveRoomState,
  useRoomState,
  useSettings,
  useThrottle,
} from '../utils/hooks'

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
  let { state: token }: { state: string | null } = useLocation()
  const { userId } = useAppSelector((s) => s.identity)

  useEffect(() => {
    if (!roomId || !checkRoomId(roomId)) {
      console.log('oops! invalid roomId')
      navigate('/')
    } else if (!userId || !checkUserId(userId)) {
      console.log('oops! no userId')
      navigate(`/`, { state: { jumpto: roomId } })
    }
  }, [roomId, userId])

  if (!roomId || !userId) {
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
  } = useSettings()

  const [showPanel, setShowPanel] = useState(!neverPrompt)

  // session states
  const {
    connectionState: state,
    localTrack,
    pinnedTrackId,
    focusedTrackId,
  } = useRoomState()

  const { liveState, lastLiveMode } = useLiveRoomState()
  const { camTrack, micTrack, screenVideoTrack, screenAudioTrack } =
    refStore.getQNTracks(localTrack)

  useEffect(() => {
    dispatch(
      updateDirectConfig({
        audioTrackId: localTrack.microphone ?? localTrack.screenAudio,
        videoTrackId: localTrack.camera ?? localTrack.screenVideo,
      }),
    )

    if (liveState == 'connected' && lastLiveMode == 'direct') {
      dispatch(startLive(getRtmpUrl(roomId, Date.now())))
    }
  }, [localTrack])

  useEffect(() => {
    // if no OOBE panel, do normal inits
    if (!showPanel) {
      const promise = (async () => {
        token ??= await fetchToken({ roomId, appId, userId })
        const { meta } = await dispatch(joinRoom(token))
        if (meta.requestStatus == 'fulfilled') {
          if (!cameraMuted) {
            dispatch(createTrack('camera'))
          }
          if (!microphoneMuted) {
            dispatch(createTrack('microphone'))
          }
        }
      })()

      return () => {
        dispatch(removeTrack())
        dispatch(leaveRoom())
      }
    }
  }, [showPanel])

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

  const mobile = isMobile()
  const [bottomBarShown, setBottomBarShown] = useState(true)

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
      }
    },
    200,
  )

  return (
    <Box height="100%" onClick={singleClickHandler}>
      <>
        {showPanel && (
          <OobePanel
            open
            onClose={() => {
              setShowPanel(false)
            }}
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
        <BottomBar
          open={bottomBarShown}
          onClose={() => {
            setBottomBarShown(false)
          }}
        />
      </>
    </Box>
  )
}

function RoomPage_S({
  boxRef,
}: {
  boxRef: MutableRefObject<HTMLDivElement | undefined>
}) {
  const { users, pinnedTrackId, focusedTrackId } = useRoomState()
  const dispatch = useAppDispatch()

  // const parts = useMemo(() => {

  const parts: RemoteUser[][] = []

  // ;[
  //   ...users,
  //   ...new Array(11).fill(0).map((_, i) => ({
  //     userID: `C${i}eeper`,
  //     state: QState.CONNECTED,
  //     trackIds: [],
  //   })),
  // ]
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

  const modules = useRef<SwiperModule[]>()
  if (!modules.current) {
    modules.current = [Pagination]
  }

  return (
    <Box height="100%">
      <Swiper pagination modules={modules.current}>
        {pinnedTrackId && (
          <SwiperSlide>
            <Box
              ref={boxRef}
              sx={{
                display: 'contents',
              }}
              {...doubleClickHelper((e) => {
                dispatch(unpinTrack())
              })}
            ></Box>
            <Button
              sx={{
                position: 'absolute',
                right: 0,
                bottom: '60px',
                margin: 1,
                // '& .stroke::before': {
                //   content: "url('data:image/svg+xml,)",
                // },
              }}
              color="inherit"
              variant={pinnedTrackId ? 'text' : 'outlined'}
              onClick={() => {
                dispatch(unpinTrack())
              }}
            >
              <StrokeIcon stroked={!!pinnedTrackId}>
                <PushPinRounded />
              </StrokeIcon>
            </Button>
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
  const { users, pinnedTrackId, focusedTrackId } = useRoomState()
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
  '& video': {
    maxHeight: '240px',
    maxWidth: '240px',
    width: 'auto !important',
    height: 'auto !important',
  },
  height: 'fit-content',
  width: 'fit-content',
  margin: '1rem',
  position: 'fixed',
  bottom: 0,
  right: 0,
  borderRadius: '1rem',
  overflow: 'hidden',
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
