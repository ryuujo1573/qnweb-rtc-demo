import { SettingsRounded, CloseRounded, LightModeRounded, SettingsBrightnessRounded, DarkModeRounded } from "@mui/icons-material"
import { Box, IconButton, SwipeableDrawer, Typography, Divider, ToggleButtonGroup, ToggleButton, Link, Snackbar, SnackbarProps, Alert } from "@mui/material"
import QNRTC from "qnweb-rtc"
import { ChangeEvent, useState } from "react"
import { useNavigate } from 'react-router-dom'

import { CustomTextField, VideoPreview } from "../components"
import { useAppSelector } from "../store"
import { checkRoomId, useDebounce, useTheme } from "../utils"


function SectionFragment(props: { title: string, children?: React.ReactNode }) {
  return <>
    <Typography fontWeight={700} variant='body1' color={`#999`}>{props.title}</Typography>
    {props?.children}
  </>
}

export default function SetupPage() {
  const theme = useTheme()
  const { auth, nickname } = useAppSelector((s) => s.identity)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [connectById, setConnectById] = useState(true)
  const [snackState, setSnackState] = useState<SnackbarProps>()
  const handleSnackClose = () => setSnackState({ open: false })

  const navigate = useNavigate()

  const toggleDrawerHandler =
    (toBe: 'on' | 'off') =>
      (event: React.KeyboardEvent | React.MouseEvent) => {
        if (
          event &&
          event.type === 'keydown' &&
          ((event as React.KeyboardEvent).key === 'Tab' ||
            (event as React.KeyboardEvent).key === 'Shift')
        ) {
          return;
        }

        setDrawerOpen(toBe == 'on');
      };

  const textChangeHandler = useDebounce((event: ChangeEvent<HTMLInputElement>) => {
    const roomId = event.target.value

    if (roomId.length && !checkRoomId(roomId)) {
      console.error(event.target.value)
      // todo: debounce changes and show error tints
    }
  }, 1500)

  return <><header>
    <Box sx={{
      marginInlineStart: 'auto',
    }}>
      <IconButton
        sx={{
          border: '1px solid ' + theme.palette.primary.main,
          ':hover': {
            // borderWidth: '3px', // TODO: fix shakes
          },
          margin: 1,
        }}
        color='primary'
        size='medium'
        aria-label='settings'
        onClick={toggleDrawerHandler('on')}
      >
        <SettingsRounded />
      </IconButton>
      <SwipeableDrawer
        anchor='right'
        open={drawerOpen}
        onClose={toggleDrawerHandler('off')}
        onOpen={toggleDrawerHandler('on')}
        sx={{
          '& .MuiPaper-root': {
            gap: 2,
            padding: 2,
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant='h6' component={'span'}>设置</Typography>
          <IconButton
            onClick={toggleDrawerHandler('off')}
            sx={{
              marginLeft: 'auto'
            }}><CloseRounded /></IconButton>
        </Box>
        <Divider variant='fullWidth' />
        <SectionFragment title='主题模式'>
          <ToggleButtonGroup
            sx={{
              // position: 'absolute',
              marginInlineStart: 'auto'
            }}
            color='primary'
            size='medium'
            value={theme.current}
            exclusive
            onChange={(_, newValue) => {
              if (newValue == null) return
              theme.change(newValue)
              localStorage.setItem('color-theme', newValue)
            }}
          >
            <ToggleButton value='light' aria-label='light mode'>
              <LightModeRounded />&nbsp;Light
            </ToggleButton>
            <ToggleButton value='auto' aria-label='auto mode'>
              <SettingsBrightnessRounded />&nbsp;System
            </ToggleButton>
            <ToggleButton value='dark' aria-label='dark mode'>
              <DarkModeRounded />&nbsp;Dark
            </ToggleButton>
          </ToggleButtonGroup>
        </SectionFragment>
        <SectionFragment title='视频'>
          <VideoPreview />
        </SectionFragment>
        <SectionFragment title='音频'>

        </SectionFragment>
        <SectionFragment title='关于'>
          <Link href='https://www.qiniu.com/products/rtn' variant='body2'>Qiniu 七牛云</Link>
        </SectionFragment>
      </SwipeableDrawer>
    </Box>

  </header>
    <main>
      <img src='/qiniu.svg' alt='logo' width={300} className='logo' />
      <Snackbar
        autoHideDuration={5000}
        anchorOrigin={{ horizontal: 'center', vertical: 'top' }}
        onClose={handleSnackClose}
        {...snackState}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const roomId = document.querySelector<HTMLInputElement>('#roomId')!.value
          if (checkRoomId(roomId)) {
            navigate('/room/' + roomId)
          } else {
            setSnackState({
              open: true,
              children: <Alert severity="error" onClose={handleSnackClose}>{"房间名限制3~64个字符，并且只能包含字母、数字或下划线"}</Alert>,
            })
          }
        }}
      >
        <CustomTextField
          placeholder={connectById ? '请输入房间名' : '请输入 roomToken'}
          id='roomId'
          onChange={textChangeHandler}
        />
        <Link variant='body2' underline='hover' sx={{
          display: 'block',
          textAlign: 'end',
          padding: 1
        }} onClick={() => setConnectById(!connectById)}>{connectById ? '使用 roomToken ?' : '使用房间名?'}</Link>
        <input type='submit' hidden />
      </form>
    </main>
    <footer>
      <Typography variant='body2' textAlign='center'>
        DEMO VERSION: <b color={theme.palette.secondary.main}>{import.meta.env.VITE_APP_VERSION}: {import.meta.env.VITE_APP_LATEST_COMMIT_HASH}</b>
        <br />
        SDK VERSION: <b color={theme.palette.secondary.main}>{QNRTC.VERSION}</b>
      </Typography>
    </footer>
  </>
}