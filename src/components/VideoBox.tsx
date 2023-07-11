import { Box, BoxProps } from '@mui/material'
import { QNLocalVideoTrack, QNRemoteVideoTrack } from 'qnweb-rtc'
import { forwardRef, memo, useEffect, useRef } from 'react'

import { useAppDispatch } from '../store'
import { pinTrack } from '../features/roomSlice'
import { useRoomState, useSettings } from '../utils/hooks'

export interface VideoBoxProps {
  videoTrack: QNRemoteVideoTrack | QNLocalVideoTrack | undefined
}

// TODO: right click context menu. (mute / mirror / pin)
const VideoBox = memo(
  forwardRef<HTMLDivElement, VideoBoxProps & BoxProps>(
    ({ videoTrack, sx, ...boxProps }, ref) => {
      console.warn(
        videoTrack,
        JSON.parse(
          JSON.stringify(videoTrack?.getMediaStreamTrack()?.getSettings()),
        ),
        videoTrack?.mediaElement,
      )
      const boxRef = useRef<HTMLDivElement>()
      const dispatch = useAppDispatch()
      const { pinnedTrackId } = useRoomState()

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
            // 远端视频
            if (videoTrack.isSubscribed()) {
              videoTrack.play(box)
            }
          } else {
            videoTrack.play(box, { mirror: videoTrack.facingMode == 'user' })
          }

          if (videoTrack.mediaElement) {
            const pinCurrentTrack = () => {
              if (videoTrack) {
                dispatch(pinTrack(videoTrack.trackID!))
              }
            }

            let firstTouch = true
            let lastPosition = [0, 0]
            const maxInterval = 300
            const maxDelta = 10
            videoTrack.mediaElement.onpointerdown = (e) => {
              if (firstTouch) {
                firstTouch = false

                lastPosition = [e.screenX, e.screenY]
                setTimeout(() => (firstTouch = true), maxInterval)
              } else {
                const [x0, y0] = lastPosition
                if (
                  Math.abs(e.screenX - x0) < maxDelta &&
                  Math.abs(e.screenY - y0) < maxDelta
                ) {
                  console.log('#double tap')
                  pinCurrentTrack()
                }
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
    },
  ),
)

export default VideoBox
