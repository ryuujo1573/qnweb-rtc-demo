import { ArrowForwardRounded } from '@mui/icons-material'
import {
  alpha,
  IconButton,
  iconButtonClasses,
  InputAdornment,
  InputBase,
  inputBaseClasses,
  InputBaseProps,
  styled,
} from '@mui/material'

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  width: '300px',
  '--innerHeight': '14px',
  borderRadius: '100vh',
  backgroundColor: theme.palette.mode === 'light' ? '#fcfcfb' : '#2b2b2b',
  border: '1px solid #ced4da',
  position: 'relative',
  fontSize: 16,
  padding: 'var(--innerHeight) calc(.5rem + var(--innerHeight))',
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
  return (props: InputBaseProps) => <StyledInputBase {...props} />
}

export type CustomProps = {
  pattern?: RegExp | string
  debounce?: number
}

export default function CustomTextField({
  pattern,
  debounce,
  ...props
}: InputBaseProps & CustomProps) {
  return (
    <StyledInputBase
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
