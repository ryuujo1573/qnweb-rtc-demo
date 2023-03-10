import {
  SignalCellularAlt,
  SignalCellularAlt1Bar,
  SignalCellularAlt2Bar,
} from '@mui/icons-material'
import { QNNetworkQuality } from 'qnweb-rtc'

export default function NetworkIcon(props: { quality: QNNetworkQuality }) {
  switch (props.quality) {
    case QNNetworkQuality.EXCELLENT:
      return (
        <SignalCellularAlt
          sx={{
            color: '#4caf50',
          }}
        />
      )
    case QNNetworkQuality.GOOD:
      return (
        <SignalCellularAlt
          sx={{
            color: '#8bc34a',
          }}
        />
      )
    case QNNetworkQuality.FAIR:
      return (
        <SignalCellularAlt2Bar
          sx={{
            color: '#ffeb3b',
          }}
        />
      )
    case QNNetworkQuality.POOR:
      return (
        <SignalCellularAlt1Bar
          sx={{
            color: '#8bc34a',
          }}
        />
      )
    case QNNetworkQuality.UNKNOWN:
      return (
        <SignalCellularAlt
          sx={{
            color: 'grey',
          }}
        />
      )
  }
}
