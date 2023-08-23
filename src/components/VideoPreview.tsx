import { Box, BoxProps, Skeleton } from '@mui/material'
import QNRTC, { QNLocalVideoTrack } from 'qnweb-rtc'
import { useEffect, useRef, useState } from 'react'
import { useAppSelector } from '../store'
import { PersonalVideoTwoTone } from '@mui/icons-material'

export interface VideoPreviewProps {}

const VideoPreview = ({ ...boxProps }: VideoPreviewProps & BoxProps) => {
  const { mirror, facingMode, defaultCamera, cameraPreset } = useAppSelector(
    (s) => s.settings,
  )

  const boxRef = useRef<HTMLDivElement>()
  const [track, setTrack] = useState<QNLocalVideoTrack>()
  const [display, setDisplay] = useState(false)

  useEffect(() => {
    // console.log('# create')
    let track: QNLocalVideoTrack | undefined

    if (display) {
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
    }
  }, [display, facingMode, defaultCamera, cameraPreset])

  useEffect(() => {
    if (boxRef.current) {
      track?.play(boxRef.current, { mirror: false })
    }
  }, [boxRef.current, track])

  return (
    <Box
      className={mirror ? 'mirror' : undefined}
      ref={boxRef}
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgcolor="black"
      sx={{
        borderRadius: '18px',
        position: 'relative',
        minHeight: '180px',
        // height: 'fit-content',
      }}
      {...boxProps}
    >
      {display ? (
        <>
          <Skeleton variant="rectangular" width="100%" height="100%"></Skeleton>
        </>
      ) : (
        <Box
          component="a"
          // display="contents"
          sx={{
            position: 'relative',
            cursor: 'pointer',
            width: '2rem',
            height: '2rem',
            '&>svg': {
              height: '100%',
              width: '100%',
            },
            '::after': {
              position: 'absolute',
              textAlign: 'center',
              left: '50%',
              transform: 'translate(-50%, 0)',
              bottom: '-1.5rem',
              fontSize: '.8rem',
              content: '"预览"',
              width: 'max-content',
            },
          }}
          onClick={() => {
            setDisplay(true)
          }}
        >
          <PersonalVideoTwoTone />
        </Box>
      )}
    </Box>
  )
}

export default VideoPreview
