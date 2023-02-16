import { VerifiedUserRounded } from '@mui/icons-material'
import { Avatar, Box, Typography } from '@mui/material'
import { QNRemoteUser } from 'qnweb-rtc'
import { stringToColor } from '../utils'
import VideoBox from './VideoBox'

type UserBoxProps = {
  user: QNRemoteUser
}

export default function UserBox({ user }: UserBoxProps) {
  const tracks = user.getVideoTracks()
  const firstTrack = tracks.shift()
  const icon = (
    <VerifiedUserRounded
      sx={{
        fontSize: 'inherit',
        marginInline: '1ch',
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
      }}
    >
      {firstTrack ? undefined : (
        <Avatar
          sx={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            bgcolor: stringToColor(user.userID),
          }}
          children={user.userID
            .split(' ') // TODO: use nickname
            .map((s) => s.charAt(0))
            .join('')}
        />
      )}
      <Typography
        variant="subtitle2"
        sx={{
          position: 'absolute',
          maxWidth: 'calc(100% - 2ch)',
          overflow: 'hidden',
          left: 0,
          bottom: '.5ch',
          zIndex: 2,
        }}
      >
        {icon}
        {user.userID}
      </Typography>
      <VideoBox videoTrack={firstTrack} audioTracks={user.getAudioTracks()} />
      {...tracks.map((track) => {
        return <VideoBox key={user.userID} videoTrack={track} />
      })}
    </Box>
  )
}
