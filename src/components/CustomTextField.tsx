import {
  alpha,
  iconButtonClasses,
  InputBase,
  inputBaseClasses,
  InputBaseProps,
  styled,
} from '@mui/material'
import { Theme } from '@mui/material/styles'
import { MUIStyledCommonProps } from '@mui/system/createStyled'

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
  [`& > .${inputBaseClasses.input}`]: {
    height: '1rem',
    // '& ~ div': {
    //   display: 'none',
    // },
    // '&:valid ~ div': {
    //   display: 'inherit',
    // },
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
      {...props}
      // endAdornment={
      //   <InputAdornment position="end">
      //     <IconButton edge="end" type="submit">
      //       <ArrowForwardRounded />
      //     </IconButton>
      //   </InputAdornment>
      // }
    />
  )
}
