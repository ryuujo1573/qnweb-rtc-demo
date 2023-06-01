import {
  ContentCopyRounded,
  MicOffRounded,
  MicRounded,
  CallEndRounded,
  RestartAltRounded,
  VideocamOffRounded,
  VideocamRounded,
  CameraswitchRounded,
  ScreenShareRounded,
} from '@mui/icons-material'
import {
  QNLocalVideoTrack,
  QNRemoteVideoTrack,
  QNConnectionState as QState,
} from 'qnweb-rtc'
import { Grow, Box, Tooltip, IconButton, Button } from '@mui/material'
import { success } from '../features/messageSlice'
import {
  setDefaultMicrophone,
  setDefaultCamera,
} from '../features/settingSlice'
import TooltipList from './TooltipList'
import { isMobile, throttle, useDebounce } from '../utils'
import {
  DragEvent,
  MouseEventHandler,
  SyntheticEvent,
  forwardRef,
  useCallback,
  useEffect,
  useState,
} from 'react'
import {
  createTrack,
  joinRoom,
  leaveRoom,
  refStore,
  removeTrack,
  setCameraMuted,
  setMicrophoneMuted,
} from '../features/roomSlice'
import { useAppDispatch } from '../store'
import { useLocation, useNavigate, useParams } from 'react-router'
import { useRoomState, useSettings, useThrottle } from '../utils/hooks'

const BottomBar = forwardRef<{}, {}>(function BottomBar(props, ref) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { roomId } = useParams()
  if (!roomId) {
    return <></>
  }

  const { state: token }: { state: string | null } = useLocation()
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
  } = useSettings()

  const { localTrack, connectionState } = useRoomState()
  const { camTrack, micTrack, screenVideoTrack, screenAudioTrack } =
    refStore.getQNTracks(localTrack)

  const connected =
    connectionState == QState.CONNECTED || connectionState == QState.RECONNECTED

  const isConnecting =
    connectionState == QState.CONNECTING ||
    connectionState == QState.RECONNECTING

  const camPending = localTrack.camera === null
  const micPending = localTrack.microphone === null

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

  const onCamClick = (e: SyntheticEvent) => {
    // call once: creates camTrack if it's undefined, and set muted to false
    if (!camTrack) {
      dispatch(createTrack('camera'))
    } else {
      camTrack.setMuted(true)
      dispatch(removeTrack('camera'))
    }

    e.stopPropagation()
  }

  const onMicClick = (e: SyntheticEvent) => {
    if (!micTrack) {
      dispatch(createTrack('microphone'))
    } else {
      micTrack.setMuted(true)
      dispatch(removeTrack('microphone'))
    }

    e.stopPropagation()
  }

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
          navigate(-1)
        }
      } else {
        if (token) {
          dispatch(joinRoom({ token }))
        } else {
          dispatch(joinRoom({ roomId }))
        }
      }
      evt.stopPropagation()
    }

  const onScreenShareClick = (_evt: SyntheticEvent) => {
    if (!screenVideoTrack) {
      dispatch(createTrack('screenVideo'))
    } else {
      dispatch(removeTrack('screenVideo'))
      dispatch(removeTrack('screenAudio'))
    }
  }

  return (
    <Grow in={bottomBarShown}>
      <Box
        component="footer"
        sx={{
          position: 'fixed',
          height: '60px',
          zIndex: 1150,
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
              onClick={async (e) => {
                await navigator.clipboard.writeText(window.location.href)
                dispatch(success({ message: '房间链接复制成功' }))
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
                  (mic) => mic.deviceId == defaultMicrophone,
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
              disabled={!connected || !microphones || micPending}
              onClick={onMicClick}
              children={micTrack ? <MicRounded /> : <MicOffRounded />}
            />
          </span>
        </Tooltip>
        <Button
          variant="contained"
          color={connected ? 'error' : 'success'}
          onClick={onCallButtonClick(connected)}
          disabled={isConnecting}
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
                  (cam) => cam.deviceId == defaultCamera,
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
              disabled={!connected || !cameras || camPending}
              onClick={onCamClick}
              children={camTrack ? <VideocamRounded /> : <VideocamOffRounded />}
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
                    const [w, h] = [parent.offsetWidth, parent.offsetHeight]
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
                color={screenVideoTrack ? 'primary' : 'default'}
                disabled={!connected || mobile}
                children={<ScreenShareRounded />}
              />
            </span>
          </Tooltip>
        )}
      </Box>
    </Grow>
  )
})
export default BottomBar
