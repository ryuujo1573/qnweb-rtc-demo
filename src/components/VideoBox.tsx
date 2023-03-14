import { Box, BoxProps, styled } from '@mui/material'
import { QNLocalVideoTrack, QNRemoteVideoTrack } from 'qnweb-rtc'
import { useContext, useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '../store'
import { pinTrack } from '../features/webrtcSlice'

export interface VideoBoxProps {
  videoTrack: QNRemoteVideoTrack | QNLocalVideoTrack | undefined
}

// TODO: right click context menu. (mute / mirror / pin)
const VideoBox = ({
  videoTrack,
  sx,
  ...boxProps
}: VideoBoxProps & BoxProps) => {
  const boxRef = useRef<HTMLDivElement>()
  const dispatch = useAppDispatch()
  const pinnedTrackId = useAppSelector((s) => s.webrtc.pinnedTrackId)

  const pinned =
    videoTrack != undefined &&
    pinnedTrackId != undefined &&
    videoTrack.trackID == pinnedTrackId

  useEffect(() => {
    const box = boxRef.current

    if (box == undefined || videoTrack == undefined) return

    if (pinned) {
      // videoTrack.mediaElement?.remove()
    } else {
      if ('isSubscribed' in videoTrack) {
        if (videoTrack.isSubscribed()) {
          videoTrack.play(box, { mirror: false })
        }
      } else {
        videoTrack.play(box, { mirror: false })
      }
    }
  }, [boxRef.current, videoTrack, pinned])

  return (
    <Box
      ref={boxRef}
      bgcolor={'black'}
      display={pinned ? 'none' : 'flex'}
      onDoubleClick={() => {
        if (videoTrack) {
          dispatch(pinTrack(videoTrack.trackID!))
        }
      }}
      sx={{
        height: '100%',
        width: '100%',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        '&>*': {
          position: 'absolute',
        },
        ...sx,
      }}
      {...boxProps}
    ></Box>
  )
}

export default VideoBox
