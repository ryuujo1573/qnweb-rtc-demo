import {
  EmergencyRecordingRounded,
  SettingsVoiceRounded,
} from '@mui/icons-material'
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
import QNRTC, {
  QNLocalAudioTrack,
  QNLocalVideoTrack,
  SUPPORT_VIDEO_ENCODER_CONFIG_LIST,
} from 'qnweb-rtc'
import { memo, useEffect, useState } from 'react'

import { Settings, save, update } from '../features/settingSlice'
import { useAppDispatch } from '../store'
import AudioIndicator from './AudioIndicator'
import VideoBox from './VideoBox'
import { useSettings } from '../utils/hooks'

const OobePanel = function OobePanel(props: PopoverProps) {
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
  } = useSettings()

  const [microphoneId, setMicrophoneId] = useState<string>('')
  const [cameraId, setCameraId] = useState<string>('')

  if (microphoneId == '' || cameraId == '') {
    const micId = microphones[0]?.deviceId
    if (micId) {
      setMicrophoneId(micId)
    }
    const camId = cameras[0]?.deviceId
    if (camId) {
      setCameraId(camId)
    }
  }

  const [audioTrack, setAudioTrack] = useState<QNLocalAudioTrack>()
  const [videoTrack, setVideoTrack] = useState<QNLocalVideoTrack>()

  const [testing, setTesting] = useState({ audio: false, video: false })
  const [shouldSave, setShouldSave] = useState(false)
  const [cameraMuted, setCameraMuted] = useState(defaultCamMuted ?? false)
  const [microphoneMuted, setMicrophoneMuted] = useState(
    defaultMicMuted ?? false,
  )

  const { width, height } = SUPPORT_VIDEO_ENCODER_CONFIG_LIST[cameraPreset]
  const panelWidth = 300
  const estimatedHeight =
    height && width && typeof height == 'number' && typeof width == 'number'
      ? (panelWidth * height) / width
      : undefined

  useEffect(() => {
    if (testing.audio) {
      if (audioTrack) {
        audioTrack.destroy()
      }
      QNRTC.createMicrophoneAudioTrack({
        microphoneId,
      }).then((track) => {
        setAudioTrack((oldTrack) => {
          oldTrack?.destroy()
          return track
        })
      })
    } else {
      setAudioTrack((oldTrack) => {
        oldTrack?.destroy()
        return undefined
      })
    }
  }, [testing.audio, microphoneId])

  useEffect(() => {
    if (testing.video) {
      if (videoTrack) {
        videoTrack.destroy()
      }
      QNRTC.createCameraVideoTrack({
        cameraId,
        facingMode: undefined,
        encoderConfig: '1080p',
      }).then((track) => {
        setVideoTrack((oldTrack) => {
          oldTrack?.destroy()
          return track
        })
      })
    } else {
      setVideoTrack((oldTrack) => {
        oldTrack?.destroy()
        return undefined
      })
    }
  }, [testing.video, cameraId])

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
        // width={`${panelWidth}px`}
        // height="200px"
        maxWidth="90vw"
        sx={{
          [`& .${typographyClasses.root}`]: {
            userSelect: 'none',
          },
        }}
        onClick={(e) => e.stopPropagation()}
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
            disabled={microphones.length == 0}
            defaultValue={microphones[0]?.deviceId}
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
            disabled={cameras.length == 0}
            defaultValue={cameras[0]?.deviceId}
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
        {videoTrack && (
          <Grow in>
            <Box height={estimatedHeight}>
              <VideoBox videoTrack={videoTrack} />
            </Box>
          </Grow>
        )}
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
                value={shouldSave}
                onChange={(_, v) => setShouldSave(v)}
              />
            }
            label={
              <Typography
                variant="body2"
                color={shouldSave ? 'inherit' : 'gray'}
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
              dispatch(
                (shouldSave ? save : update)({
                  defaultCamera: cameraId,
                  defaultMicrophone: microphoneId,
                  cameraMuted,
                  microphoneMuted,
                  neverPrompt: true,
                }),
              )
            }}
          >
            加入房间
          </Button>
        </Box>
      </Box>
    </Popover>
  )
}

export default OobePanel
