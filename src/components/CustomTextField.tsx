import {
  ArrowForwardIosRounded,
  ArrowForwardRounded,
  ArrowRightRounded,
} from '@mui/icons-material'
import {
  alpha,
  IconButton,
  iconButtonClasses,
  InputAdornment,
  InputBase,
  inputBaseClasses,
  InputBaseProps,
  styled,
  svgIconClasses,
  Theme,
} from '@mui/material'
import { MUIStyledCommonProps } from '@mui/system/createStyled'
import { ChangeEvent, useState } from 'react'
import { useDebounce } from '../utils'

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  width: '300px',
  '--innerHeight': '14px',
  borderRadius: '100vh',
  backgroundColor: theme.palette.mode === 'light' ? '#fcfcfb' : '#2b2b2b',
  border: '1px solid #ced4da',
  position: 'relative',
  fontSize: 16,
  padding: 'var(--innerHeight) calc(.5rem + var(--innerHeight))',
  // Use the system font instead of the default Roboto font.
  fontFamily: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
  ].join(','),
  [`& > .${inputBaseClasses.input}`]: {
    height: '1rem',
    '& ~ div': {
      display: 'none',
    },
    '&:valid ~ div': {
      display: 'inherit',
    },
  },
  '&:focus-within': {
    boxShadow: `${alpha(theme.palette.primary.main, 0.25)} 0 0 0 0.2rem`,
    borderColor: theme.palette.primary.main,
  },
  [`& .${iconButtonClasses.root}`]: {
    ':hover': {
      color: theme.palette.primary.main,
    },
  },
}))

export function useTextField() {
  return (props: InputBaseProps & MUIStyledCommonProps<Theme>) => (
    <StyledInputBase {...props} />
  )
}

export type CustomProps = {
  pattern?: RegExp | string
  debounce?: number
}

export default function CustomTextField({
  pattern,
  debounce,
  ...props
}: InputBaseProps & MUIStyledCommonProps<Theme> & CustomProps) {
  return (
    <StyledInputBase
      required
      {...props}
      endAdornment={
        <InputAdornment position="end">
          <IconButton edge="end" type="submit">
            <ArrowForwardRounded />
          </IconButton>
        </InputAdornment>
      }
    />
  )
}
