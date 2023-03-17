import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grow,
  MenuItem,
  Popover,
  PopoverProps,
  TextField,
  Typography,
  styled,
  typographyClasses,
} from '@mui/material'
import { useAppDispatch, useAppSelector } from '../store'
import {
  EmergencyRecordingRounded,
  SettingsVoiceRounded,
} from '@mui/icons-material'
import AudioIndicator from './AudioIndicator'
import { memo, useEffect, useState } from 'react'
import QNRTC, {
  QNLocalAudioTrack,
  QNLocalVideoTrack,
  SUPPORT_VIDEO_ENCODER_CONFIG_LIST,
} from 'qnweb-rtc'
import VideoBox from './VideoBox'
import { Settings } from '../features/settingSlice'

type OobePanelProps = {
  onConfirm: (config: Partial<Settings>) => void
}

const OobePanel = memo(
  styled(function OobePanel(props: PopoverProps & OobePanelProps) {
    const dispatch = useAppDispatch()
    const {
      microphones,
      cameras,
      cameraPreset,
      defaultMicrophone,
      facingMode,
      defaultCamera,
      microphoneMuted: defaultMicMuted,
      cameraMuted: defaultCamMuted,
    } = useAppSelector((s) => s.settings)

    const [microphoneId, setMicrophoneId] = useState<string>('')
    const [cameraId, setCameraId] = useState<string>('')

    if (microphoneId == '' || cameraId == '') {
      const micId = microphones.at(0)?.deviceId
      if (micId) {
        setMicrophoneId(micId)
      }
      const camId = cameras.at(0)?.deviceId
      if (camId) {
        setCameraId(camId)
      }
    }

    const [audioTrack, setAudioTrack] = useState<QNLocalAudioTrack>()
    const [videoTrack, setVideoTrack] = useState<QNLocalVideoTrack>()

    const [testing, setTesting] = useState({ audio: false, video: false })
    const [neverPrompt, setNeverPropmt] = useState(false)
    const [cameraMuted, setCameraMuted] = useState(defaultCamMuted ?? false)
    const [microphoneMuted, setMicrophoneMuted] = useState(
      defaultMicMuted ?? false
    )

    const { width, height } = SUPPORT_VIDEO_ENCODER_CONFIG_LIST[cameraPreset]
    const panelWidth = 320
    const estimatedHeight =
      height && width && typeof height == 'number' && typeof width == 'number'
        ? (panelWidth * height) / width
        : undefined

    useEffect(() => {
      if (testing.audio) {
        QNRTC.createMicrophoneAudioTrack({
          microphoneId,
        }).then(setAudioTrack)
      }

      return () => {
        if (testing.audio) {
          setAudioTrack((oldTrack) => {
            oldTrack?.destroy()
            return undefined
          })
        }
      }
    }, [testing.audio])

    useEffect(() => {
      if (testing.video) {
        QNRTC.createCameraVideoTrack({
          cameraId,
          facingMode,
          encoderConfig: cameraPreset,
        }).then(setVideoTrack)
      }

      return () => {
        if (testing.video) {
          setVideoTrack((oldTrack) => {
            oldTrack?.destroy()
            return undefined
          })
        }
      }
    }, [testing.video])

    return (
      <Popover
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'center',
        }}
        anchorEl={document.body}
        {...props}
      >
        <Box
          m={2}
          width={`${panelWidth}px`}
          // height="200px"
          maxWidth="90vw"
          sx={{
            [`& .${typographyClasses.root}`]: {
              userSelect: 'none',
            },
          }}
        >
          <Typography variant="subtitle1">设备检测</Typography>
          <Box
            sx={{
              display: 'flex',
              my: 2,
              gap: 1,
            }}
          >
            <TextField
              select
              sx={{ flex: 1 }}
              // fullWidth
              size="small"
              label="音频输入设备"
              value={microphoneId}
              onChange={(evt) => {
                setMicrophoneId(evt.target.value)
              }}
            >
              {microphones.map((mic) => {
                return (
                  <MenuItem key={mic.deviceId} value={mic.deviceId}>
                    {mic.label}
                  </MenuItem>
                )
              })}
            </TextField>
            <Button
              variant="outlined"
              startIcon={<SettingsVoiceRounded />}
              color={testing.audio ? 'success' : 'primary'}
              onClick={() => {
                setTesting((v) => ({ ...v, audio: !v.audio }))
              }}
            >
              {testing.audio ? '结束' : '测试'}
            </Button>
          </Box>
          {audioTrack && <AudioIndicator audioTrack={audioTrack} />}
          <Box
            sx={{
              display: 'flex',
              my: 2,
              gap: 1,
            }}
          >
            <TextField
              select
              sx={{ flex: 1 }}
              // fullWidth
              size="small"
              label="视频输入设备"
              value={cameraId}
              defaultValue={cameras.at(0)?.deviceId}
              onChange={(evt) => {
                setCameraId(evt.target.value)
              }}
            >
              {cameras.map((cam) => {
                return (
                  <MenuItem key={cam.deviceId} value={cam.deviceId}>
                    {cam.label}
                  </MenuItem>
                )
              })}
            </TextField>
            <Button
              variant="outlined"
              startIcon={<EmergencyRecordingRounded />}
              color={testing.video ? 'success' : 'primary'}
              onClick={() => {
                setTesting((v) => ({ ...v, video: !v.video }))
              }}
            >
              {testing.video ? '结束' : '测试'}
            </Button>
          </Box>
          <Grow in={!!videoTrack}>
            <Box height={estimatedHeight} hidden={!videoTrack}>
              <VideoBox videoTrack={videoTrack} />
            </Box>
          </Grow>
          <FormControlLabel
            control={
              <Checkbox
                checked={!microphoneMuted}
                onChange={(_, v) => setMicrophoneMuted(!v)}
              />
            }
            label={<Typography>入会时开启麦克风</Typography>}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={!cameraMuted}
                onChange={(_, v) => setCameraMuted(!v)}
              />
            }
            label={<Typography>入会时开启摄像头</Typography>}
          />
          <Box display="flex" mt={2}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  value={neverPrompt}
                  onChange={(_, v) => setNeverPropmt(v)}
                />
              }
              label={
                <Typography
                  variant="body2"
                  color={neverPrompt ? 'inherit' : 'gray'}
                >
                  设为默认且不再询问
                </Typography>
              }
            />
            <Button
              variant="contained"
              sx={{
                ml: 'auto',
              }}
              onClick={() => {
                props.onConfirm({
                  defaultCamera: cameraId,
                  defaultMicrophone: microphoneId,
                  cameraMuted,
                  microphoneMuted,
                  neverPrompt,
                })
              }}
            >
              加入房间
            </Button>
          </Box>
        </Box>
      </Popover>
    )
  })({})
)

export default OobePanel
