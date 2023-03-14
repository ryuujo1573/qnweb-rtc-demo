import { Box, BoxProps, Skeleton, styled } from '@mui/material'
import QNRTC, { QNLocalVideoTrack } from 'qnweb-rtc'
import { useEffect, useRef, useState } from 'react'
import { useAppSelector } from '../store'

export interface VideoPreviewProps {}

const VideoPreview = ({ ...boxProps }: VideoPreviewProps & BoxProps) => {
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

    return () => {
      setTrack((track) => {
        track?.destroy()
        return undefined
      })
    }
  }, [facingMode, defaultCamera, cameraPreset])

  useEffect(() => {
    if (boxRef.current && showSkeleton) {
      if (track) {
        track.play(boxRef.current, { mirror: false })
        setShown(false)
      }
    }
  }, [boxRef.current, track])

  return (
    <Box
      className={(mirror && 'mirror') || undefined}
      ref={boxRef}
      sx={{
        position: 'relative',
        // width: '328px',
        // minHeight: '180px',
      }}
      {...boxProps}
    >
      {showSkeleton ? (
        <Skeleton variant="rectangular" width="100%" height="100%" />
      ) : (
        <></>
      )}
    </Box>
  )
}

export default VideoPreview
