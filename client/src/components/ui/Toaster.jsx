import React, { useEffect, useState } from 'react'
import * as Toast from '@radix-ui/react-toast'
import { useStore } from '../../store/useStore'
import { cn } from '../../lib/utils'

export function Toaster() {
  const toastMessage = useStore((s) => s.toastMessage)
  const clearToast = useStore((s) => s.clearToast)
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState({ title: '', variant: 'default' })

  useEffect(() => {
    if (toastMessage) {
      setContent({ title: toastMessage.title, variant: toastMessage.variant || 'default' })
      setOpen(true)
      clearToast()
    }
  }, [toastMessage, clearToast])

  return (
    <Toast.Provider swipeDirection="right">
      <Toast.Root
        open={open}
        onOpenChange={setOpen}
        className={cn(
          'rounded-lg border px-4 py-3 shadow-lg',
          content.variant === 'destructive'
            ? 'border-danger/50 bg-danger/10 text-danger'
            : 'border-border bg-bg-elevated text-text-primary'
        )}
      >
        <Toast.Title className="text-sm font-medium">{content.title}</Toast.Title>
      </Toast.Root>
      <Toast.Viewport
        className="fixed bottom-0 right-0 z-[100] flex max-w-full flex-col gap-2 p-4 sm:max-w-[380px] outline-none"
      />
    </Toast.Provider>
  )
}
