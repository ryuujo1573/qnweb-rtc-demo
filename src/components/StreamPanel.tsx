import {
  AddCircleOutlineRounded,
  AudiotrackRounded,
  CheckRounded,
  ExpandMoreRounded,
  LayersRounded,
  RestartAltRounded,
  StreamRounded,
  VideocamRounded,
} from '@mui/icons-material'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import {
  Accordion as MuiAccordion,
  AccordionActions,
  AccordionDetails as MuiAccordionDetails,
  AccordionProps,
  AccordionSummary as MuiAccordionSummary,
  AccordionSummaryProps,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Fade,
  FormControlLabel,
  Grid,
  gridClasses,
  Grow,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  ListSubheader,
  MenuItem,
  Paper,
  styled,
  svgIconClasses,
  Switch,
  Tab,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import {
  QNConnectionState as QState,
  QNLiveStreamingState as QLiveState,
  QNRenderMode,
  QNTranscodingLiveStreamingConfig,
  QNTranscodingLiveStreamingTrack,
} from 'qnweb-rtc'
import {
  CSSProperties,
  FormEvent,
  forwardRef,
  Fragment,
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { useParams } from 'react-router'
import { client } from '../api'
import {
  changeMode,
  LiveMode,
  startLive,
  stopLive,
  StreamState,
  updateComposedConfig,
  updateDirectConfig,
} from '../features/streamSlice'
import refStore from '../features/tracks'
import { useTopRightBox } from '../pages/layout'
import { useAppDispatch, useAppSelector } from '../store'
import { debounce, getRtmpUrl, isAudioTrack, isVideoTrack } from '../utils'

export type StreamingControlProps = {
  state: QState
}

export function StreamingControl({ state }: StreamingControlProps) {
  const ref = useTopRightBox()

  const { roomId } = useParams()
  if (!roomId) {
    return <></>
  }
  const getUrl = () => getRtmpUrl(roomId, Date.now())

  const isConnected = state == QState.CONNECTED || state == QState.RECONNECTED
  const { liveState, liveMode, lastLiveMode, lastStreamId } = useAppSelector(
    (s) => s.stream
  )
  const dispatch = useAppDispatch()

  const on = liveState == 'connected'
  const pending = liveState == 'processing'

  const handleModeChange = async (evt: any, mode: string) => {
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

  useEffect(() => {
    function useHandler(type: string) {
      return (streamId: string, state: QLiveState) => {
        console.log(type, streamId, state)
      }
    }
    client.on('direct-livestreaming-state-changed', useHandler('direct'))
    client.on('transcoding-livestreaming-state-changed', useHandler('composed'))
  }, [])

  const [tabValue, setTabValue] = useState(liveMode.slice())
  const [showConfigPanel, setShowConfigPanel] = useState(false)

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
          in={on}
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
          // my: 1,
          maxWidth: '300px',
          maxHeight: '60vh',
          overflow: 'auto',
          borderRadius: 'inherit',
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
        {videoTracks.length == 0 && audioTracks.length == 0 && (
          <Typography m={10} lineHeight={10} variant="caption">
            无可用媒体流
          </Typography>
        )}
        {videoTracks.length ? <ListSubheader children="视频轨" /> : <></>}
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
        {audioTracks.length ? <ListSubheader children="音轨" /> : <></>}
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

const maxBitrate = 204800
const minBitrate = 256

const ComposedConfigForm = () => {
  const theme = useTheme()
  const dispatch = useAppDispatch()
  const { composedConfig } = useAppSelector((s) => s.stream)
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm({
    reValidateMode: 'onBlur',
    values: composedConfig,
  })
  const {
    fields: transcodingTracks,
    append: appendTrack,
    update: updateTrack,
    remove: removeTrack,
  } = useFieldArray({
    control,
    name: 'transcodingTracks',
  })

  const {
    fields: watermarks,
    append: appendWatermark,
    update: updateWatermark,
    remove: removeWatermark,
  } = useFieldArray({
    control,
    name: 'watermarks',
  })

  const { allTracks } = refStore
  const videoTracks = allTracks.filter(isVideoTrack)
  const audioTracks = allTracks.filter(isAudioTrack)

  const { composedConfig: config } = useAppSelector((s) => s.stream)
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

  const [nstExpanded, setExpanded] = useState([false, false])
  const handleExpand = (i: number) => (_evt: unknown, expanded: boolean) => {
    setExpanded((ls) => {
      ls[i] = expanded
      return ls.slice()
    })
  }

  return (
    <Box
      component="form"
      display="flex"
      flexDirection="column"
      onSubmit={handleSubmit((data) => {
        dispatch(updateComposedConfig(data))
      })}
    >
      <Box
        sx={{
          overflowY: 'scroll',
          flex: 1,
        }}
      >
        <Accordion expanded={nstExpanded[0]} onChange={handleExpand(0)}>
          <AccordionSummary aria-controls="settings-1">
            推流设置
          </AccordionSummary>
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
                type="number"
                {...register('maxBitrate', { max: maxBitrate })}
                fullWidth
                defaultValue={config.maxBitrate?.toString()}
                variant="outlined"
                error={!!errors.maxBitrate}
              />
              <TextField
                label="最低码率 (Kbps)"
                type="number"
                {...register('minBitrate', { max: minBitrate })}
                fullWidth
                defaultValue={config.minBitrate?.toString()}
                error={!!errors.minBitrate}
                variant="outlined"
              />
              <TextField
                label="码率 (Kbps)"
                type="number"
                {...register('bitrate', { min: minBitrate, max: maxBitrate })}
                fullWidth
                defaultValue={config.bitrate?.toString()}
                error={!!errors.bitrate}
                variant="outlined"
              />
              <TextField
                label="帧率 / FPS"
                type="number"
                {...register('videoFrameRate', {
                  min: 1,
                  max: 60,
                  required: true,
                })}
                fullWidth
                defaultValue={config.videoFrameRate?.toString() ?? '30'}
                error={!!errors.videoFrameRate}
                variant="outlined"
              />
              <TextField
                label="宽度"
                type="number"
                {...register('width', { min: 100, max: 4096, required: true })}
                fullWidth
                defaultValue={config.width?.toString() ?? '1280'}
                error={!!errors.width}
                variant="outlined"
              />
              <TextField
                label="高度"
                type="number"
                {...register('height', { min: 100, max: 4096, required: true })}
                fullWidth
                defaultValue={config.height?.toString() ?? '720'}
                error={!!errors.height}
                variant="outlined"
              />
              <TextField
                label="渲染模式"
                {...register('renderMode', { required: true })}
                select
                fullWidth
                defaultValue={config.renderMode ?? QNRenderMode.ASPECT_FIT}
                error={!!errors.renderMode}
                variant="outlined"
              >
                {stretchModeList.map(([option, helperText]) => (
                  <MenuItem key={option} value={option}>
                    {helperText}
                  </MenuItem>
                ))}
              </TextField>
              <Grid>
                <FormControlLabel
                  label="保持最后帧"
                  control={
                    <Checkbox
                      {...register('holdLastFrame')}
                      defaultChecked={config.holdLastFrame}
                    />
                  }
                />
              </Grid>
              <Grid>
                <TextField
                  label="背景地址"
                  type="url"
                  {...register('background.url')}
                  fullWidth
                  defaultValue={config.background?.url}
                  error={!!errors.background?.url}
                  variant="outlined"
                />
              </Grid>
              <Grid>
                <TextField
                  label="背景宽度"
                  type="number"
                  {...register('background.width')}
                  fullWidth
                  defaultValue={config.background?.width.toString()}
                  error={!!errors.background?.width}
                  variant="outlined"
                />
              </Grid>
              <Grid>
                <TextField
                  label="背景高度"
                  type="number"
                  {...register('background.height')}
                  fullWidth
                  defaultValue={config.background?.height.toString()}
                  error={!!errors.background?.height}
                  variant="outlined"
                />
              </Grid>
              <Grid>
                <TextField
                  label="背景x轴距离"
                  type="number"
                  {...register('background.x')}
                  fullWidth
                  defaultValue={config.background?.x.toString()}
                  error={!!errors.background?.x}
                  variant="outlined"
                />
              </Grid>
              <Grid>
                <TextField
                  label="背景y轴距离"
                  type="number"
                  {...register('background.y')}
                  fullWidth
                  defaultValue={config.background?.y.toString()}
                  error={!!errors.background?.y}
                  variant="outlined"
                />
              </Grid>
              {watermarks.map((watermark, index, list) => (
                <Fragment key={watermark.id}>
                  <Grid>
                    <TextField
                      label="水印地址"
                      type="url"
                      {...register(`watermarks.${index}.url` as const)}
                      error={!!errors.watermarks?.[index]?.url}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid>
                    <TextField
                      label="水印高度"
                      type="number"
                      {...register(`watermarks.${index}.height` as const)}
                      error={!!errors.watermarks?.[index]?.height}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid>
                    <TextField
                      label="水印宽度"
                      type="number"
                      {...register(`watermarks.${index}.width` as const)}
                      error={!!errors.watermarks?.[index]?.width}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid>
                    <TextField
                      label="水印x轴距离"
                      type="number"
                      {...register(`watermarks.${index}.x` as const)}
                      error={!!errors.watermarks?.[index]?.x}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid>
                    <TextField
                      label="水印y轴距离"
                      type="number"
                      {...register(`watermarks.${index}.y` as const)}
                      error={!!errors.watermarks?.[index]?.y}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                </Fragment>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
        <Accordion expanded={nstExpanded[1]} onChange={handleExpand(1)}>
          <AccordionSummary aria-controls="settings-2">
            合成设置{' '}
            {transcodingTracks.length ? `(${transcodingTracks.length})` : ''}
          </AccordionSummary>
          <AccordionDetails>
            {!allTracks.length ? (
              <Typography
                display="table"
                variant="caption"
                mx="auto"
                lineHeight={6}
              >
                暂无可用媒体流
              </Typography>
            ) : (
              <ListItem>
                <ListItemAvatar>
                  <IconButton
                    onClick={() => {
                      appendTrack({
                        trackID: '',
                      })
                    }}
                  >
                    <AddCircleOutlineRounded />
                  </IconButton>
                </ListItemAvatar>
                <ListItemText>添加媒体流</ListItemText>
              </ListItem>
            )}
            {transcodingTracks.map((trackConfig, index) => {
              const trackID = trackConfig.trackID
              const track =
                refStore.localTracks.get(trackID) ??
                refStore.remoteTracks.get(trackID)
              if (!track) {
                removeTrack(index)
                return <></>
              }

              const userID = track.userID!

              const { id, label, muted, kind } =
                track.getMediaStreamTrack() ?? {}
              const displayId = id?.slice(-12) ?? trackID
              const secondaryText = `[${userID}] #${displayId}`
              const primaryText = label ?? '未知设备'

              const selected = true

              const isVideo = track.isVideo()
              return (
                <Fragment key={trackConfig.id}>
                  <ListItemButton
                    dense
                    disableGutters
                    selected={selected}
                    sx={{
                      [`& .${svgIconClasses.root}`]: {
                        m: 'auto',
                      },
                    }}
                    // remove current from list
                    onClick={() => {
                      removeTrack(index)
                    }}
                  >
                    <ListItemIcon>{selected && <CheckRounded />}</ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          sx={{
                            [`&>.${svgIconClasses.root}`]: {
                              fontSize: 'inherit',
                              verticalAlign: 'middle',
                              mr: '.5ch',
                            },
                          }}
                        >
                          <Tooltip
                            placement="top"
                            title={isVideo ? '视频轨' : '音轨'}
                          >
                            {isVideo ? (
                              <VideocamRounded />
                            ) : (
                              <AudiotrackRounded />
                            )}
                          </Tooltip>
                          {primaryText}
                        </Typography>
                      }
                      secondary={secondaryText}
                    />
                  </ListItemButton>
                  {isVideo && (
                    <Grow in={selected}>
                      <Box
                        p={1}
                        rowGap={1}
                        display={selected ? 'flex' : 'none'}
                        flexDirection="column"
                      >
                        <TextField
                          label="x轴坐标"
                          type="number"
                          {...register(`transcodingTracks.${index}.x` as const)}
                          error={!!errors.transcodingTracks?.[index]?.x}
                          fullWidth
                          variant="outlined"
                        />
                        <TextField
                          label="y轴坐标"
                          type="number"
                          {...register(`transcodingTracks.${index}.y` as const)}
                          error={!!errors.transcodingTracks?.[index]?.y}
                          fullWidth
                          variant="outlined"
                        />
                        <TextField
                          label="层级"
                          type="number"
                          {...register(
                            `transcodingTracks.${index}.zOrder` as const
                          )}
                          error={!!errors.transcodingTracks?.[index]?.zOrder}
                          fullWidth
                          variant="outlined"
                        />
                        <TextField
                          label="宽"
                          type="number"
                          {...register(
                            `transcodingTracks.${index}.width` as const
                          )}
                          error={!!errors.transcodingTracks?.[index]?.width}
                          fullWidth
                          variant="outlined"
                        />
                        <TextField
                          label="高"
                          type="number"
                          {...register(
                            `transcodingTracks.${index}.height` as const
                          )}
                          error={!!errors.transcodingTracks?.[index]?.height}
                          fullWidth
                          variant="outlined"
                        />
                        <TextField
                          select
                          label="渲染模式"
                          {...register(
                            `transcodingTracks.${index}.renderMode` as const
                          )}
                          error={
                            !!errors.transcodingTracks?.[index]?.renderMode
                          }
                          variant="outlined"
                        >
                          {stretchModeList.map(([option, helperText]) => (
                            <MenuItem key={option} value={option}>
                              {helperText}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Box>
                    </Grow>
                  )}
                </Fragment>
              )
            })}
          </AccordionDetails>
        </Accordion>
      </Box>
      <Button
        variant="contained"
        startIcon={<CheckRounded />}
        sx={{ m: 1, position: 'relative', bottom: 0 }}
        type="submit"
      >
        确认
      </Button>
      {/* <Button
        variant="outlined"
        disabled
        startIcon={<RestartAltRounded />}
        // WIP
      >
        重置
      </Button> */}
    </Box>
  )
}
