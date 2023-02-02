import QNRTC from 'qnweb-rtc'
import React from 'react'
import { css } from '@emotion/react'
import Typography from '@mui/material/Typography'



export const App = (props: {}) => {
  return <>
    <main>
      <b>
        Initial Commit.
      </b>
    </main>
    <footer>
      <Typography variant="body2" textAlign="center">
        DEMO VERSION: {import.meta.env.VITE_APP_VERSION}: {import.meta.env.VITE_APP_LATEST_COMMIT_HASH}
        <br />
        SDK VERSION: {QNRTC.VERSION}
      </Typography>
    </footer>
  </>
}