import { alpha, InputBase, InputBaseProps, styled, Theme } from "@mui/material";
import { MUIStyledCommonProps } from "@mui/system/createStyled"

const Control = styled(InputBase)(({ theme }) => ({
  '& .MuiInputBase-input': {
    borderRadius: '2147483647px',
    position: 'relative',
    backgroundColor: theme.palette.mode === 'light' ? '#fcfcfb' : '#2b2b2b',
    border: '1px solid #ced4da',
    fontSize: 16,
    width: 'auto',
    '--innerHeight': '12px',
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
    '&:focus': {
      boxShadow: `${alpha(theme.palette.primary.main, 0.25)} 0 0 0 0.2rem`,
      borderColor: theme.palette.primary.main,
    },
  },
}))


export function useTextField() {

  return (props: InputBaseProps & MUIStyledCommonProps<Theme>) => (
    <Control {...props}

    />
  )
}
export default Control