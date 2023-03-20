import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { Box, CircularProgress, IconButton, SxProps } from '@mui/material'
import { ReplayCircleFilledRounded } from '@mui/icons-material'

export type VideoPlayerProps = {
  autoPlay?: boolean
  src: string
  sx?: SxProps
}

export default function VideoPlayer({ autoPlay, src, sx }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls>()
  const [state, setState] = useState('idle')

  useEffect(() => {
    if (!videoRef.current) return
    if (hlsRef.current == undefined) {
      hlsRef.current = new Hls()
    }
    const hls = hlsRef.current
    const video = videoRef.current
    hls.loadSource(src)
    hls.attachMedia(video)
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.muted = true
      setState('playing')
      video.play()
    })
    hls.on(Hls.Events.ERROR, (evt, data) => {
      console.error(JSON.parse(JSON.stringify(data)))
      switch (data.details) {
        case 'bufferStalledError': {
          setState('idle')
          break
        }
        default: {
          // debugger
          setState('error')
        }
      }
    })
    hls.on(Hls.Events.FRAG_LOADED, () => {
      setState('playing')
    })
  }, [videoRef.current])
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        ...sx,
      }}
    >
      <Box
        display={state != 'playing' ? 'flex' : 'none'}
        sx={{
          zIndex: 1,
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {state == 'error' ? (
          <IconButton
            size="large"
            sx={{
              margin: 'auto',
            }}
            children={<ReplayCircleFilledRounded />}
            onClick={() => {
              const hls = hlsRef.current
              if (hls) {
                setState('playing')
                hls.recoverMediaError()
                hls.startLoad()
              }
            }}
          />
        ) : (
          <CircularProgress
            size="3rem"
            color="secondary"
            thickness={6}
            sx={{
              margin: 'auto',
            }}
          />
        )}
      </Box>
      <video autoPlay={autoPlay} ref={videoRef} width="100%" height="100%" />
    </Box>
  )
}
