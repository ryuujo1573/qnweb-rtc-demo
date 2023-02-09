import { Alert, createTheme, CssBaseline, PaletteOptions, Snackbar, ThemeProvider } from '@mui/material'
import { blueGrey, grey, lightBlue, teal } from '@mui/material/colors'
import { FC, useEffect, useMemo, useState } from 'react'
import {
  createBrowserRouter,
  RouterProvider
} from "react-router-dom"

import { reset } from './features/messageSlice'
import { selectTheme } from './features/settingSlice'
import { ErrorPage, Layout, RoomPage, SetupPage } from './pages'
import { useAppDispatch, useAppSelector } from './store'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "",
        element: <SetupPage />,
      },
      {
        path: "room/:roomId",
        element: <RoomPage />,
      }
    ]
  },
], {
  basename: import.meta.env['BASE_URL']
})


export const App: FC = () => {
  // theme / darkmode
  const [isDarkmode, toggleDarkmode] = useState(false)
  const themeCode = useAppSelector(selectTheme)
  const dispatch = useAppDispatch()

  const darkModePalette: PaletteOptions = {
    mode: 'dark',
    primary: blueGrey,
    secondary: teal,
    text: {
      primary: grey[300],
      secondary: grey[500],
    },
    background: {
      default: grey[900],
      paper: grey[800],
    },
  }

  const lightModePalette: PaletteOptions = {
    mode: 'light',
    primary: lightBlue,
    secondary: teal,
    text: {
      primary: grey[900],
      secondary: grey[800],
    },
    background: {
      default: grey[50],
      paper: grey[100],
    },
  }

  const theme = useMemo(() => createTheme({
    palette: isDarkmode ? darkModePalette : lightModePalette,
    shape: {
      borderRadius: 20
    }
  }), [isDarkmode]);

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

      // // remove listener when themeCode is no longer 'auto'
      return () => mq.removeEventListener('change', onPreferredModeChanged)
    }
    else {
      toggleDarkmode(themeCode == 'dark')
    }
  }, [themeCode])

  // snackbar
  const { message: msg, severity, ...snackBarProps } = useAppSelector(s => s.message.current) ?? {}

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
        {...severity
          ? { children: <Alert severity={severity}>{msg}</Alert> }
          : { message: msg }}
      />
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}

