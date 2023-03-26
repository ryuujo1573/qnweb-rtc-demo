import {
  AccountCircleRounded,
  AppsRounded,
  CheckRounded,
  CloseRounded,
  FlipRounded,
  SettingsRounded,
} from '@mui/icons-material'
import {
  Box,
  buttonBaseClasses,
  Checkbox,
  Divider,
  Fade,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  MenuItem,
  paperClasses,
  svgIconClasses,
  SwipeableDrawer,
  TextField,
  ToggleButton,
  Typography,
  useTheme,
} from '@mui/material'
import QNRTC from 'qnweb-rtc'
import { MutableRefObject, Suspense, useRef, useState } from 'react'
import { Outlet, useOutletContext } from 'react-router'

import { VideoPreview } from '../components'
import {
  allCameraPresets,
  allCameraPresetsText,
  allScreenPresets,
  allScreenPresetsText,
} from '../consts'
import { updateUserId } from '../features/identitySlice'
import { success } from '../features/messageSlice'
import {
  isCameraPreset,
  isScreenPreset,
  save,
  setDefaultCamera,
  update,
} from '../features/settingSlice'
import { useAppDispatch, useAppSelector } from '../store'
import { checkAppId, checkUserId, getPassedTimeDesc, isMobile } from '../utils'

