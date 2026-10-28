import { useEffect, useRef, type RefObject, type ComponentRef } from 'react'
import { AccessibilityInfo, findNodeHandle, View } from 'react-native'

function focus(target: ComponentRef<typeof View> | null) {
  if (!target || target.isConnected === false) return
  const handle = findNodeHandle(target)
  if (handle != null) AccessibilityInfo.setAccessibilityFocus(handle)
}

// Use Modal.onShow for entry, then return focus after the native dismissal.
export function useModalFocus(open: boolean, trigger?: RefObject<ComponentRef<typeof View> | null>, restoreOnUnmount = false) {
  const heading = useRef<ComponentRef<typeof View>>(null)
  const wasOpen = useRef(false)
  useEffect(() => () => {
    if (restoreOnUnmount) requestAnimationFrame(() => focus(trigger?.current ?? null))
  }, [restoreOnUnmount, trigger])
  useEffect(() => {
    if (wasOpen.current && !open) {
      const frame = requestAnimationFrame(() => focus(trigger?.current ?? null))
      wasOpen.current = open
      return () => cancelAnimationFrame(frame)
    }
    wasOpen.current = open
  }, [open, trigger])
  return { heading, onShow: () => focus(heading.current), onDismiss: () => focus(trigger?.current ?? null) }
}
