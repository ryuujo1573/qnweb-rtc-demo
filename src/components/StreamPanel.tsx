import { LayersRounded, StreamRounded } from '@mui/icons-material'
import {
  CircularProgress,
  Fade,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import {
  QNConnectionState as QState,
  QNLiveStreamingState as QLiveState,
  QNLocalAudioTrack,
  QNLocalVideoTrack,
  QNTranscodingLiveStreamingConfig,
} from 'qnweb-rtc'
import { useEffect, useReducer, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'react-router'
import { client } from '../api'
import { useTopRightBox } from '../pages/layout'
import { useAppSelector } from '../store'
import { getRandomId } from '../utils'

export type StreamingControlProps = {
  state: QState
  videoTrack?: QNLocalVideoTrack
  audioTrack?: QNLocalAudioTrack
}

export function StreamingControl({
  state,
  videoTrack,
  audioTrack,
}: StreamingControlProps) {
  const ref = useTopRightBox()
  const serialNum = useRef(Math.floor(Date.now() / 1000))
  const { liveStreamBaseUrl } = useAppSelector((s) => s.settings)

  const { roomId: streamPath } = useParams()
  const isConnected = state == QState.CONNECTED || state == QState.RECONNECTED

  type LiveState = {
    phase: 'connected' | 'idle' | 'pending'
    mode: 'direct' | 'composed'
    lastStreamId: string | null
  }
  function liveStateReducer(
    prevState: LiveState,
    action:
      | { type: 'toggle' }
      | {
          type: 'changeMode'
          payload: LiveState['mode']
        }
      | { type: 'fulfilled'; payload: Partial<LiveState> }
  ): LiveState {
    console.log('#state:', { ...prevState })
    console.log('#action:', { ...action })

    const directConfig = {
      videoTrack,
      audioTrack,
    }
    const composedConfig: Partial<QNTranscodingLiveStreamingConfig> = {
      width: 640,
      height: 480,
      background: {
        url: 'http://pili-playback.qnsdk.com/ivs_background_1280x720.png',
        x: 0,
        y: 0,
        width: 640,
        height: 480,
      },
    }

    const update = (state: Partial<LiveState>) => {
      dispatch({
        type: 'fulfilled',
        payload: state,
      })
    }
    switch (action.type) {
      case 'toggle': {
        const streamID = getRandomId()
        const baseConfig = {
          streamID,
          url: `${liveStreamBaseUrl}/${streamPath!}?serialnum=${serialNum.current++}`,
        }

        if (prevState.phase == 'idle') {
          if (prevState.mode == 'direct') {
            client
              .startDirectLiveStreaming({
                ...baseConfig,
                ...directConfig,
              })
              .then(() => {
                console.log('start direct fuck')

                update({ phase: 'connected', lastStreamId: streamID })
              })
              .catch((reason) => {
                debugger
              })
            // .catch((reason) => update({ phase: 'idle', lastStreamId: undefined }))
          } else {
            client
              .startTranscodingLiveStreaming({
                ...baseConfig,
                ...composedConfig,
              })
              .then(() => {
                console.log('start direct fuck')

                update({ phase: 'connected', lastStreamId: streamID })
                if (videoTrack) {
                  client
                    .setTranscodingLiveStreamingTracks(streamID, [
                      {
                        x: 0,
                        y: 0,
                        width: 320,
                        height: 240,
                        trackID: videoTrack.trackID!,
                      },
                    ])
                    .catch((reason) => {
                      debugger
                    })
                }
              })
              .catch((reason) => {
                debugger
              })
          }

          return { ...prevState, phase: 'pending' }
        } else if (prevState.phase == 'connected') {
          if (prevState.mode == 'direct') {
            client
              .stopDirectLiveStreaming(prevState.lastStreamId!)
              .then(() => update({ phase: 'idle', lastStreamId: null }))
              .catch((reason) => {
                debugger
              })
          } else {
            client
              .stopTranscodingLiveStreaming(prevState.lastStreamId!)
              .then(() => update({ phase: 'idle', lastStreamId: null }))
              .catch((reason) => {
                debugger
              })
          }
          return { ...prevState, phase: 'pending' }
        }
        break
      }
      case 'changeMode': {
        const baseConfig = {
          streamID: getRandomId(),
          url: `${liveStreamBaseUrl}/${streamPath!}?serialnum=${serialNum.current++}`,
        }
        if (prevState.mode == action.payload) {
          break
        }
        if (prevState.phase == 'connected') {
          const lastStreamId = prevState.lastStreamId!
          if (prevState.mode == 'composed') {
            client.once(
              'direct-livestreaming-state-changed',
              (streamID: string, state: QLiveState) => {
                if (state == QLiveState.STARTED) {
                  client
                    .stopTranscodingLiveStreaming(lastStreamId)
                    .catch((reason) => {
                      debugger
                    })
                  update({
                    phase: 'connected',
                    mode: 'direct',
                    lastStreamId: streamID,
                  })
                }
              }
            )
            client
              .startDirectLiveStreaming({
                ...baseConfig,
                ...directConfig,
              })
              .catch((reason) => {
                debugger
              })
          } else {
            client.once(
              'transcoding-livestreaming-state-changed',
              (streamID: string, state: QLiveState) => {
                if (state == QLiveState.STARTED) {
                  client
                    .stopDirectLiveStreaming(lastStreamId)
                    .catch((reason) => {
                      debugger
                    })
                  if (videoTrack) {
                    client
                      .setTranscodingLiveStreamingTracks(streamID, [
                        {
                          x: 0,
                          y: 0,
                          width: 320,
                          height: 240,
                          trackID: videoTrack.trackID!,
                        },
                      ])
                      .catch((reason) => {
                        debugger
                      })
                  }
                  update({
                    phase: 'connected',
                    mode: 'composed',
                    lastStreamId: streamID,
                  })
                }
              }
            )
            client
              .startTranscodingLiveStreaming({
                ...baseConfig,
                ...composedConfig,
              })
              .catch((reason) => {
                debugger
              })
          }
          return { ...prevState, phase: 'pending' }
        }
        break
      }
      case 'fulfilled': {
        return { ...prevState, ...action.payload }
      }
    }
    return prevState
  }
  const [liveState, dispatch] = useReducer(liveStateReducer, {
    phase: 'idle',
    mode: 'direct',
    lastStreamId: null,
  })
  const on = liveState.phase == 'connected'

  const handleModeChange = async (evt: any, mode: string) => {
    function isValidMode(mode: string): mode is 'direct' | 'composed' {
      return ['direct', 'composed'].includes(mode)
    }
    if (isValidMode(mode)) {
      dispatch({ type: 'changeMode', payload: mode })
    }
  }
  const handleLiveToggle = () => {
    dispatch({ type: 'toggle' })
  }

  useEffect(() => {
    console.log('EFFECT!')
    const handler = (type: string) => (streamId: string, state: QLiveState) => {
      console.log(type, streamId, state)
    }
    client.addListener('direct-livestreaming-state-changed', handler('direct'))
    client.addListener(
      'transcoding-livestreaming-state-changed',
      handler('composed')
    )

    return () => {
      // client
    }
  }, [])

  return ref.current ? (
    createPortal(
      <>
        <ToggleButton
          value="switch"
          disabled={!isConnected || liveState.phase == 'pending'}
          selected={on}
          color={on ? 'error' : 'primary'}
          // loading={liveState.phase == 'pending'}
          onChange={handleLiveToggle}
        >
          {liveState.phase == 'connected' ? (
            '结束推流'
          ) : liveState.phase == 'idle' ? (
            '开启推流'
          ) : (
            <>
              <CircularProgress
                size="1rem"
                color="inherit"
                thickness={6.4}
                sx={{ mr: '1ch' }}
              />{' '}
              处理中
            </>
          )}
        </ToggleButton>
        <Fade in={on}>
          <ToggleButtonGroup
            disabled={!on}
            aria-label="livestreaming mode switch"
            value={liveState.mode}
            exclusive
            color="primary"
            onChange={handleModeChange}
          >
            <ToggleButton value={'direct'} aria-label="direct livestreaming">
              <StreamRounded />
              单路转推
            </ToggleButton>
            <ToggleButton
              value={'composed'}
              aria-label="composed livestreaming"
            >
              <LayersRounded />
              合流转推
            </ToggleButton>
          </ToggleButtonGroup>
        </Fade>
      </>,
      ref.current
    )
  ) : (
    <></>
  )
}
