import {
  Audiotrack,
  SignalCellularAlt,
  SignalCellularAlt1Bar,
  SignalCellularAlt2Bar,
  VerifiedUserRounded,
} from '@mui/icons-material'
import {
  Avatar,
  Box,
  iconClasses,
  svgIconClasses,
  Theme,
  Typography,
  useTheme,
} from '@mui/material'
import {
  QNNetworkQuality as Quality,
  QNRemoteAudioTrack,
  QNRemoteUser,
} from 'qnweb-rtc'
import { useDebugValue, useEffect, useState } from 'react'
import { client } from '../api'
import refStore, { RemoteUser } from '../features/tracks'
import { isAudioTrack, isVideoTrack, stringToColor } from '../utils'
import AudioWave from './AudioWave'
import VideoBox from './VideoBox'

type UserBoxProps = {
  user: RemoteUser
}

function getQualityIcon(networkQuality: Quality) {
  switch (networkQuality) {
    case Quality.EXCELLENT:
      return (
        <SignalCellularAlt
          sx={{
            color: '#4caf50',
          }}
        />
      )
    case Quality.GOOD:
      return (
        <SignalCellularAlt
          sx={{
            color: '#8bc34a',
          }}
        />
      )
    case Quality.FAIR:
      return (
        <SignalCellularAlt2Bar
          sx={{
            color: '#ffeb3b',
          }}
        />
      )
    case Quality.POOR:
      return (
        <SignalCellularAlt1Bar
          sx={{
            color: '#8bc34a',
          }}
        />
      )
    case Quality.UNKNOWN:
      return (
        <SignalCellularAlt
          sx={{
            color: 'grey',
          }}
        />
      )
  }
}

export default function UserBox({ user }: UserBoxProps) {
  // debugger
  const userTracks = refStore.queryRemoteTracks(user.trackIds)
  const videoTracks = userTracks.filter(isVideoTrack)
  const audioTracks = userTracks.filter(isAudioTrack)

  const icon = (
    <VerifiedUserRounded
      sx={{
        marginInline: '0 4px !important',
      }}
    />
  )

  const color = stringToColor(user.userID) + '80'
  const bgcolor = stringToColor(user.userID)

  const [networkQuality, setNetworkQuality] = useState(
    client.getUserNetworkQuality(user.userID)
  )

  const updateInterval = 3000
  useEffect(() => {
    const timer = setInterval(() => {
      const quality = client.getUserNetworkQuality(user.userID)
      console.log('current', quality)
      setNetworkQuality(quality)
    }, updateInterval)

    return () => {
      clearInterval(timer)
    }
  }, [])

  const theme = useTheme()
  const [audioTarget, setAudioTarget] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (audioTarget) {
      if (audioTracks) {
        const subscribed = audioTracks.filter((t) => t.isSubscribed())
        subscribed.forEach((t) => t.play(audioTarget))
        // this should execute only once
        // track.play introduces side effects (audio elements),
        // which will be cleaned with DOM removal
      }
    }
  }, [audioTarget])

  return (
    <Box
      ref={setAudioTarget}
      sx={{
        display: 'flex',
        position: 'relative',
        border: 'InactiveBorder 2px solid',
        marginInline: 0.2,
        height: '180px',
        width: '240px',
        '& audio': {
          display: 'none',
        },
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          position: 'absolute',
          // width: 'calc(100% - 2ch)',
          width: '100%',
          // margin: '4px',
          padding: '4px',
          bottom: 0,
          zIndex: 2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          mixBlendMode: 'difference',
          transitionDuration: '0.2s',
          [`&>.${svgIconClasses.root}`]: {
            fontSize: 'inherit',
            verticalAlign: 'middle',
            marginInline: '4px',
            '&:last-child': {
              mixBlendMode: 'normal',
            },
          },
          ':hover': {
            bgcolor: '#00000080',
            color: 'whitesmoke',
            mixBlendMode: 'normal',
          },
        }}
      >
        {icon}
        {user.userID}
        {getQualityIcon(networkQuality)}
      </Typography>
      {videoTracks.length == 0 && audioTracks.length == 0 ? (
        <Avatar
          sx={{
            margin: 'auto',
            bgcolor,
            color,
            textTransform: 'uppercase',
            '&>span': {
              fontSize: '80%',
              color: '#fff',
              mixBlendMode: 'hard-light',
            },
          }}
          children={<span>{user.userID.slice(0, 2)}</span>}
        />
      ) : undefined}
      {...videoTracks.map((track, i) => {
        return (
          <VideoBox
            key={user.userID + 'v' + i}
            videoTrack={track}
            sx={{
              height: '180px',
            }}
          ></VideoBox>
        )
      })}
      {...videoTracks.length == 0
        ? audioTracks.map((track, i) => {
            return <AudioWave key={user.userID + 'a' + i} track={track} />
          })
        : []}
    </Box>
  )
}
