import { Check } from '@mui/icons-material'
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import { useState } from 'react'

export type TooltipListProps<T> = {
  onSelect: (value: T, index: number) => void
  list: T[]
  initialIndex?: number
}

export default function TooltipList<
  T extends {
    label: string
  }
>({ onSelect, list, initialIndex }: TooltipListProps<T>) {
  const [selectedIndex, setSelected] = useState(
    initialIndex == -1 ? 0 : initialIndex
  )

  const listitems = list.map((item, i) => {
    const selected = i == selectedIndex
    const { label } = item
    return (
      <ListItem
        key={`li-${i}`}
        disablePadding
        disableGutters
        onClick={() => {
          setSelected(i)
          onSelect(list[i], i)
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
        fontSize: '0.6875rem',
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
