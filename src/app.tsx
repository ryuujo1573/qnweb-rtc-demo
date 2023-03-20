import { Alert, CssBaseline, Snackbar, ThemeProvider } from '@mui/material'
import { createTheme } from '@mui/material/styles'
import * as colors from '@mui/material/colors'
import { useEffect, useMemo, useState } from 'react'
import { createHashRouter, RouterProvider } from 'react-router-dom'

import { reset } from './features/messageSlice'
import { ErrorPage, Layout, LiveRoomPage, RoomPage, SetupPage } from './pages'
import { useAppDispatch, useAppSelector } from './store'

const router = createHashRouter(
  [
    {
      path: '/',
      element: <Layout />,
      errorElement: <ErrorPage />,
      children: [
        {
          path: '',
          element: <SetupPage />,
        },
        {
          path: 'room/:roomId',
          element: <RoomPage />,
        },
        {
          path: 'live/:liveId',
          element: <LiveRoomPage />,
        },
      ],
    },
  ],
  {
    basename: import.meta.env['BASE_URL'],
  }
)

export const App = () => {
  const { themeCode, primaryColor } = useAppSelector((s) => s.settings)
  const [darkmode, toggleDarkmode] = useState(themeCode == 'dark')
  const dispatch = useAppDispatch()
  const { grey } = colors

  const theme = useMemo(() => {
    return createTheme({
      palette: darkmode
        ? {
            mode: 'dark',
            primary: colors[primaryColor],
            text: {
              primary: grey[300],
              secondary: grey[500],
            },
            background: {
              default: grey[900],
              paper: grey[800],
            },
          }
        : {
            mode: 'light',
            primary: colors[primaryColor],
            text: {
              primary: grey[900],
              secondary: grey[800],
            },
            background: {
              default: grey[50],
              paper: grey[100],
            },
          },
      shape: {
        borderRadius: 20,
      },
    })
  }, [darkmode, primaryColor])

  useEffect(() => {
    if (themeCode == 'auto') {
      const mq = matchMedia('(prefers-color-scheme: dark)')
      // check system preference once.
      toggleDarkmode(mq.matches)
      // then listen for future changes.
      const onPreferredModeChanged = (ev: MediaQueryListEvent) => {
        toggleDarkmode(ev.matches)
      }
      mq.addEventListener('change', onPreferredModeChanged)
      return () => mq.removeEventListener('change', onPreferredModeChanged)
    } else {
      toggleDarkmode(themeCode == 'dark')
    }
  }, [themeCode])

  // snackbar
  const {
    message: msg,
    severity,
    ...snackBarProps
  } = useAppSelector((s) => s.message.current) ?? {}

  const handleSnackClose = () => dispatch(reset())

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <Snackbar
        autoHideDuration={5000} // override when `auto..` specified in action
        anchorOrigin={{ horizontal: 'center', vertical: 'top' }}
        onClose={handleSnackClose}
        open={!!msg}
        {...snackBarProps}
        {...(severity
          ? { children: <Alert severity={severity}>{msg}</Alert> }
          : { message: msg })}
      />
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}
