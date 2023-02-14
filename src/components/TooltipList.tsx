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
      {...list.map((item, i) => {
        const selected = i == selectedIndex
        const { label } = item
        return (
          <ListItem
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
      })}
    </List>
  )
}
