import {
  CheckRounded,
  ExpandMoreRounded,
  LayersRounded,
  RestartAltRounded,
  StreamRounded,
} from '@mui/icons-material'
import {
  Accordion as MuiAccordion,
  AccordionDetails as MuiAccordionDetails,
  AccordionProps,
  AccordionSummary as MuiAccordionSummary,
  AccordionSummaryProps,
  Box,
  Button,
  CircularProgress,
  Fade,
  FormControlLabel,
  Grid,
  gridClasses,
  Grow,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  MenuItem,
  Paper,
  styled,
  Switch,
  Tab,
  tabClasses,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
} from '@mui/material'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import {
  QNConnectionState as QState,
  QNLiveStreamingState as QLiveState,
  QNLocalAudioTrack,
  QNLocalVideoTrack,
  QNRemoteVideoTrack,
  QNRenderMode,
  QNTranscodingLiveStreamingConfig,
  QNTranscodingLiveStreamingTrack,
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
  updateDirectConfig,
} from '../features/streamSlice'
import { useTopRightBox } from '../pages/layout'
import { useAppDispatch, useAppSelector } from '../store'
import { getRtmpUrl, isAudioTrack, isVideoTrack } from '../utils'
import refStore from '../features/tracks'

export type StreamingControlProps = {
  state: QState
}

