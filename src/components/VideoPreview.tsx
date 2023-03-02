import { Box, MenuItem, Skeleton, TextField, Typography } from '@mui/material'
import QNRTC, { QNLocalVideoTrack } from 'qnweb-rtc'
import { useEffect, useRef, useState } from 'react'
import { setDefaultCamera } from '../features/settingSlice'
import { useAppDispatch, useAppSelector } from '../store'

export interface VideoPreviewProps {}

const VideoPreview = (props: VideoPreviewProps) => {
  const { mirror, facingMode, cameras, defaultCamera } = useAppSelector(
    (s) => s.settings
  )
  const dispatch = useAppDispatch()
  const boxRef = useRef<HTMLDivElement>()
  const [track, setTrack] = useState<QNLocalVideoTrack>()
  const [showSkeleton, setShown] = useState(true)

  useEffect(() => {
    QNRTC.createCameraVideoTrack({
      facingMode,
      cameraId: defaultCamera,
    }).then(setTrack)
  }, [])

  useEffect(() => {
    if (boxRef.current) {
      if (track) {
        track.play(boxRef.current, { mirror: false })
        setShown(false)
        return () => {
          track.destroy()
        }
      }
    }
  }, [boxRef.current, track])

  return (
    <Box>
      <Box
        {...(mirror ? { className: 'mirror' } : undefined)}
        ref={boxRef}
        sx={{
          position: 'relative',
          width: '328px',
          aspectRatio: 'auto 4/3',
        }}
      >
        {showSkeleton ? (
          <Skeleton variant="rectangular" width="100%" height="100%" />
        ) : (
          <></>
        )}
      </Box>
      <TextField
        select
        fullWidth
        label="视频设备"
        value={defaultCamera ?? 'controlled'}
        onChange={(evt) => {
          dispatch(setDefaultCamera(evt.target.value))
        }}
      >
        {cameras.map((camInfo) => {
          return (
            <MenuItem key={camInfo.groupId} value={camInfo.groupId}>
              {camInfo.label}
            </MenuItem>
          )
        })}
      </TextField>
      <Typography variant="body2"></Typography>
    </Box>
  )
}

export default VideoPreview
