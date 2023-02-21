import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material'
import { useState } from 'react'

export interface UserDialogProps<
  DialogResult = {
    nickname: string
  }
> {
  open: boolean
  state: Partial<DialogResult>
  onClosed?: () => void
  onFinished?: (newState: DialogResult) => void
}

export default function UserDialog(props: UserDialogProps) {
  const { open, state, onClosed, onFinished } = props
  const [value, setValue] = useState<string>('')

  const onCloseHandler = () => onClosed?.()

  return (
    <Dialog onClose={onCloseHandler} open={open} sx={{}}>
      <DialogTitle>用户昵称</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          variant="standard"
          type="text" // 329
          onChange={(ev) => setValue(ev.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCloseHandler}>取消</Button>
        <Button onClick={() => onFinished?.({ ...state, nickname: value })}>
          确定
        </Button>
      </DialogActions>
    </Dialog>
  )
}