function SectionFragment(props: { title: string; children?: React.ReactNode }) {
  return (
    <>
      <Typography sx={{ userSelect: 'none', mt: 2 }} variant="subtitle1">
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
  const {
    appId,
    themeCode,
    mirror,
    cameras,
    defaultCamera,
    cameraPreset,
    screenPreset,
    cameraMuted,
    microphoneMuted,
    neverPrompt,
    showProfile,
  } = useAppSelector((s) => s.settings)
  const { userId } = useAppSelector((s) => s.identity)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [userIdText, setUserIdText] = useState('')
  const [appIdText, setAppIdText] = useState('')

  const toggleDrawerHandler =
    (toBe: 'on' | 'off') =>
    (_event: React.KeyboardEvent | React.MouseEvent) => {
      setDrawerOpen(toBe == 'on')
    }

  const buildDate = new Date(
    parseInt(import.meta.env.VITE_APP_BUILD_TIME) * 1000
  )

  const topRightBoxRef = useRef<HTMLDivElement>()

  const handleModifyId = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key != 'Enter') {
      return
    }
    if (checkUserId(userIdText)) {
      dispatch(updateUserId(userIdText))
      dispatch(success({ message: '用户 ID 修改成功' }))
      setUserIdText('')
    }
  }

  const handleModifyAppId = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key != 'Enter') {
      return
    }
    if (checkAppId(appIdText)) {
      dispatch(save({ appId: appIdText }))
      dispatch(success({ message: 'APP_ID 修改成功' }))
      setAppIdText('')
    }
  }

  const mobile = isMobile()

  return (
    <Suspense fallback={<></>}>
      <Outlet context={topRightBoxRef} />
      <Box
        sx={{
          position: 'fixed',
          right: 0,
          top: 0,
          zIndex: 100,
          display: 'flex',
          flexDirection: mobile ? 'column' : 'row-reverse',
          alignItems: 'center',
          justifyContent: 'center',
          m: 1,
          [`& > .${buttonBaseClasses.root}`]: {
            '--dimension': '4.5rem',
            '--padding': '.2rem',
            fontSize: '0.8rem',
            display: 'flex',
            flexDirection: 'column',
            [`.${svgIconClasses.root}`]: {
              fontSize: '2rem',
            },
            width: 'var(--dimension)',
            height: 'var(--dimension)',
          },
        }}
        ref={topRightBoxRef}
      >
        <IconButton
          color="primary"
          size="medium"
          aria-label="settings"
          // variant="outlined"
          onClick={toggleDrawerHandler('on')}
        >
          <SettingsRounded fontSize="large" />
          设置
        </IconButton>
      </Box>
      {drawerOpen && (
        <SwipeableDrawer
          anchor={'right'}
          open={drawerOpen}
          onClose={toggleDrawerHandler('off')}
          onOpen={toggleDrawerHandler('on')}
          sx={{
            [`& .${paperClasses.root}`]: {
              width: mobile ? '100vw' : '360px',
              padding: 2,
              overflowY: 'scroll',
              // gap: 2,
              // compatible with iPhone 11 Pro Max
              '& > *': {
                marginBlockEnd: 2,
                flexShrink: 0,
              },
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Typography
              sx={{ userSelect: 'none' }}
              variant="h6"
              component={'span'}
            >
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
          {/* <SectionFragment title="主题模式">
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
          </SectionFragment> */}
          <SectionFragment title="默认操作">
            <Box display="flex" flexDirection="column">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!microphoneMuted}
                    onChange={(_, v) => {
                      dispatch(save({ microphoneMuted: !v }))
                    }}
                  />
                }
                label="入会开启麦克风"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!cameraMuted}
                    onChange={(_, v) => {
                      dispatch(save({ cameraMuted: !v }))
                    }}
                  />
                }
                label="入会开启摄像头"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={neverPrompt}
                    onChange={(_, v) => {
                      dispatch(save({ neverPrompt: v }))
                    }}
                  />
                }
                label="跳过入会时设备检查"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={showProfile}
                    onChange={(_, v) => {
                      dispatch(save({ showProfile: v }))
                    }}
                  />
                }
                label="显示媒体详细信息"
              />
            </Box>
          </SectionFragment>
          <SectionFragment title="应用设置">
            <TextField
              label="用户ID"
              variant="standard"
              placeholder={userId ?? undefined}
              value={userIdText}
              onChange={(e) => setUserIdText(e.target.value)}
              onKeyDown={handleModifyId}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccountCircleRounded />
                  </InputAdornment>
                ),
                endAdornment: (
                  <Fade in={checkUserId(userIdText)}>
                    <InputAdornment position="end">
                      <IconButton onClick={handleModifyId}>
                        <CheckRounded />
                      </IconButton>
                    </InputAdornment>
                  </Fade>
                ),
              }}
            />
            <TextField
              label="APP_ID"
              variant="standard"
              placeholder={appId ?? undefined}
              value={appIdText}
              onChange={(e) => setAppIdText(e.target.value)}
              onKeyDown={handleModifyAppId}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AppsRounded />
                  </InputAdornment>
                ),
                endAdornment: (
                  <Fade in={checkAppId(appIdText)}>
                    <InputAdornment position="end">
                      <IconButton onClick={handleModifyAppId}>
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
                dispatch(update({ mirror: !mirror }))
              }}
            >
              <FlipRounded />
              &nbsp;视频镜像翻转
            </ToggleButton>

            <TextField
              select
              fullWidth
              label="视频设备"
              variant="standard"
              value={defaultCamera}
              disabled={!cameras.length}
              onChange={(evt) => {
                dispatch(setDefaultCamera(evt.target.value))
              }}
            >
              {cameras.map((camInfo) => {
                return (
                  <MenuItem key={camInfo.deviceId} value={camInfo.deviceId}>
                    {camInfo.label}
                  </MenuItem>
                )
              })}
            </TextField>
            <TextField
              select
              fullWidth
              label="视频规格预设"
              variant="standard"
              value={cameraPreset}
              onChange={(evt) => {
                if (isCameraPreset(evt.target.value)) {
                  dispatch(update({ cameraPreset: evt.target.value }))
                }
              }}
            >
              {allCameraPresets.map((key) => (
                <MenuItem key={key} value={key}>
                  {allCameraPresetsText[key]}
                </MenuItem>
              ))}
            </TextField>
          </SectionFragment>
          <SectionFragment title="屏幕共享">
            <TextField
              select
              fullWidth
              label="屏幕共享规格"
              variant="standard"
              value={screenPreset}
              onChange={(evt) => {
                if (isScreenPreset(evt.target.value)) {
                  dispatch(update({ screenPreset: evt.target.value }))
                }
              }}
            >
              {allScreenPresets.map((key) => (
                <MenuItem key={key} value={key}>
                  {allScreenPresetsText[key]}
                </MenuItem>
              ))}
            </TextField>
          </SectionFragment>
          <SectionFragment title="关于">
            <Typography variant="body2" textAlign="left">
              DEMO VERSION:{' '}
              <b>
                {import.meta.env.VITE_APP_VERSION}:{' '}
                {import.meta.env.VITE_APP_LATEST_COMMIT_HASH}
              </b>
              <br />
              SDK VERSION: <b>{QNRTC.VERSION}</b>
              <br />
              BUILD TIME: <b>{buildDate.toLocaleString()}</b> (
              {getPassedTimeDesc(buildDate)})
            </Typography>
            <Link href="https://www.qiniu.com/products/rtn" variant="body2">
              Qiniu 七牛云
            </Link>
          </SectionFragment>
        </SwipeableDrawer>
      )}
    </Suspense>
  )
}
