import { CloseRounded, DarkModeRounded, LightModeRounded, SettingsBrightnessRounded, SettingsRounded } from '@mui/icons-material'
import { Box, Divider, IconButton, Link, SwipeableDrawer, ToggleButton, ToggleButtonGroup, Typography, useTheme } from '@mui/material'
import { useState } from 'react'
import { Outlet } from 'react-router'

import { VideoPreview } from '../components'
import { setTheme } from '../features/settingSlice'
import { useAppDispatch, useAppSelector } from '../store'


function SectionFragment(props: { title: string, children?: React.ReactNode }) {
  return <>
    <Typography fontWeight={700} variant='body1' color={`#999`}>{props.title}</Typography>
    {props?.children}
  </>
}

export default function Layout() {
  const theme = useTheme()
  const dispatch = useAppDispatch()
  const { themeCode } = useAppSelector(s => s.settings)

  const [drawerOpen, setDrawerOpen] = useState(false)

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
        setDrawerOpen(toBe == 'on')
      }

  return <>
    <Outlet />
    <Box sx={{
      marginInlineStart: 'auto',
      position: 'fixed',
      right: 0,
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
            value={themeCode}
            exclusive
            onChange={(_, newValue) => {
              if (newValue == null) return
              dispatch(setTheme(newValue))
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
  </>
}