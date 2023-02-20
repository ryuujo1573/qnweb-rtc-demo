import { Audiotrack, VerifiedUserRounded } from '@mui/icons-material'
import { Avatar, Box, Typography } from '@mui/material'
import { QNRemoteUser } from 'qnweb-rtc'
import { RemoteUser } from '../pages/room'
import { stringToColor } from '../utils'
import AudioWave from './AudioWave'
import VideoBox from './VideoBox'

type UserBoxProps = {
  user: RemoteUser
}

export default function UserBox({ user }: UserBoxProps) {
  // debugger
  const videoTracks = user.videoTracks
  const audioTracks = user.audioTracks

  const icon = (
    <VerifiedUserRounded
      sx={{
        fontSize: 'inherit',
        marginInlineEnd: '4px',
        verticalAlign: 'middle',
      }}
    />
  )

  return (
    <Box
      sx={{
        display: 'flex',
        position: 'relative',
        border: 'InactiveBorder 2px solid',
        marginInline: 0.2,
        height: '180px',
        width: '240px',
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          position: 'absolute',
          // maxWidth: 'calc(100% - 2ch)',
          width: '100%',
          padding: '4px',
          bottom: 0,
          zIndex: 2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {icon}
        {user.userData ?? user.userID}
      </Typography>
      {videoTracks.length == 0 && audioTracks.length == 0 ? (
        <Avatar
          sx={{
            margin: 'auto',
            bgcolor: stringToColor(user.userID),
          }}
          children={(user.userData ?? user.userID)
            .split(' ') // TODO: use nickname
            .map((s) => s.charAt(0))
            .join('')}
        />
      ) : undefined}
      {...videoTracks.map((track) => {
        return (
          <VideoBox
            key={user.userID}
            videoTrack={track}
            sx={{
              height: '180px',
            }}
          ></VideoBox>
        )
      })}
      {...videoTracks.length == 0
        ? audioTracks.map((track) => {
            return (
              <></>
              // <AudioWave track={track} height={180} width={240}></AudioWave>
            )
          })
        : []}
    </Box>
  )
}