export function StreamingControl({ state }: StreamingControlProps) {
  const ref = useTopRightBox()

  const { roomId } = useParams()
  if (!roomId) {
    return <></>
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
  const [tabValue, setTabValue] = useState(true ? 'composed' : liveMode.slice())
  const [showConfigPanel, setShowConfigPanel] = useState(true || false)
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
          sx={{
            width: '14ch',
          }}
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
        // padding: 2,
        top: 'calc(100% + 1rem)',
        left: 0,
        [`& > .MuiTabPanel-root`]: {
          p: 0,
          my: 1,
          maxWidth: '300px',

          maxHeight: '60vh',
          overflowY: 'scroll',
        },
        [`& > button`]: {
          margin: 2,
          maxWidth: '300px',
        },
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
        <TabPanel value="composed">
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
  const dispatch = useAppDispatch()
  const { allTracks } = refStore
  const videoTracks = allTracks.filter(isVideoTrack)
  const audioTracks = allTracks.filter(isAudioTrack)
  const handleVideoTrackClick = (videoTrackId: string) => () => {
    dispatch(
      updateDirectConfig({
        audioTrackId: config.audioTrackId,
        videoTrackId,
      })
    )
  }

  const handleAudioTrackClick = (audioTrackId: string) => () => {
    dispatch(
      updateDirectConfig({
        videoTrackId: config.videoTrackId,
        audioTrackId,
      })
    )
  }

  return (
    <>
      <List dense disablePadding>
        {videoTracks.length ? <ListSubheader children="视频轨道" /> : <></>}
        {videoTracks.map((vt) => {
          const tid = vt.trackID!
          const { id, label, muted } = vt.getMediaStreamTrack() ?? {}
          return (
            <ListItemButton
              key={tid}
              selected={config.videoTrackId == tid}
              onClick={handleVideoTrackClick(tid)}
            >
              <ListItemText
                primary={label ?? '未知视频设备'}
                secondary={id ?? `[${tid}]`}
              />
            </ListItemButton>
          )
        })}
        {audioTracks.length ? <ListSubheader children="音频轨道" /> : <></>}
        {audioTracks.map((at) => {
          const tid = at.trackID!
          const { id, label, muted } = at.getMediaStreamTrack() ?? {}
          return (
            <ListItemButton
              key={tid}
              selected={config.audioTrackId == tid}
              onClick={handleAudioTrackClick(tid)}
            >
              <ListItemText
                primary={label ?? '未知音频设备'}
                secondary={id ?? `[${tid}]`}
              />
            </ListItemButton>
          )
        })}
      </List>
    </>
  )
}

const stretchModeList = [
  [QNRenderMode.ASPECT_FILL, '填充'],
  [QNRenderMode.FILL, '拉伸填充'],
  [QNRenderMode.ASPECT_FIT, '等比例缩放'],
]
function ComposedConfigForm() {
  const { composedConfig: config, liveState } = useAppSelector((s) => s.stream)

  const dispatch = useAppDispatch()
  const { allTracks } = refStore
  const videoTracks = allTracks.filter(isVideoTrack)
  const audioTracks = allTracks.filter(isAudioTrack)

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

  const theme = useTheme()
  const Accordion = styled((props: AccordionProps) => (
    <MuiAccordion disableGutters elevation={0} square {...props} />
  ))(({ theme }) => ({
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 0,
    '&:not(:last-child)': {
      borderBottom: 0,
    },
    '&:before': {
      display: 'none',
    },
  }))

  const AccordionSummary = styled((props: AccordionSummaryProps) => (
    <MuiAccordionSummary
      expandIcon={<ExpandMoreRounded sx={{ fontSize: '0.9rem' }} />}
      {...props}
    />
  ))(({ theme }) => ({
    position: 'sticky',
    top: 0,
    zIndex: 2,
    background:
      theme.palette.mode === 'dark' ? 'hsl(0,0%,26%)' : 'hsl(0,0%,80%)',
    flexDirection: 'row-reverse',
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
      transform: 'rotate(180deg)',
    },
    '& .MuiAccordionSummary-content': {
      marginLeft: theme.spacing(1),
    },
  }))

  const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
    padding: 0,
    borderTop: '1px solid rgba(0, 0, 0, .125)',
    backgroundColor:
      theme.palette.mode === 'dark' ? 'hsl(0,0%,20%)' : 'hsl(0,0%,85%)',
  }))

  const [composedTracks, setComposedTracks] = useState<
    QNTranscodingLiveStreamingTrack[]
  >([])
  const [nstExpanded, setExpanded] = useState([
    liveState == 'idle',
    liveState == 'connected',
  ])
  const handleExpand = (i: number) => (_evt: unknown, expanded: boolean) => {
    setExpanded((ls) => {
      ls[i] = expanded
      return ls.slice()
    })
  }

  return (
    <>
      <Accordion expanded={nstExpanded[0]} onChange={handleExpand(0)}>
        <AccordionSummary aria-controls="settings-1">推流设置</AccordionSummary>
        <AccordionDetails>
          <Grid
            container
            alignItems="center"
            // spacing={1}
            sx={{
              px: 2,
              py: 2,
              gap: 2,
              width: 'fit-content',
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
                {stretchModeList.map(([option, helperText]) => (
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
        </AccordionDetails>
      </Accordion>
      <Accordion expanded={nstExpanded[1]} onChange={handleExpand(1)}>
        <AccordionSummary aria-controls="settings-2">
          合成设置 {composedTracks.length ? `(${composedTracks.length})` : ''}
        </AccordionSummary>
        <AccordionDetails>
          {videoTracks.map((track, index) => {
            const trackID = track.trackID!
            const trackConfig = composedTracks.find(
              (config) => config.trackID == trackID
            )
            const selected = !!trackConfig

            const { id, label, muted } = track.getMediaStreamTrack() ?? {}

            function handleUpdate<
              T extends keyof QNTranscodingLiveStreamingTrack
            >(
              key: T,
              index: number,
              value: QNTranscodingLiveStreamingTrack[T]
            ): void {
              trackConfig![key] = value
            }

            return (
              <>
                <ListItemButton
                  dense
                  selected={selected}
                  onClick={() => {
                    if (selected) {
                      // remove current from list
                      setComposedTracks((confs) =>
                        confs.filter((conf) => conf.trackID != trackID)
                      )
                    } else {
                      setComposedTracks((confs) => [
                        ...confs,
                        {
                          trackID,
                        },
                      ])
                    }
                  }}
                >
                  <ListItemIcon>
                    {selected ? <CheckRounded /> : <></>}
                  </ListItemIcon>
                  <ListItemText
                    primary={label ?? '未知视频轨道'}
                    secondary={id ?? `[${trackID}]`}
                  />
                </ListItemButton>
                <Grow in={selected}>
                  <Box
                    p={1}
                    rowGap={1}
                    display={selected ? 'flex' : 'none'}
                    flexDirection="column"
                  >
                    <TextField
                      id="outlined-basic"
                      label="x轴坐标"
                      fullWidth
                      value={trackConfig?.x}
                      onChange={(event) =>
                        handleUpdate('x', index, ~~event.target.value)
                      }
                      variant="outlined"
                    />
                    <TextField
                      id="outlined-basic"
                      label="y轴坐标"
                      fullWidth
                      value={trackConfig?.y}
                      onChange={(event) =>
                        handleUpdate('y', index, ~~event.target.value)
                      }
                      variant="outlined"
                    />
                    <TextField
                      id="outlined-basic"
                      label="层级"
                      fullWidth
                      value={trackConfig?.zOrder}
                      onChange={(event) =>
                        handleUpdate('zOrder', index, ~~event.target.value)
                      }
                      variant="outlined"
                    />
                    <TextField
                      id="outlined-basic"
                      label="宽"
                      fullWidth
                      value={trackConfig?.width}
                      onChange={(event) =>
                        handleUpdate('width', index, ~~event.target.value)
                      }
                      variant="outlined"
                    />
                    <TextField
                      id="outlined-basic"
                      label="高"
                      fullWidth
                      value={trackConfig?.height}
                      onChange={(event) =>
                        handleUpdate('height', index, ~~event.target.value)
                      }
                      variant="outlined"
                    />
                    <TextField
                      select
                      label="渲染模式"
                      variant="outlined"
                      value={trackConfig?.renderMode}
                      onChange={(event) =>
                        handleUpdate(
                          'renderMode',
                          index,
                          (event.target.value as QNRenderMode) ||
                            QNRenderMode.ASPECT_FILL
                        )
                      }
                    >
                      {stretchModeList.map(([option, helperText]) => (
                        <MenuItem key={option} value={option}>
                          {helperText}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>
                </Grow>
              </>
            )
          })}
        </AccordionDetails>
      </Accordion>
    </>
  )
}
