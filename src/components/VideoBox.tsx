import { Box, BoxProps } from '@mui/material'
import { QNLocalVideoTrack, QNRemoteVideoTrack } from 'qnweb-rtc'
import { useContext, useEffect, useRef } from 'react'
import { StageContext } from '../pages/room'

export interface VideoBoxProps extends BoxProps {
  videoTrack: QNRemoteVideoTrack | QNLocalVideoTrack | undefined
  // mirror?: boolean
}

export default function VideoBox({
  videoTrack,
  className,
  sx,
  children,
}: VideoBoxProps) {
  const boxRef = useRef<HTMLDivElement>()
  const {
    boxRef: pinnedBoxRef,
    setTrack: setPinnedTrack,
    track: pinnedTrack,
  } = useContext(StageContext)

  console.log('pinnedTrack', pinnedTrack)
  const pinned = videoTrack != undefined && pinnedTrack == videoTrack

  useEffect(() => {
    const target = pinned ? pinnedBoxRef.current : boxRef.current
    console.log(
      'videoTrack',
      pinned ? 'pinned' : 'unpinned',
      videoTrack,
      pinnedTrack
    )
    console.log('target', target)
    if (target == undefined || !videoTrack) return

    // if it's remote track
    if ('isSubscribed' in videoTrack) {
      console.log('remoteTrack', videoTrack.isSubscribed())
      if (videoTrack.isSubscribed()) {
        videoTrack.play(target, { mirror: false })
      } else {
        // TODO: subscribe and save returned track
        target.append('not subscribed')
      }
    } else {
      videoTrack.play(target, { mirror: false })
    }

    // clear Effect from outer state changes
    if (pinned) {
      return () => {
        setPinnedTrack((possibleNewTrack) => {
          // `pinnedTrack` from current closure is the old track

          if (pinnedTrack != possibleNewTrack) {
            // if there's a new track set when clearing effects
            // keep it (next pinned track)
            return possibleNewTrack
          } else {
            // if it's just the same old track, and need a dispose
            // clear it (no pinned track)
            return undefined
          }
        })
      }
    }
    // }, [target, mirror])
  }, [boxRef.current, videoTrack, pinned])

  return (
    <Box
      className={className}
      ref={boxRef}
      bgcolor={'black'}
      sx={{
        height: '100%',
        width: '100%',
        position: 'relative',
        display: pinned ? 'none' : 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&>*': {
          position: 'absolute',
        },
        ...sx,
      }}
      onDoubleClick={() => {
        if (videoTrack) {
          setPinnedTrack(videoTrack)
        }
      }}
    >
      {children}
    </Box>
  )
}
