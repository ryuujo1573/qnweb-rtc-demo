import {
  ContentCopyRounded,
  DragHandleRounded,
  RefreshRounded,
} from '@mui/icons-material'
import { Divider, IconButton, Typography } from '@mui/material'
import { Box, useTheme } from '@mui/system'
import {
  QNConnectionState,
  QNLocalAudioTrack,
  QNLocalAudioTrackStats,
  QNLocalVideoTrack,
  QNLocalVideoTrackStats,
} from 'qnweb-rtc'
import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import Draggable from 'react-draggable'
import { Client } from '../api'

type _Props = {
  roomId: string
}

export default function DetailPanel({ roomId }: _Props) {
  const theme = useTheme()

  const handleCopyInvitation = () => {
    navigator.clipboard.writeText(window.location.href)
  }

  const { publishedTracks, connectionState } = useSyncExternalStore(
    Client.register,
    Client.getSnapshot
  )

  // seperate tracks & add device tags
  const [audioTracks, videoTracks] = useMemo(
    () => [
      publishedTracks
        .filter((t): t is QNLocalAudioTrack => t.isAudio())
        .map((t) => {
          const label = t.getMediaStreamTrack()?.label
          t.tag =
            label == 'MediaStreamAudioDestinationNode' ? '默认录音设备' : label
          return t
        }),
      publishedTracks
        .filter((t): t is QNLocalVideoTrack => t.isVideo())
        .map((t) => {
          t.tag = t.getMediaStreamTrack()?.label
          return t
        }),
    ],
    [publishedTracks]
  )

  const refreshInterval = 500

  const [audioStats, setAudioStats] =
    useState<[string, QNLocalAudioTrackStats][]>()
  const [videoStats, setVideoStats] =
    useState<[string, QNLocalVideoTrackStats][]>()

  function refresh() {
    setAudioStats(
      audioTracks.map((t) => [t.tag ?? 'Unknown Device', t.getStats()])
    )
    // TODO: why this happens
    setVideoStats(
      videoTracks.map((t) => [t.tag ?? 'Unknown Device', t.getStats().pop()!])
    )
  }
  useEffect(() => {
    const id = setInterval(refresh, refreshInterval)
    return () => {
      clearInterval(id)
    }
  }, [refreshInterval])

  return (
    <Draggable bounds="body" handle="#handle">
      <Box
        component="aside"
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
          <Typography
            color={theme.palette.secondary.main}
            pl="1ch"
            fontWeight={700}
          >
            {connectionState}
          </Typography>
          <IconButton
            onClick={handleCopyInvitation}
            sx={{
              marginLeft: 'auto',
            }}
          >
            <ContentCopyRounded />
          </IconButton>
          <IconButton onClick={refresh}>
            <RefreshRounded />
          </IconButton>
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'auto auto',
            columnGap: 1,
          }}
        >
          {audioStats
            ? audioStats.flatMap(([tag, stat]) => {
                const { uplinkBitrate, uplinkLostRate } = stat
                return [
                  Title(tag),
                  Line(
                    '音频丢包率',
                    uplinkLostRate == 0 ? '0%' : uplinkLostRate.toFixed(1) + '%'
                  ),
                  Line('音频码率', (uplinkBitrate / 1024).toFixed(3) + ' Kbps'),
                ]
              })
            : null}
          {videoStats
            ? videoStats.flatMap(([tag, stat]) => {
                if (!stat) {
                  return <>{tag}</>
                }
                const { uplinkBitrate, uplinkLostRate } = stat
                return [
                  Title(tag),
                  Line(
                    '视频丢包率',
                    uplinkLostRate == 0 ? '0%' : uplinkLostRate.toFixed(1) + '%'
                  ),
                  Line('视频码率', (uplinkBitrate / 1024).toFixed(3) + ' Kbps'),
                ]
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
      <Fragment key={key}>
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
      </Fragment>
    )
  }
}
