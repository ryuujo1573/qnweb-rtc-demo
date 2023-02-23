import {
  AccountCircleRounded,
  CheckRounded,
  CloseRounded,
  DarkModeRounded,
  FlipRounded,
  LightModeRounded,
  SettingsBrightnessRounded,
  SettingsRounded,
} from '@mui/icons-material'
import {
  Box,
  Divider,
  Fade,
  IconButton,
  InputAdornment,
  Link,
  paperClasses,
  SwipeableDrawer,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material'
import QNRTC from 'qnweb-rtc'
import { MutableRefObject, useRef, useState } from 'react'
import { Outlet, useOutletContext } from 'react-router'

import { VideoPreview } from '../components'
import { updateUserId } from '../features/identitySlice'
import { setTheme, toggleMirror } from '../features/settingSlice'
import { useAppDispatch, useAppSelector } from '../store'
import { checkUserId, getPassedTimeDesc } from '../utils'

function SectionFragment(props: { title: string; children?: React.ReactNode }) {
  return (
    <>
      <Typography fontWeight={700} variant="body1" color={`#999`}>
        {props.title}
      </Typography>
      {props?.children}
    </>
  )
}

export function useTopRightBox() {
  return useOutletContext<MutableRefObject<HTMLDivElement | undefined>>()
}

export default function Layout() {
  const theme = useTheme()
  const dispatch = useAppDispatch()
  const { themeCode, mirror } = useAppSelector((s) => s.settings)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [userIdText, setUserIdText] = useState('')

  const toggleDrawerHandler =
    (toBe: 'on' | 'off') =>
    (_event: React.KeyboardEvent | React.MouseEvent) => {
      setDrawerOpen(toBe == 'on')
    }

  const buildDate = new Date(
    parseInt(import.meta.env.VITE_APP_BUILD_TIME) * 1000
  )

  const topRightBoxRef = useRef<HTMLDivElement>()

  return (
    <>
      <Outlet context={topRightBoxRef} />
      <Box
        sx={{
          position: 'fixed',
          right: 0,
          top: 0,
          zIndex: 1,
          display: 'flex',
          flexDirection: 'row-reverse',
          m: 1,
          gap: 1,
        }}
        ref={topRightBoxRef}
      >
        <IconButton
          sx={{
            border: '1px solid ' + theme.palette.primary.main,
          }}
          color="primary"
          size="large"
          aria-label="settings"
          onClick={toggleDrawerHandler('on')}
        >
          <SettingsRounded />
        </IconButton>
      </Box>
      {drawerOpen ? (
        <SwipeableDrawer
          anchor="right"
          open={true}
          onClose={toggleDrawerHandler('off')}
          onOpen={toggleDrawerHandler('on')}
          sx={{
            [`& .${paperClasses.root}`]: {
              maxWidth: '360px',
              gap: 2,
              padding: 2,
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Typography variant="h6" component={'span'}>
              设置
            </Typography>
            <IconButton
              onClick={toggleDrawerHandler('off')}
              sx={{
                marginLeft: 'auto',
              }}
            >
              <CloseRounded />
            </IconButton>
          </Box>
          <Divider variant="fullWidth" />
          <SectionFragment title="主题模式">
            <ToggleButtonGroup
              fullWidth
              color="primary"
              size="medium"
              value={themeCode}
              exclusive
              onChange={(_, newValue) => {
                if (newValue == null) return
                dispatch(setTheme(newValue))
              }}
            >
              <ToggleButton value="light" aria-label="light mode">
                <LightModeRounded />
                &nbsp;Light
              </ToggleButton>
              <ToggleButton value="auto" aria-label="auto mode">
                <SettingsBrightnessRounded />
                &nbsp;System
              </ToggleButton>
              <ToggleButton value="dark" aria-label="dark mode">
                <DarkModeRounded />
                &nbsp;Dark
              </ToggleButton>
            </ToggleButtonGroup>
          </SectionFragment>
          <SectionFragment title="用户">
            <TextField
              label="修改userID"
              variant="standard"
              value={userIdText}
              onChange={(e) => setUserIdText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key == 'enter' && checkUserId(userIdText)) {
                  dispatch(updateUserId(userIdText))
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccountCircleRounded />
                  </InputAdornment>
                ),
                endAdornment: (
                  <Fade in={checkUserId(userIdText)}>
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => dispatch(updateUserId(userIdText))}
                      >
                        <CheckRounded />
                      </IconButton>
                    </InputAdornment>
                  </Fade>
                ),
              }}
            />
          </SectionFragment>
          <SectionFragment title="视频">
            <VideoPreview />
            <ToggleButton
              value={true}
              selected={mirror}
              onChange={() => {
                dispatch(toggleMirror(!mirror))
              }}
            >
              <FlipRounded />
            </ToggleButton>
          </SectionFragment>
          <SectionFragment title="音频"></SectionFragment>
          <SectionFragment title="关于">
            <Typography variant="body2" textAlign="left">
              DEMO VERSION:{' '}
              <b color={theme.palette.secondary.main}>
                {import.meta.env.VITE_APP_VERSION}:{' '}
                {import.meta.env.VITE_APP_LATEST_COMMIT_HASH}
              </b>
              <br />
              SDK VERSION:{' '}
              <b color={theme.palette.secondary.main}>{QNRTC.VERSION}</b>
              <br />
              BUILD TIME: <b>{buildDate.toLocaleString()}</b> (
              {getPassedTimeDesc(buildDate)})
            </Typography>
            <Link href="https://www.qiniu.com/products/rtn" variant="body2">
              Qiniu 七牛云
            </Link>
          </SectionFragment>
        </SwipeableDrawer>
      ) : undefined}
    </>
  )
}
