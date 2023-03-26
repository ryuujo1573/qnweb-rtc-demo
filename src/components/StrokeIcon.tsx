import { SvgIcon, SvgIconProps } from '@mui/material'

export default function StrokeIcon({
  children,
  stroked,
  sx,
  ...props
}: SvgIconProps & { stroked?: boolean }) {
  const strokedIcon = (
    <SvgIcon
      sx={{
        svg: {
          mask: 'url(#mask)',
        },
        ...sx,
      }}
      {...props}
    >
      {children}
      <mask id="mask">
        <rect x="0" y="0" width="24" height="24" fill="white" />
        <line x1="1" x2="25" y1="-1" y2="23" stroke="black" strokeWidth="4" />
      </mask>
      <line
        x1="0"
        x2="24"
        y1="0"
        y2="24"
        stroke="currentColor"
        strokeWidth="2"
      />
    </SvgIcon>
  )

  return stroked ? strokedIcon : <>{children}</>
}
