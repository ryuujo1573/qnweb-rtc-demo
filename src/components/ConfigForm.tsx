import {
  AddCircleOutlineRounded,
  AudiotrackRounded,
  CheckRounded,
  ExpandMoreRounded,
  HideSourceRounded,
  LiveTvRounded,
  SaveAltRounded,
  SaveOutlined,
  SaveRounded,
  StopCircleOutlined,
  StopCircleRounded,
  StopRounded,
  VideocamRounded,
} from '@mui/icons-material'
import {
  AccordionProps,
  AccordionSummaryProps,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  Grow,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  MenuItem,
  Accordion as MuiAccordion,
  AccordionDetails as MuiAccordionDetails,
  AccordionSummary as MuiAccordionSummary,
  TextField,
  Tooltip,
  Typography,
  accordionDetailsClasses,
  gridClasses,
  styled,
  svgIconClasses,
  useTheme,
} from '@mui/material'
import { QNLiveStreamingState as QLiveState, QNRenderMode } from 'qnweb-rtc'
import { Fragment, forwardRef, useEffect, useRef, useState } from 'react'
import { FieldError, get, useFieldArray, useForm } from 'react-hook-form'

import {
  ComposedConfig,
  changeMode,
  startLive,
  stopLive,
  updateComposedConfig,
  updateDirectConfig,
} from '../features/streamSlice'
import { useAppDispatch, useAppSelector } from '../store'
import { isAudioTrack, isVideoTrack, notNull, valuable } from '../utils'
import { getRtmpUrl } from '../api'
import { useParams } from 'react-router'
import { useFormAction, useSubmit } from 'react-router-dom'
import { refStore } from '../features/webrtcSlice'

