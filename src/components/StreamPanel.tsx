import {
  CheckRounded,
  ExpandMoreRounded,
  LayersRounded,
  RestartAltRounded,
  StreamRounded,
} from '@mui/icons-material'
import {
  Box,
  Button,
  CircularProgress,
  Fade,
  FormControlLabel,
  Grid,
  gridClasses,
  Grow,
  MenuItem,
  Paper,
  Switch,
  Tab,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import {
  QNConnectionState as QState,
  QNLiveStreamingState as QLiveState,
  QNRenderMode,
} from 'qnweb-rtc'
import {
  CSSProperties,
  forwardRef,
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'react-router'
import { client } from '../api'
import {
  changeMode,
  LiveMode,
  startLive,
  stopLive,
  updateComposedConfig,
} from '../features/streamSlice'
import { useTopRightBox } from '../pages/layout'
import { useAppDispatch, useAppSelector } from '../store'
import { getRtmpUrl } from '../utils'
import refStore from '../features/tracks'

export type StreamingControlProps = {
  state: QState
}

export function StreamingControl({ state }: StreamingControlProps) {
  const ref = useTopRightBox()

  const { roomId } = useParams()
  if (!roomId) {
    return <>房间号无效</>
  }
  const serialNum = useRef(0)
  const getUrl = useCallback(() => getRtmpUrl(roomId, serialNum.current++), [])

  const isConnected = state == QState.CONNECTED || state == QState.RECONNECTED
  const { liveState, liveMode } = useAppSelector((s) => s.stream)
  const dispatch = useAppDispatch()

  const on = liveState == 'connected'
  const pending = liveState == 'connecting'

  const handleModeChange = async (evt: any, mode: string) => {
    console.log('# triggered', evt, mode)
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
      dispatch(stopLive())
    }
  }

  useEffect(() => {
    function useHandler(type: string) {
      return (streamId: string, state: QLiveState) => {
        console.log(type, streamId, state)
      }
    }
    client.on('direct-livestreaming-state-changed', useHandler('direct'))
    client.on('transcoding-livestreaming-state-changed', useHandler('composed'))

    return () => {
      // client
    }
  }, [])

  //
  const [tabValue, setTabValue] = useState(liveMode.slice())
  const [showConfigPanel, setShowConfigPanel] = useState(false)
  console.log('#', 'showConfigPanel', showConfigPanel)
  console.log('#', 'tabValue', tabValue)
  return ref.current ? (
    createPortal(
      <>
        <ToggleButton
          value="switch"
          disabled={!isConnected || pending}
          selected={on}
          color={on ? 'error' : 'primary'}
          // loading={liveState.phase == 'pending'}
          onChange={handleLiveToggle}
        >
          {on ? (
            '结束推流'
          ) : pending ? (
            <>
              <CircularProgress
                size="1rem"
                color="inherit"
                thickness={6.4}
                sx={{ mr: '1ch' }}
              />{' '}
              处理中
            </>
          ) : (
            '开启推流'
          )}
        </ToggleButton>
        <Fade
          in={true || on}
          // add "alwayShowDetailed"
        >
          <Box height="50px">
            <ToggleButtonGroup
              // disabled={!on}
              aria-label="livestreaming mode switch"
              exclusive
              value={showConfigPanel ? [liveMode, 'switch'] : [liveMode]}
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
              <StreamingConfigPanel
                selected={tabValue == 'direct' ? 'direct' : 'composed'}
                onChange={(_, newTabValue) => {
                  setTabValue(newTabValue)
                }}
                onConfirm={() => {
                  if (tabValue == liveMode && on) {
                    dispatch(startLive(getUrl()))
                  }
                  setShowConfigPanel(false)
                }}
              />
            </Grow>
          </Box>
        </Fade>
      </>,
      ref.current
    )
  ) : (
    <></>
  )
}

type StreamingConfigProps = {
  selected: LiveMode
  onChange?: (
    event: React.SyntheticEvent<Element, Event>,
    value: LiveMode
  ) => void
  onConfirm?: () => void
  style?: CSSProperties
}

const StreamingConfigPanel = forwardRef<HTMLDivElement, StreamingConfigProps>(
  (props: StreamingConfigProps, ref) => (
    <Paper
      ref={ref}
      sx={{
        position: 'absolute',
        padding: 2,
        top: 'calc(100% + 1rem)',
        left: 0,
        // bgcolor: 'grey',
      }}
      style={props.style}
    >
      <TabContext value={props.selected}>
        <TabList onChange={props.onChange} aria-label="stream mode config">
          <Tab label="单路转推" value="direct" />
          <Tab label="合流转推" value="composed" />
        </TabList>
        <TabPanel value="direct">
          <DirectConfigForm />
        </TabPanel>
        <TabPanel
          value="composed"
          sx={{
            padding: 1,
            width: '300px',
          }}
        >
          <ComposedConfigForm />
        </TabPanel>
      </TabContext>
      <Button
        variant="contained"
        startIcon={<CheckRounded />}
        sx={{ mr: 1 }}
        onClick={props.onConfirm}
      >
        确认
      </Button>
      <Button
        variant="outlined"
        disabled
        startIcon={<RestartAltRounded />}
        // WIP
      >
        重置
      </Button>
    </Paper>
  )
)

function DirectConfigForm() {
  const config = useAppSelector((s) => s.stream).directConfig
  const { localTracks, remoteTracks } = refStore

  const allVideoTracks = [...localTracks, ...remoteTracks]
  return (
    <>
      <Box>{}</Box>
    </>
  )
}
function ComposedConfigForm() {
  const config = useAppSelector((s) => s.stream).composedConfig

  const dispatch = useAppDispatch()

  const setConfig = (newConfig: typeof config) => {
    dispatch(updateComposedConfig(newConfig))
  }
  const mergeConfig = (newConfig: Partial<typeof config>) => {
    dispatch(
      updateComposedConfig({
        ...config,
        ...newConfig,
      })
    )
  }

  return (
    <Grid
      container
      alignItems="center"
      spacing={1}
      sx={{
        height: '60vh',
        overflowY: 'scroll',
        padding: 1,
        gap: 2,
        [`&>.${gridClasses.root}`]: {
          width: '100%',
        },
      }}
    >
      <TextField
        label="最大码率 (Kbps)"
        fullWidth
        value={config.maxBitrate}
        inputProps={{
          inputMode: 'numeric',
          pattern: '[0-9]*',
        }}
        onChange={(event) => {
          const input = ~~event.target.value
          if (input)
            setConfig({
              ...config,
              maxBitrate: input,
            })
        }}
        variant="outlined"
      />
      <Grid>
        <TextField
          label="最低码率"
          fullWidth
          value={config.minBitrate}
          inputProps={{
            inputMode: 'numeric',
            pattern: '[0-9]*',
          }}
          onChange={(event) => {
            const input = ~~event.target.value
            if (input)
              setConfig({
                ...config,
                minBitrate: input,
              })
          }}
          variant="outlined"
        />
      </Grid>
      <Grid>
        <TextField
          label="码率"
          fullWidth
          value={config.bitrate}
          inputProps={{
            inputMode: 'numeric',
            pattern: '[0-9]*',
          }}
          onChange={(event) => {
            const input = ~~event.target.value
            if (input)
              setConfig({
                ...config,
                bitrate: input,
              })
          }}
          variant="outlined"
        />
      </Grid>
      <Grid>
        <TextField
          label="帧率"
          fullWidth
          value={config.videoFrameRate}
          inputProps={{
            inputMode: 'numeric',
            pattern: '[0-9]*',
          }}
          onChange={(event) => {
            const input = ~~event.target.value
            if (input)
              setConfig({
                ...config,
                videoFrameRate: input,
              })
          }}
          variant="outlined"
        />
      </Grid>
      <Grid>
        <TextField
          label="宽度"
          fullWidth
          value={config.width}
          inputProps={{
            inputMode: 'numeric',
            pattern: '[0-9]*',
          }}
          onChange={(event) => {
            const input = ~~event.target.value
            if (input)
              setConfig({
                ...config,
                width: input,
              })
          }}
          variant="outlined"
        />
      </Grid>
      <Grid>
        <TextField
          label="高度"
          fullWidth
          value={config.height}
          inputProps={{
            inputMode: 'numeric',
            pattern: '[0-9]*',
          }}
          onChange={(event) => {
            const input = ~~event.target.value
            if (input)
              setConfig({
                ...config,
                height: input,
              })
          }}
          variant="outlined"
        />
      </Grid>
      <Grid>
        <TextField
          select
          fullWidth
          label="渲染模式"
          variant="outlined"
          value={config.renderMode ?? QNRenderMode.ASPECT_FIT}
          onChange={(event) =>
            setConfig({
              ...config,
              renderMode:
                (event.target.value as QNRenderMode) ||
                QNRenderMode.ASPECT_FILL,
            })
          }
        >
          {[
            [QNRenderMode.ASPECT_FILL, '填充'],
            [QNRenderMode.FILL, '拉伸填充'],
            [QNRenderMode.ASPECT_FIT, '等比例缩放'],
          ].map(([option, helperText]) => (
            <MenuItem key={option} value={option}>
              {helperText}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid>
        <FormControlLabel
          control={
            <Switch
              checked={config.holdLastFrame}
              onChange={(event) =>
                setConfig({
                  ...config,
                  holdLastFrame: event.target.checked,
                })
              }
              value={config.holdLastFrame}
            />
          }
          label="保持最后帧"
        />
      </Grid>
      <Grid>
        <TextField
          label="背景地址"
          fullWidth
          value={config.background!.url}
          variant="outlined"
          onChange={(event) =>
            mergeConfig({
              background: {
                ...config.background!,
                url: event.target.value,
              },
            })
          }
        />
      </Grid>
      <Grid>
        <TextField
          label="背景高度"
          fullWidth
          value={config.background!.height}
          variant="outlined"
          onChange={(event) =>
            mergeConfig({
              background: {
                ...config.background!,
                height: ~~event.target.value,
              },
            })
          }
        />
      </Grid>
      <Grid>
        <TextField
          label="背景宽度"
          fullWidth
          value={config.background!.width}
          variant="outlined"
          onChange={(event) =>
            mergeConfig({
              background: {
                ...config.background!,
                width: ~~event.target.value,
              },
            })
          }
        />
      </Grid>
      <Grid>
        <TextField
          label="背景x轴距离"
          fullWidth
          value={config.background!.x}
          variant="outlined"
          onChange={(event) =>
            mergeConfig({
              background: {
                ...config.background!,
                x: ~~event.target.value,
              },
            })
          }
        />
      </Grid>
      <Grid>
        <TextField
          label="背景y轴距离"
          fullWidth
          value={config.background!.y}
          variant="outlined"
          onChange={(event) =>
            mergeConfig({
              background: {
                ...config.background!,
                y: ~~event.target.value,
              },
            })
          }
        />
      </Grid>
      {config.watermarks?.map((watermark, i, list) => (
        <Fragment key={i}>
          <Grid>
            <TextField
              id="outlined-basic"
              label="水印地址"
              fullWidth
              value={watermark.url}
              variant="outlined"
              onChange={(event) => {
                list[i] = {
                  ...watermark,
                  url: event.target.value,
                }
                mergeConfig({
                  watermarks: list.slice(),
                })
              }}
            />
          </Grid>
          <Grid>
            <TextField
              id="outlined-basic"
              label="水印高度"
              fullWidth
              value={watermark.height}
              variant="outlined"
              onChange={(event) => {
                list[i] = {
                  ...watermark,
                  height: ~~event.target.value,
                }
                mergeConfig({
                  watermarks: list.slice(),
                })
              }}
            />
          </Grid>
          <Grid>
            <TextField
              id="outlined-basic"
              label="水印宽度"
              fullWidth
              value={watermark.width}
              variant="outlined"
              onChange={(event) => {
                list[i] = {
                  ...watermark,
                  width: ~~event.target.value,
                }
                mergeConfig({
                  watermarks: list.slice(),
                })
              }}
            />
          </Grid>
          <Grid>
            <TextField
              id="outlined-basic"
              label="水印x轴距离"
              fullWidth
              value={watermark.x}
              variant="outlined"
              onChange={(event) => {
                list[i] = {
                  ...watermark,
                  x: ~~event.target.value,
                }
                mergeConfig({
                  watermarks: list.slice(),
                })
              }}
            />
          </Grid>
          <Grid>
            <TextField
              id="outlined-basic"
              label="水印y轴距离"
              fullWidth
              value={watermark.y}
              variant="outlined"
              onChange={(event) => {
                list[i] = {
                  ...watermark,
                  y: ~~event.target.value,
                }
                mergeConfig({
                  watermarks: list.slice(),
                })
              }}
            />
          </Grid>
        </Fragment>
      ))}
    </Grid>
  )
}
