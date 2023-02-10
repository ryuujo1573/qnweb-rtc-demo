import { ContentCopyRounded } from "@mui/icons-material";
import { Typography, IconButton } from "@mui/material";
import { Box, useTheme } from "@mui/system";
import { QNConnectionState } from "qnweb-rtc";
import { Fragment } from "react";

type _Props = {
  connectionState: QNConnectionState,
  roomId: string
}

export default function DetailPanel({ connectionState, roomId }: _Props) {
  const theme = useTheme()

  const handleCopyInvitation = () => {
    navigator.clipboard.writeText(window.location.href)
  }

  return <Box component='aside' sx={{
    position: 'fixed',
    margin: '1ch',
    padding: '1ch',
    maxWidth: '90%',
    backgroundColor: '#eeeeee20',
  }}
  >
    <Typography variant='caption' sx={{
      display: 'flex',
      alignItems: 'center',
    }}>
      <b>房间:&nbsp;</b>{roomId}
      <Typography color={theme.palette.secondary.main} pl='1ch' fontWeight={700}>
        {connectionState}
      </Typography>
      <IconButton onClick={handleCopyInvitation} sx={{
        marginLeft: 'auto'
      }}><ContentCopyRounded /></IconButton>
    </Typography>
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      columnGap: 1,
    }}>
      {...Object.entries({
        '视频丢包率': '114514',
        '音频丢包率': '0.00 %',
        '屏幕分享丢包率': '0.00 %',
        '视频实时码率': '459.19 kbps',
        '音频实时码率': '22.11 kbps',
        '屏幕分享实时码率': '0.00 kbps',
      }).map(([k, v], i) => <Fragment key={`line${i}`}>
        <Typography variant="body2" align="right" sx={{
          fontWeight: 700,
        }}>{k}</Typography>
        <Typography variant="body2" align="left">{v}</Typography>
      </Fragment>)}
    </Box>
  </Box>
}