const Accordion = styled((props: AccordionProps) => (
  <MuiAccordion disableGutters elevation={0} {...props} />
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
  background: theme.palette.mode === 'dark' ? 'hsl(0,0%,35%)' : 'hsl(0,0%,80%)',
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

export const DirectConfigPanel = forwardRef<HTMLDivElement>((_, ref) => {
  const config = useAppSelector((s) => s.stream.directConfig)
  const dispatch = useAppDispatch()

  const { camera, microphone, screenVideo, screenAudio } = useAppSelector(
    (s) => s.webrtc.localTrack
  )

  const localTracks = Array.from(
    refStore.matchLocalTracks(camera, microphone, screenVideo, screenAudio)
  )
  const [cameraTrack, microphoneTrack, screenVideoTrack, screenAudioTrack] =
    localTracks

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

  const videoTracks = localTracks.filter(isVideoTrack)
  const audioTracks = localTracks.filter(isAudioTrack)

  return (
    <Box ref={ref}>
      <List dense disablePadding>
        {localTracks.every((t) => t == undefined) && (
          <Typography
            display="table"
            mx="auto"
            lineHeight={10}
            variant="caption"
          >
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
    </Box>
  )
})

const stretchModeList = [
  [QNRenderMode.ASPECT_FILL, '填充'],
  [QNRenderMode.FILL, '拉伸填充'],
  [QNRenderMode.ASPECT_FIT, '等比例缩放'],
]

const maxBitrate = 204800
const minBitrate = 256

type FormProps<T = {}> = {
  onValidSubmit: (data: T) => void
}

export const ComposedConfigForm = forwardRef<
  HTMLFormElement,
  FormProps<ComposedConfig>
>(({ onValidSubmit }, ref) => {
  //#region variables
  const theme = useTheme()
  const dispatch = useAppDispatch()
  const { composedConfig } = useAppSelector((s) => s.stream)

  const { roomId } = useParams()
  if (!roomId) {
    return <></>
  }

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isValid },
    control,
  } = useForm({
    reValidateMode: 'onChange',
    defaultValues: composedConfig,
    criteriaMode: 'all',
  })

  const setupField = function <TName extends Parameters<typeof register>[0]>(
    name: TName,
    option?: Parameters<typeof register<TName>>[1]
  ) {
    const error: FieldError | undefined = get(errors, name)
    return {
      ...register(name, option),
      error: !!error,
      helperText: error?.message,
    }
  }

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

  const {
    composedConfig: config,
    liveState,
    liveMode,
    lastLiveMode,
    lastStreamId,
  } = useAppSelector((s) => s.stream)

  const [pendingNewTrackId, setNewTrackId] = useState('')
  const [nstExpanded, setExpanded] = useState([false, false])
  const handleExpand = (i: number) => (_evt: unknown, expanded: boolean) => {
    setExpanded((ls) => {
      ls[i] = expanded
      return ls.slice()
    })
  }

  const online = liveState == 'connected'
  const offline = liveState == 'idle'
  const pending = liveState == 'processing'
  //#endregion

  const formRef = useRef<HTMLFormElement>()

  return (
    <Box
      ref={(form: HTMLFormElement) => {
        if (ref) {
          if (typeof ref == 'function') {
            ref(form)
          } else {
            ref.current = form
          }
        }
        formRef.current = form
      }}
      component="form"
      display="flex"
      flexDirection="column"
      onSubmit={handleSubmit(onValidSubmit)}
    >
      <Box
        sx={{
          maxHeight: '60vh',
          overflowY: 'scroll',
          flex: 1,
        }}
      >
        <MuiAccordion expanded={nstExpanded[0]} onChange={handleExpand(0)}>
          <MuiAccordionSummary
            aria-controls="settings-1"
            expandIcon={<ExpandMoreRounded />}
          >
            推流设置
          </MuiAccordionSummary>
          <MuiAccordionDetails>
            <Grid
              container
              alignItems="center"
              // spacing={1}
              sx={{
                // px: 2,
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
                fullWidth
                variant="outlined"
                helperText={errors.maxBitrate?.message}
                {...register('maxBitrate', {
                  // pattern: /\d+/,
                  value: config.maxBitrate,
                  valueAsNumber: true,
                  max: {
                    message: `演示码率上限为 ${maxBitrate} Kbps`,
                    value: maxBitrate,
                  },
                  min: {
                    value: minBitrate,
                    message: `演示码率最低为 ${minBitrate} Kbps`,
                  },
                })}
                error={!!errors.maxBitrate}
              />
              <TextField
                label="最低码率 (Kbps)"
                type="number"
                {...register('minBitrate', {
                  valueAsNumber: true,
                  max: {
                    message: `演示码率上限为 ${maxBitrate} Kbps`,
                    value: maxBitrate,
                  },
                  min: {
                    value: minBitrate,
                    message: `演示码率最低为 ${minBitrate} Kbps`,
                  },
                })}
                fullWidth
                defaultValue={config.minBitrate?.toString()}
                error={!!errors.minBitrate}
                variant="outlined"
              />
              <TextField
                label="码率 (Kbps)"
                type="number"
                {...setupField('bitrate', {
                  valueAsNumber: true,
                  max: {
                    message: `演示码率上限为 ${maxBitrate} Kbps`,
                    value: maxBitrate,
                  },
                  min: {
                    value: minBitrate,
                    message: `演示码率最低为 ${minBitrate} Kbps`,
                  },
                })}
                fullWidth
                defaultValue={config.bitrate?.toString()}
                error={!!errors.bitrate}
                variant="outlined"
              />
              <TextField
                label="帧率 / FPS"
                type="number"
                {...setupField('videoFrameRate', {
                  required: true,
                  valueAsNumber: true,
                  validate: {
                    inRange: (v) =>
                      (v && v > 0 && v <= 60) || `帧率范围 0 ~ 60 FPS`,
                  },
                })}
                fullWidth
                defaultValue={config.videoFrameRate?.toString() ?? '30'}
                variant="outlined"
              />
              <TextField
                label="宽度"
                type="number"
                {...setupField('width', {
                  valueAsNumber: true,
                  min: 100,
                  max: 4096,
                  required: true,
                })}
                fullWidth
                defaultValue={config.width?.toString() ?? '1280'}
                error={!!errors.width}
                variant="outlined"
              />
              <TextField
                label="高度"
                type="number"
                {...setupField('height', {
                  valueAsNumber: true,
                  min: 100,
                  max: 4096,
                  required: true,
                })}
                fullWidth
                defaultValue={config.height?.toString() ?? '720'}
                error={!!errors.height}
                variant="outlined"
              />
              <TextField
                label="渲染模式"
                {...setupField('renderMode', { required: true })}
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
                      {...setupField('holdLastFrame')}
                      defaultChecked={config.holdLastFrame}
                    />
                  }
                />
              </Grid>
              <Grid>
                <TextField
                  label="背景地址"
                  type="url"
                  {...setupField('background.url')}
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
                  {...setupField('background.width', { valueAsNumber: true })}
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
                  {...setupField('background.height', { valueAsNumber: true })}
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
                  {...setupField('background.x', { valueAsNumber: true })}
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
                  {...setupField('background.y', { valueAsNumber: true })}
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
                      {...setupField(`watermarks.${index}.url` as const)}
                      error={!!errors.watermarks?.[index]?.url}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid>
                    <TextField
                      label="水印高度"
                      type="number"
                      {...setupField(`watermarks.${index}.height` as const, {
                        valueAsNumber: true,
                      })}
                      error={!!errors.watermarks?.[index]?.height}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid>
                    <TextField
                      label="水印宽度"
                      type="number"
                      {...setupField(`watermarks.${index}.width` as const, {
                        valueAsNumber: true,
                      })}
                      error={!!errors.watermarks?.[index]?.width}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid>
                    <TextField
                      label="水印x轴距离"
                      type="number"
                      {...setupField(`watermarks.${index}.x` as const, {
                        valueAsNumber: true,
                      })}
                      error={!!errors.watermarks?.[index]?.x}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid>
                    <TextField
                      label="水印y轴距离"
                      type="number"
                      {...setupField(`watermarks.${index}.y` as const, {
                        valueAsNumber: true,
                      })}
                      error={!!errors.watermarks?.[index]?.y}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                </Fragment>
              ))}
            </Grid>
          </MuiAccordionDetails>
        </MuiAccordion>
        <MuiAccordion expanded={nstExpanded[1]} onChange={handleExpand(1)}>
          <MuiAccordionSummary
            aria-controls="settings-2"
            expandIcon={<ExpandMoreRounded />}
          >
            合成设置{' '}
            {transcodingTracks.length ? `(${transcodingTracks.length})` : ''}
          </MuiAccordionSummary>
          <MuiAccordionDetails
            sx={{
              // [`.${accordionDetailsClasses.root}`]: {
              paddingInline: 0,
              // },
            }}
          >
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
              <Grow in={nstExpanded[1]}>
                <Box
                  sx={{
                    display: 'flex',
                    m: 1,
                  }}
                >
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="选择媒体轨道"
                    value={pendingNewTrackId}
                    onChange={(evt) => {
                      setNewTrackId(evt.target.value)
                    }}
                  >
                    {allTracks.map((t) => {
                      return (
                        <MenuItem key={t.trackID} value={t.trackID}>
                          {t.userID} | {t.trackID}
                        </MenuItem>
                      )
                    })}
                  </TextField>
                  <Button
                    disabled={!pendingNewTrackId}
                    onClick={() => {
                      if (pendingNewTrackId) {
                        appendTrack({
                          trackID: pendingNewTrackId,
                        })
                      }
                    }}
                  >
                    添加
                  </Button>
                </Box>
              </Grow>
            )}
            {transcodingTracks.map((trackConfig, index) => {
              const trackID = trackConfig.trackID
              const track =
                refStore.localTracksMap.get(trackID) ??
                refStore.remoteTracksMap.get(trackID)
              if (!track) {
                removeTrack(index)
                return <></>
              }

              const userID = track.userID!

              const { id, label, muted, kind } =
                track.getMediaStreamTrack() ?? {}
              const displayId = id?.slice(-12) ?? trackID
              const secondaryText = `[${userID}] #${displayId}`
              const primaryText =
                label == 'MediaStreamAudioDestinationNode'
                  ? '默认麦克风'
                  : label ?? '未知设备'

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
                        p={2}
                        rowGap={1}
                        display={selected ? 'flex' : 'none'}
                        flexDirection="column"
                      >
                        <TextField
                          label="x轴坐标"
                          type="number"
                          {...setupField(
                            `transcodingTracks.${index}.x` as const,
                            {
                              valueAsNumber: true,
                            }
                          )}
                          error={!!errors.transcodingTracks?.[index]?.x}
                          // size="small"
                          fullWidth
                          variant="outlined"
                        />
                        <TextField
                          label="y轴坐标"
                          type="number"
                          {...setupField(
                            `transcodingTracks.${index}.y` as const,
                            {
                              valueAsNumber: true,
                            }
                          )}
                          error={!!errors.transcodingTracks?.[index]?.y}
                          // size="small"
                          fullWidth
                          variant="outlined"
                        />
                        <TextField
                          label="层级"
                          type="number"
                          {...setupField(
                            `transcodingTracks.${index}.zOrder` as const,
                            {
                              valueAsNumber: true,
                            }
                          )}
                          error={!!errors.transcodingTracks?.[index]?.zOrder}
                          // size="small"
                          fullWidth
                          variant="outlined"
                        />
                        <TextField
                          label="宽"
                          type="number"
                          {...setupField(
                            `transcodingTracks.${index}.width` as const,
                            {
                              valueAsNumber: true,
                            }
                          )}
                          error={!!errors.transcodingTracks?.[index]?.width}
                          // size="small"
                          fullWidth
                          variant="outlined"
                        />
                        <TextField
                          label="高"
                          type="number"
                          {...setupField(
                            `transcodingTracks.${index}.height` as const,
                            {
                              valueAsNumber: true,
                            }
                          )}
                          error={!!errors.transcodingTracks?.[index]?.height}
                          // size="small"
                          fullWidth
                          variant="outlined"
                        />
                        <TextField
                          select
                          label="渲染模式"
                          {...setupField(
                            `transcodingTracks.${index}.renderMode` as const
                          )}
                          error={
                            !!errors.transcodingTracks?.[index]?.renderMode
                          }
                          // size="small"
                          fullWidth
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
          </MuiAccordionDetails>
        </MuiAccordion>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          m: 2,
          mb: 4,
          gap: 2,
        }}
      >
        <Button
          variant="outlined"
          fullWidth
          size="large"
          color="info"
          startIcon={<SaveRounded />}
          type="submit"
          // disabled={!isValid}
        >
          保存设置
        </Button>
        <Button
          variant="contained"
          fullWidth
          size="large"
          color={online ? 'error' : 'primary'}
          startIcon={online ? <HideSourceRounded /> : <CheckRounded />}
          onClick={(e) => {
            if (online && lastLiveMode == 'composed') {
              // 结束合流
              dispatch(
                stopLive({
                  streamID: lastStreamId!,
                  liveMode: lastLiveMode!,
                })
              )
            } else {
              // 保存并推流
              dispatch(updateComposedConfig(getValues()))
              if (liveMode == 'direct') {
                dispatch(changeMode())
              }
              dispatch(startLive(getRtmpUrl(roomId, Date.now())))
            }
          }}
        >
          {online && lastLiveMode == 'composed' ? '结束合流' : '保存并推流'}
        </Button>
      </Box>
    </Box>
  )
})
