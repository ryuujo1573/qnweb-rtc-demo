import {
  ContentCopyRounded,
  DragHandleRounded,
  RefreshRounded,
} from '@mui/icons-material'
import {
  Box,
  Divider,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import {
  QNConnectionState,
  QNConnectionState as QState,
  QNLocalAudioTrack,
  QNLocalAudioTrackStats,
  QNLocalVideoTrack,
  QNLocalVideoTrackStats,
  QNTrack,
} from 'qnweb-rtc'
import {
  Fragment,
  // useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import Draggable from 'react-draggable'
import { useParams } from 'react-router'
import { client } from '../api'
// import { StageContext } from '../pages/room'

export type DetailPanelProps = {
  tracks: (QNTrack | null)[]
}

const stateText = {
  [QNConnectionState.CONNECTED]: '已连接',
  [QNConnectionState.CONNECTING]: '连接中',
  [QNConnectionState.DISCONNECTED]: '未连接',
  [QNConnectionState.CONNECTED]: '已连接',
  [QNConnectionState.RECONNECTED]: '已重连',
  [QNConnectionState.RECONNECTING]: '重连中',
}

export default function DetailPanel({ tracks }: DetailPanelProps) {
  const { roomId } = useParams()
  const theme = useTheme()
  // const { track: pinnedTrack } = useContext(StageContext)

  const [state, setState] = useState<QState>(QState.DISCONNECTED)
  useEffect(() => {
    client.addListener('connection-state-changed', setState)
    return () => {
      client.removeListener('connection-state-changed', setState)
    }
  }, [])

  const handleCopyInvitation = () => {
    navigator.clipboard.writeText(window.location.href)
  }
  // seperate tracks & store device labels in tags
  const [audioTracks, videoTracks] = useMemo(
    () => [
      tracks
        .filter(
          (t): t is QNLocalAudioTrack =>
            t != null && t.isAudio() && t.trackID != undefined
        )
        .map((t) => {
          const label = t.getMediaStreamTrack()?.label
          t.tag =
            label == 'MediaStreamAudioDestinationNode' ? '默认录音设备' : label
          return t
        }),
      tracks
        .filter(
          (t): t is QNLocalVideoTrack =>
            t != null && t.isVideo() && t.trackID != undefined
        )
        .map((t) => {
          t.tag = t.getMediaStreamTrack()?.label
          return t
        }),
    ],
    [tracks]
  )

  const refreshInterval = 500

  const [audioStats, setAudioStats] =
    useState<[string, QNLocalAudioTrackStats][]>()
  const [videoStats, setVideoStats] =
    useState<[string, QNLocalVideoTrackStats][]>()

  function refresh() {
    setAudioStats(audioTracks.map((t) => [template(t), t.getStats()]))
    // TODO: why stats is an array
    setVideoStats(videoTracks.map((t) => [template(t), t.getStats().pop()!]))

    function template(t: QNLocalAudioTrack | QNLocalVideoTrack): string {
      // get tag string for stats display
      const trackName = t.tag ?? `未知${t.isAudio() ? '音频' : '视频'}轨道`
      // const extra = Object.is(t, pinnedTrack) ? ' (已固定)' : ''
      return trackName
    }
  }

  const autoRefresh =
    (state == QState.CONNECTED || state == QState.RECONNECTED) &&
    tracks.length > 0
  useEffect(() => {
    if (autoRefresh) {
      const id = setInterval(refresh, refreshInterval)
      return () => {
        clearInterval(id)
      }
    }
  }, [refreshInterval, tracks, autoRefresh])

  const ref = useRef<HTMLDivElement>(null)

  return (
    <Draggable bounds="body" nodeRef={ref}>
      <Box
        component="aside"
        ref={ref}
        sx={{
          zIndex: 114514,
          position: 'fixed',
          margin: '1ch',
          padding: '1ch',
          maxWidth: '90%',
          backgroundColor: '#00000060',
        }}
      >
        <Box id="handle" display="flex">
          <DragHandleRounded
            sx={{
              margin: 'auto',
              cursor: 'grab',
            }}
          />
        </Box>
        <Typography
          variant="caption"
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <b>房间:&nbsp;</b>
          {roomId}
          <Typography color={theme.palette.grey[500]} pl="1ch" fontWeight={500}>
            {stateText[state]}
          </Typography>
          <Tooltip title="复制房间链接">
            <IconButton
              onClick={handleCopyInvitation}
              sx={{
                marginLeft: 'auto',
              }}
            >
              <ContentCopyRounded />
            </IconButton>
          </Tooltip>
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'auto auto',
            columnGap: 1,
          }}
        >
          {audioStats
            ? audioStats.map(([tag, stat], i) => {
                const { uplinkBitrate, uplinkLostRate } = stat
                return (
                  <Fragment key={tag + i}>
                    {Title(tag)}
                    {Line(
                      '音频丢包率',
                      uplinkLostRate == 0
                        ? '0%'
                        : uplinkLostRate.toFixed(1) + '%'
                    )}
                    {Line(
                      '音频码率',
                      (uplinkBitrate / 1024).toFixed(3) + ' Kbps'
                    )}
                  </Fragment>
                )
              })
            : null}
          {videoStats
            ? videoStats.map(([tag, stat], i) => {
                if (!stat) {
                  return <Fragment key={tag + i}>{Title(tag)}</Fragment>
                }
                const { uplinkBitrate, uplinkLostRate } = stat
                return (
                  <Fragment key={tag + i}>
                    {Title(tag)}
                    {Line(
                      '视频丢包率',
                      uplinkLostRate == 0
                        ? '0%'
                        : uplinkLostRate.toFixed(1) + '%'
                    )}
                    {Line(
                      '视频码率',
                      (uplinkBitrate / 1024).toFixed(3) + ' Kbps'
                    )}
                  </Fragment>
                )
              })
            : null}
        </Box>
      </Box>
    </Draggable>
  )

  function Title(text: string) {
    return (
      <Typography variant="subtitle2" gridColumn={'1/3'} marginTop=".5rem">
        {text}
        <Divider></Divider>
      </Typography>
    )
  }

  function Line(key: string, value: string) {
    return (
      <>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
          }}
        >
          {key}
        </Typography>
        <Typography variant="body2" align="left">
          {value}
        </Typography>
      </>
    )
  }
}
