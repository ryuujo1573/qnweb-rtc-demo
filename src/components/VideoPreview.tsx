import { Box, BoxProps, Skeleton } from '@mui/material'
import QNRTC, { QNCameraVideoTrack, QNLocalVideoTrack } from 'qnweb-rtc'
import { useEffect, useRef, useState } from 'react'
import { useAppSelector } from '../store'

export interface VideoPreviewProps {}

const VideoPreview = ({ ...boxProps }: VideoPreviewProps & BoxProps) => {
  const { mirror, facingMode, defaultCamera, cameraPreset } = useAppSelector(
    (s) => s.settings
  )

  const boxRef = useRef<HTMLDivElement>()
  const [track, setTrack] = useState<QNLocalVideoTrack>()
  const showSkeleton = !track

  useEffect(() => {
    // console.log('# create')
    let track: QNLocalVideoTrack | undefined

    QNRTC.createCameraVideoTrack({
      facingMode: undefined,
      cameraId: defaultCamera,
      encoderConfig: cameraPreset,
    }).then((newTrack) => {
      track = newTrack
      setTrack((oldTrack) => {
        // if track is recreated multiple times,
        // destroy the old, and remain the new.
        if (oldTrack) {
          // console.log('# inner clear')
          oldTrack.destroy()
        }
        return newTrack
      })
    })

    return function cleanEffect() {
      // console.log('# clear', track)
      track?.destroy()
    }
  }, [facingMode, defaultCamera, cameraPreset])

  useEffect(() => {
    if (boxRef.current) {
      track?.play(boxRef.current, { mirror: false })
    }
  }, [boxRef.current, track])

  return (
    <Box
      className={mirror ? 'mirror' : undefined}
      ref={boxRef}
      sx={{
        position: 'relative',
        // maxHeight: '300px',
        height: 'fit-content',
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
