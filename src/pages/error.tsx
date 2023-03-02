import { Box, Typography } from '@mui/material'
import { useRouteError } from 'react-router-dom'

export default function ErrorPage() {
  const error = useRouteError() as any
  console.error(error)
  return (
    <Box>
      <Typography variant="h4">抱歉!</Typography>
      <Typography variant="body1">发生了预期之外的错误。</Typography>
      <Typography>
        {error.why || error.message || JSON.stringify(error)}
      </Typography>
    </Box>
  )
}
