import { LayersRounded, StopRounded, StreamRounded } from '@mui/icons-material'
import {
  Box,
  FormLabel,
  Grow,
  IconButton,
  Paper,
  SwipeableDrawer,
  paperClasses,
} from '@mui/material'
import { QNConnectionState as QState } from 'qnweb-rtc'
import { lazy, memo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'react-router'

import { getRtmpUrl } from '../api'
import {
  changeMode,
  startLive,
  stopLive,
  updateComposedConfig,
} from '../features/streamSlice'
import { useTopRightBox } from '../pages/layout'
import { useAppDispatch, useAppSelector } from '../store'
import { isMobile } from '../utils'
const ComposedConfigForm = lazy(() => import('./ConfigForm'))

const StreamingControl = memo(() => {
  const boxRef = useTopRightBox()
  const { roomId } = useParams()
  if (!roomId) {
    return <></>
  }
  const getUrl = () => getRtmpUrl(roomId, Date.now())

  const { liveState, liveMode, lastLiveMode, lastStreamId } = useAppSelector(
    (s) => s.stream
  )
  const { connectionState: state } = useAppSelector((s) => s.webrtc)
  const disabled = state != QState.CONNECTED && state != QState.RECONNECTED
  const mobile = isMobile()

  const dispatch = useAppDispatch()

  const on = liveState == 'connected'
  const pending = liveState == 'processing'

  const handleLiveToggle = () => {
    if (liveState == 'idle') {
      if (liveMode == 'composed') {
        dispatch(changeMode())
      }
      dispatch(startLive(getUrl()))
    } else if (on) {
      dispatch(
        stopLive({
          liveMode: lastLiveMode!,
          streamID: lastStreamId!,
        })
      )
    }
  }

  const [showConfigPanel, setShowConfigPanel] = useState(false)

  return boxRef.current ? (
    createPortal(
      <>
        <IconButton
          disabled={disabled || pending}
          color={on && lastLiveMode == 'direct' ? 'error' : 'inherit'}
          // loading={liveState.phase == 'pending'}
          onClick={handleLiveToggle}
        >
          {on && lastLiveMode == 'direct' ? (
            <>
              <StopRounded />
              结束推流
            </>
          ) : (
            <>
              <StreamRounded />
              单路转推
            </>
          )}
        </IconButton>
        <IconButton
          disabled={disabled || pending}
          color={on && lastLiveMode == 'composed' ? 'primary' : 'inherit'}
          onClick={() => {
            setShowConfigPanel((p) => !p)
          }}
        >
          <LayersRounded fontSize="large" />
          合流转推
        </IconButton>
        {mobile ? (
          <SwipeableDrawer
            container={document.body}
            anchor="bottom"
            open={showConfigPanel}
            onClick={(e) => e.stopPropagation()}
            onClose={() => {
              setShowConfigPanel(false)
            }}
            onOpen={() => {
              setShowConfigPanel(true)
            }}
            disableSwipeToOpen
            elevation={12}
            sx={{
              [`& > .${paperClasses.root}`]: {
                position: 'fixed',
                left: 0,
                right: 0,
                marginInline: 1,
                borderStartStartRadius: '1rem',
                borderStartEndRadius: '1rem',
                height: 'fit-content',
                // paddingInline: '5%',
                display: 'flex',
                flexDirection: 'column',
              },
            }}
          >
            <Box
              sx={{
                width: 30,
                height: 6,
                margin: '0.5rem auto',
                backgroundColor: 'grey',
                backgroundBlendMode: 'color-dodge',
                borderRadius: 1,
              }}
            />
            <FormLabel
              sx={{
                margin: '.5rem auto',
              }}
            >
              合流设置
            </FormLabel>
            <ComposedConfigForm
              onValidSubmit={(data) => {
                dispatch(updateComposedConfig(data))
                if (liveState == 'connected') {
                  dispatch(startLive(getUrl()))
                }
                setShowConfigPanel(false)
              }}
            />
          </SwipeableDrawer>
        ) : (
          <Grow in={showConfigPanel}>
            <Paper
              sx={{
                display: showConfigPanel ? 'unset' : 'none',
                position: 'absolute',
                // padding: 2,
                top: 'calc(100% + 1rem)',
                right: 0,
                transform: 'translate(-100%, 0)',
                width: '320px',
              }}
            >
              <ComposedConfigForm
                onValidSubmit={(data) => {
                  dispatch(updateComposedConfig(data))
                  if (on) {
                    dispatch(startLive(getUrl()))
                  }
                  setShowConfigPanel(false)
                }}
              />
            </Paper>
          </Grow>
        )}
      </>,
      boxRef.current
    )
  ) : (
    <></>
  )
})

export default StreamingControl
