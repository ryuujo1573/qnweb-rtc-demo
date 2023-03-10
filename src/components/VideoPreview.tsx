import { Box, Skeleton } from '@mui/material'
import QNRTC, { QNLocalVideoTrack } from 'qnweb-rtc'
import { useEffect, useRef, useState } from 'react'
import { useAppSelector } from '../store'

export interface VideoPreviewProps {}

const VideoPreview = (props: VideoPreviewProps) => {
  const { mirror, facingMode, defaultCamera, cameraPreset } = useAppSelector(
    (s) => s.settings
  )
  const boxRef = useRef<HTMLDivElement>()
  const [track, setTrack] = useState<QNLocalVideoTrack>()
  const [showSkeleton, setShown] = useState(true)

  useEffect(() => {
    QNRTC.createCameraVideoTrack({
      facingMode,
      cameraId: defaultCamera,
      encoderConfig: cameraPreset,
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
          // width: '328px',
          // minHeight: '180px',
        }}
      >
        {showSkeleton ? (
          <Skeleton variant="rectangular" width="100%" height="100%" />
        ) : (
          <></>
        )}
      </Box>
    </Box>
  )
}

export default VideoPreview
