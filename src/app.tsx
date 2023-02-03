import QNRTC from 'qnweb-rtc'
import { useEffect, useMemo, useState } from 'react'
import Typography from '@mui/material/Typography'
import { DarkModeRounded, LightModeRounded, SettingsBrightnessRounded } from '@mui/icons-material'
import { CssBaseline, PaletteMode, ToggleButton, ToggleButtonGroup } from '@mui/material'

import { ThemeProvider } from '@mui/material'
import { createTheme } from '@mui/material/styles'
import { grey, lightBlue, blueGrey } from '@mui/material/colors'

export const App = (props: {}) => {
  const [theme, setTheme] = useState(localStorage.getItem('color-theme') ?? 'auto')
  const [isDarkMode, toggleDarkMode] = useState<boolean>()

  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const onPreferredModeChanged = (ev: MediaQueryListEvent) => {
      if (theme == 'auto') {
        toggleDarkMode(ev.matches)
      }
    }
    mq.addEventListener('change', onPreferredModeChanged)

    return () => {
      mq.removeEventListener('change', onPreferredModeChanged)
    }
  }, [])

  const customTheme = useMemo(
    () => createTheme({
      palette: isDarkMode ? {
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
          paper: grey[500],
        },
      },
      shape: {
        borderRadius: 50
      }
    }),
    [isDarkMode]
  )

  return (
    <ThemeProvider theme={customTheme}>
      <CssBaseline enableColorScheme />
      <header>
        <ToggleButtonGroup
          color='primary'
          size='large'
          value={theme}
          exclusive
          onChange={(_, newValue) => {
            if (newValue == null) return

            const isDark = (newValue == 'auto')
              ? matchMedia("(prefers-color-scheme: dark)").matches
              : newValue == 'dark'
            toggleDarkMode(isDark)
            setTheme(newValue)
            localStorage.setItem('color-theme', newValue)
          }}
        >
          <ToggleButton value="light" aria-label='light mode'>
            <LightModeRounded />&nbsp;Light
          </ToggleButton>
          <ToggleButton value="auto" aria-aria-label='auto mode'>
            <SettingsBrightnessRounded />&nbsp;System
          </ToggleButton>
          <ToggleButton value="dark" aria-aria-label='dark mode'>
            <DarkModeRounded />&nbsp;Dark
          </ToggleButton>
        </ToggleButtonGroup>
      </header>
      <main>
        <b>
          Initial Commit. {isDarkMode ? 'dark' : 'light'}
        </b>
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