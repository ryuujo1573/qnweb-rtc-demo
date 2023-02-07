import { Backdrop, createTheme, CssBaseline, PaletteOptions, ThemeProvider } from '@mui/material'
import { blueGrey, grey, lightBlue, teal } from '@mui/material/colors'
import { useEffect, useMemo, useState } from 'react'
import {
  createBrowserRouter,
  RouterProvider
} from "react-router-dom"

import { selectTheme } from './features/settingSlice'
import { RoomPage } from './pages'
import ErrorPage from './pages/error'
import Setup from './pages/setup'
import { useAppSelector } from './store'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Setup />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/room/:roomId",
    element: <RoomPage />,
  }
])

export const App = (props: {}) => {
  const [isDarkmode, toggleDarkmode] = useState(false)
  const themeCode = useAppSelector(selectTheme)

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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}

