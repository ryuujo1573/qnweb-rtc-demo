import { Check } from '@mui/icons-material'
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material'

export type TooltipListProps<T> = {
  index?: number
  onSelect: (index: number) => void
  list: T[]
}

export default function TooltipList<
  T extends {
    label: string
  }
>({ index: selectedIndex, onSelect, list }: TooltipListProps<T>) {
  const listitems = list.map((item, i) => {
    const selected = i == selectedIndex
    const { label } = item
    return (
      <ListItem
        key={`li-${i}`}
        disablePadding
        disableGutters
        onClick={() => {
          console.log(`[${label}] selected. %c(${i})`, 'color: gray')
          onSelect(i)
        }}
      >
        <ListItemButton disableGutters>
          <ListItemIcon>{selected ? <Check /> : undefined}</ListItemIcon>
          <ListItemText>{label}</ListItemText>
        </ListItemButton>
      </ListItem>
    )
  })

  return (
    <List
      dense
      disablePadding
      sx={{
        '& .MuiListItemIcon-root': {
          minWidth: 30,
          marginRight: '4px',
        },
      }}
    >
      {listitems.length ? listitems : '无可用设备'}
    </List>
  )
}
