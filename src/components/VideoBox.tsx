import { Box, BoxProps } from '@mui/material'
import { QNLocalVideoTrack, QNRemoteVideoTrack } from 'qnweb-rtc'
import { forwardRef, memo, useEffect, useRef } from 'react'

import { useAppDispatch, useAppSelector } from '../store'
import { pinTrack } from '../features/webrtcSlice'

export interface VideoBoxProps {
  videoTrack: QNRemoteVideoTrack | QNLocalVideoTrack | undefined
}

// TODO: right click context menu. (mute / mirror / pin)
const VideoBox = memo(
  forwardRef<HTMLDivElement, VideoBoxProps & BoxProps>(
    ({ videoTrack, sx, ...boxProps }, ref) => {
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
          box.classList.add('videoBox')
          if ('isSubscribed' in videoTrack) {
            if (videoTrack.isSubscribed()) {
              videoTrack.play(box, { mirror: false })
            }
          } else {
            videoTrack.play(box, { mirror: false })
          }

          if (videoTrack.mediaElement) {
            const pinCurrentTrack = () => {
              if (videoTrack) {
                dispatch(pinTrack(videoTrack.trackID!))
              }
            }
            videoTrack.mediaElement.ondblclick = pinCurrentTrack

            let touched = false
            const maxInterval = 300
            videoTrack.mediaElement.ontouchstart = (e) => {
              if (touched) {
                pinCurrentTrack()
              } else {
                touched = true
                setTimeout(() => (touched = false), maxInterval)
              }
            }
          }
        }
      }, [boxRef.current, pinned, videoTrack])

      return (
        <Box
          ref={(box: HTMLDivElement) => {
            boxRef.current = box
            if (ref) {
              if (typeof ref == 'function') {
                ref(box)
              } else if (typeof ref == 'object') {
                ref.current = box
              }
            }
          }}
          bgcolor="black"
          display={pinned ? 'none' : 'flex'}
          sx={{
            height: '100%',
            width: '100%',
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
            ...sx,
          }}
          {...boxProps}
        ></Box>
      )
    }
  )
)

export default VideoBox
