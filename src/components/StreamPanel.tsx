import {
  ExpandMoreRounded,
  LayersRounded,
  LiveTvRounded,
  StopRounded,
  StreamRounded,
  VideoSettingsRounded,
} from '@mui/icons-material'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import {
  Box,
  Fade,
  Grow,
  IconButton,
  Paper,
  SwipeableDrawer,
  Tab,
  ToggleButton,
  ToggleButtonGroup,
  paperClasses,
} from '@mui/material'
import { useState } from 'react'
import { useParams } from 'react-router'

import {
  changeMode,
  startLive,
  stopLive,
  updateComposedConfig,
} from '../features/streamSlice'
import { useAppDispatch, useAppSelector } from '../store'
import { getRtmpUrl } from '../utils'
import { ComposedConfigForm, DirectConfigForm } from './ConfigForm'

export type StreamingControlProps = {
  disabled: boolean
  mobile?: boolean
}

export function StreamingControl({ disabled, mobile }: StreamingControlProps) {
  const { roomId } = useParams()
  if (!roomId) {
    return <></>
  }
  const getUrl = () => getRtmpUrl(roomId, Date.now())

  const { liveState, liveMode, lastLiveMode, lastStreamId } = useAppSelector(
    (s) => s.stream
  )
  const dispatch = useAppDispatch()

  const on = liveState == 'connected'
  const pending = liveState == 'processing'

  const handleModeChange = (evt: any, mode: string) => {
    function isValidMode(mode: string): mode is 'direct' | 'composed' {
      return ['direct', 'composed'].includes(mode)
    }
    if (isValidMode(mode) && !pending && mode != liveMode) {
      dispatch(changeMode())
      setTabValue(mode)
      if (on) {
        dispatch(startLive(getUrl()))
      }
    } else if (mode == 'switch') {
      setShowConfigPanel((v) => !v)
    }
  }

  const handleLiveToggle = () => {
    if (liveState == 'idle') {
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

  const [tabValue, setTabValue] = useState(liveMode.slice())
  const [showConfigPanel, setShowConfigPanel] = useState(false)

  return (
    <>
      <IconButton
        disabled={disabled || pending}
        color={on ? 'error' : 'primary'}
        // loading={liveState.phase == 'pending'}
        onClick={handleLiveToggle}
      >
        {on ? (
          <>
            <StopRounded />
            结束推流
          </>
        ) : (
          <>
            <LiveTvRounded />
            开启推流
          </>
        )}
      </IconButton>
      {mobile ? (
        <IconButton
          onClick={() => {
            setShowConfigPanel(true)
          }}
        >
          <VideoSettingsRounded fontSize="large" />
          推流面板
        </IconButton>
      ) : (
        <Fade
          in={on}
          // add "alwayShowDetailed"
        >
          <Box height="50px">
            <ToggleButtonGroup
              aria-label="livestreaming mode switch"
              value={showConfigPanel ? [liveMode, 'switch'] : [liveMode]}
              exclusive
              color="primary"
              onChange={handleModeChange}
            >
              <ToggleButton value="direct" aria-label="direct relay">
                <StreamRounded />
                单路转推
              </ToggleButton>
              <ToggleButton value="composed" aria-label="composed relay">
                <LayersRounded />
                合流转推
              </ToggleButton>
              <ToggleButton value="switch">
                <ExpandMoreRounded />
              </ToggleButton>
            </ToggleButtonGroup>
            <Grow in={showConfigPanel}>
              <Paper
                sx={{
                  position: 'absolute',
                  // padding: 2,
                  top: 'calc(100% + 1rem)',
                  left: 0,
                  [`& .MuiTabPanel-root`]: {
                    padding: 0,
                    maxWidth: '300px',
                    borderRadius: 'inherit',
                  },
                  [`& > button`]: {
                    margin: 20,
                    maxWidth: '300px',
                  },
                }}
              >
                <TabContext
                  value={tabValue == 'direct' ? 'direct' : 'composed'}
                >
                  <TabList
                    onChange={(_, newTabValue) => {
                      setTabValue(newTabValue)
                    }}
                    aria-label="stream mode config"
                  >
                    <Tab label="单路转推" value="direct" />
                    <Tab label="合流转推" value="composed" />
                  </TabList>
                  <TabPanel value="direct">
                    <DirectConfigForm />
                  </TabPanel>
                  <TabPanel value="composed">
                    <ComposedConfigForm
                      onValidSubmit={(data) => {
                        dispatch(updateComposedConfig(data))
                        dispatch(startLive(getUrl()))
                        setShowConfigPanel(false)
                      }}
                    />
                  </TabPanel>
                </TabContext>
              </Paper>
            </Grow>
          </Box>
        </Fade>
      )}
      {mobile && (
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
            zIndex: 114514,
            [`& > .${paperClasses.root}`]: {
              position: 'fixed',
              left: 0,
              right: 0,
              mx: 1,
              borderStartStartRadius: '1rem',
              borderStartEndRadius: '1rem',
              height: 'fit-content',
              px: '5%',
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
          <ToggleButtonGroup
            aria-label="livestreaming mode switch"
            value={tabValue}
            exclusive
            color="primary"
            fullWidth
            onChange={handleModeChange}
          >
            <ToggleButton value="direct" aria-label="direct relay">
              <StreamRounded />
              单路转推
            </ToggleButton>
            <ToggleButton value="composed" aria-label="composed relay">
              <LayersRounded />
              合流转推
            </ToggleButton>
          </ToggleButtonGroup>
          {tabValue == 'direct' ? (
            <DirectConfigForm />
          ) : (
            <ComposedConfigForm
              onValidSubmit={(data) => {
                dispatch(updateComposedConfig(data))
                dispatch(startLive(getUrl()))
                setShowConfigPanel(false)
              }}
            />
          )}
        </SwipeableDrawer>
      )}
    </>
  )
}
