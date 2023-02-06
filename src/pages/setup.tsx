import { SettingsRounded, CloseRounded, LightModeRounded, SettingsBrightnessRounded, DarkModeRounded } from "@mui/icons-material"
import { Box, IconButton, SwipeableDrawer, Typography, Divider, ToggleButtonGroup, ToggleButton, Link } from "@mui/material"
import QNRTC from "qnweb-rtc"
import { ChangeEvent, useState } from "react"
import { CustomTextField } from "../components"
import { useAppSelector } from "../store"
import { useDebounce, useTheme } from "../utils"


function SectionFragment(props: { title: string, children?: React.ReactNode }) {
  return <>
    <Typography fontWeight={700} variant='body1' color={`#999`}>{props.title}</Typography>
    {props?.children}
  </>
}

export default function () {
  const theme = useTheme()
  const { auth, nickname } = useAppSelector((s) => s.identity)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [connectById, setConnectById] = useState(true)

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

  const roomIdRegex = /^[0-9a-zA-Z_-]{3,64}$/
  const textChangeHandler = useDebounce((event: ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value

    if (text.length && !roomIdRegex.test(text)) {
      console.error(event.target.value)
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
          <IconButton sx={{
            lineHeight: 1,
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

        </SectionFragment>
        <SectionFragment title='音频'>

        </SectionFragment>
        <SectionFragment title='关于'>
          <Link href='https://www.qiniu.com/products/rtn' variant='body2'>🐮七牛云</Link>
        </SectionFragment>
      </SwipeableDrawer>
    </Box>

  </header>
    <main>
      <img src='/qiniu.svg' alt='logo' width={300} className='logo' />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const value = document.querySelector<HTMLInputElement>('#roomId')!.value
          if (roomIdRegex.test(value))
            alert(value)
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
        DEMO VERSION: {import.meta.env.VITE_APP_VERSION}: {import.meta.env.VITE_APP_LATEST_COMMIT_HASH}
        <br />
        SDK VERSION: {QNRTC.VERSION}
      </Typography>
    </footer>
  </>
}