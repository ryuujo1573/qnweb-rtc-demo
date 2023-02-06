import QNRTC from 'qnweb-rtc'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import Typography from '@mui/material/Typography'
import { CloseRounded, DarkModeRounded, LightModeRounded, SettingsBrightnessRounded, SettingsRounded } from '@mui/icons-material'
import { Avatar, Box, Button, Chip, CssBaseline, Divider, IconButton, Link, SwipeableDrawer, TextField, Theme, ToggleButton, ToggleButtonGroup } from '@mui/material'

import { ThemeProvider } from '@mui/material'
import { createTheme } from '@mui/material/styles'
import { grey, lightBlue, blueGrey } from '@mui/material/colors'
import { CustomTextField, UserDialog } from './components'
import { useDebounce } from './utils'

export const App = (props: {}) => {
  const [themeCode, setThemeCode] = useState(localStorage.getItem('color-theme') ?? 'auto')
  const [isDarkMode, toggleDarkMode] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [nickname, setNickname] = useState<string>()
  const [userDialogOpen, setUserDialogOpen] = useState(false)

  // the customTheme depends on `isDarkMode` which is set on `theme` changing.
  useEffect(() => {
    if (themeCode == 'auto') {
      const mq = matchMedia('(prefers-color-scheme: dark)')
      // check system preference once.
      toggleDarkMode(mq.matches)
      // then listen for future changes.
      const onPreferredModeChanged = (ev: MediaQueryListEvent) => {
        toggleDarkMode(ev.matches)
      }
      mq.addEventListener('change', onPreferredModeChanged)

      // remove listener when themeCode is no longer 'auto'
      return () => {
        mq.removeEventListener('change', onPreferredModeChanged)
      }
    }
    else {
      toggleDarkMode(themeCode == 'dark')
    }

  }, [themeCode])

  const customTheme = useMemo(
    () => createTheme({
      palette: {
        ...(isDarkMode ? {
          mode: 'dark',
          primary: blueGrey,
          text: {
            primary: grey[300],
            secondary: grey[500],
          },
          background: {
            default: grey[900],
            paper: grey[900],
          },
        } : {
          mode: 'light',
          primary: lightBlue,
          text: {
            primary: grey[900],
            secondary: grey[800],
          },
          background: {
            default: grey[50],
            paper: grey[100],
          },
        })
      },
      shape: {
        borderRadius: 20
      }
    }),
    [isDarkMode]
  )

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

  const dialogOpenHandler = () => setUserDialogOpen(true)
  const dialogCloseHandler = () => setUserDialogOpen(false)

  const roomIdRegex = /^[0-9a-zA-Z_-]{3,64}$/
  const textChangeHandler = useDebounce((event: ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value

    if (text.length && !roomIdRegex.test(text)) {
      console.error(event.target.value)
    }
  }, 1500)

  return (
    <ThemeProvider theme={customTheme}>
      <CssBaseline enableColorScheme />
      <header>
        <div style={{
          marginInlineStart: 'auto',
        }}>
          <Chip
            size='medium'
            avatar={<Avatar>{nickname?.slice(0, 1).toUpperCase()}</Avatar>}
            label={nickname ?? '请登录'}
            clickable={true}
            onClick={dialogOpenHandler}
            sx={{
              transform: `scale(${42 / 32})`,
              marginInline: '16px'
            }}
          ></Chip>
          <UserDialog open={userDialogOpen}
            onFinished={({ nickname }) => {
              setNickname(nickname)
              dialogCloseHandler()
            }}
            onClosed={dialogCloseHandler}
            state={{ nickname }}
          />
          <IconButton
            sx={{
              border: '1px solid ' + customTheme.palette.primary.main,
              ":hover": {
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
                value={themeCode}
                exclusive
                onChange={(_, newValue) => {
                  if (newValue == null) return
                  setThemeCode(newValue)
                  localStorage.setItem('color-theme', newValue)
                }}
              >
                <ToggleButton value="light" aria-label='light mode'>
                  <LightModeRounded />&nbsp;Light
                </ToggleButton>
                <ToggleButton value="auto" aria-label='auto mode'>
                  <SettingsBrightnessRounded />&nbsp;System
                </ToggleButton>
                <ToggleButton value="dark" aria-label='dark mode'>
                  <DarkModeRounded />&nbsp;Dark
                </ToggleButton>
              </ToggleButtonGroup>
            </SectionFragment>
            <SectionFragment title='视频'>

            </SectionFragment>
            <SectionFragment title='音频'>

            </SectionFragment>
            <SectionFragment title='关于'>
              <Link href="https://www.qiniu.com/products/rtn" variant='body2'>🐮七牛云</Link>
            </SectionFragment>
          </SwipeableDrawer>
        </div>

      </header>
      <main>
        <img src='/qiniu.svg' alt='logo' width={300} className="logo" />
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const value = document.querySelector<HTMLInputElement>('#roomId')!.value
            if (roomIdRegex.test(value))
              alert(value)
          }}
        >
          <CustomTextField
            placeholder="请输入房间名"
            id="roomId"
            onChange={textChangeHandler}
          />
          <Link variant='body2' underline='hover' sx={{
            display: 'block',
            textAlign: 'end',
            padding: 1
          }} >使用 roomToken ?</Link>
          <input type="submit" hidden />
        </form>
      </main>
      <footer>
        <Typography variant="body2" textAlign="center">
          DEMO VERSION: {import.meta.env.VITE_APP_VERSION}: {import.meta.env.VITE_APP_LATEST_COMMIT_HASH}
          <br />
          SDK VERSION: {QNRTC.VERSION}
        </Typography>
      </footer>
    </ThemeProvider>
  )
}

function SectionFragment(props: { title: string, children?: React.ReactNode }) {
  return <>
    <Typography fontWeight={700} variant='body1' color={`#999`}>{props.title}</Typography>
    {props?.children}
  </>
}
