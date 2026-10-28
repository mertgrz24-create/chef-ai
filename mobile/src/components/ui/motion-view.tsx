import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Animated, type ViewProps } from 'react-native'
import { DUR, EASE_OUT } from '@/theme/motion'
import { useReducedMotion } from '@/theme/use-reduced-motion'

type MotionViewProps = ViewProps & {
  children: ReactNode
  transitionKey?: string | number
  animate?: boolean
  visible?: boolean
  delay?: number
  duration?: number
  distance?: number
  onExited?: () => void
  onEntered?: () => void
}

// Visual state only. Retarget without remounting children or controlling requests.
export function MotionView({ children, transitionKey = 0, animate = true,
  visible = true, delay = 0, duration = DUR.enter, distance = 8, onExited, onEntered, style, ...props }: MotionViewProps) {
  const reduced = useReducedMotion()
  const [progress] = useState(() => new Animated.Value(1))
  const previous = useRef<{ key: string | number; visible: boolean; animate: boolean } | null>(null)
  const exit = useRef(onExited)
  const enter = useRef(onEntered)
  const exited = useRef(false)
  useEffect(() => { exit.current = onExited }, [onExited])
  useEffect(() => { enter.current = onEntered }, [onEntered])
  useEffect(() => {
    const before = previous.current
    const changed = !before || before.key !== transitionKey || before.visible !== visible || before.animate !== animate
    previous.current = { key: transitionKey, visible, animate }
    progress.stopAnimation()
    let live = true
    if (visible) exited.current = false
    const finish = () => {
      if (live && visible && animate && changed) enter.current?.()
      if (live && !visible && !exited.current) {
        exited.current = true
        exit.current?.()
      }
    }
    if (reduced || !animate || !changed) {
      progress.setValue(visible ? 1 : 0)
      finish()
      return () => { live = false }
    }
    if (visible) progress.setValue(0)
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? duration : DUR.exit,
      delay: visible ? Math.max(0, Math.min(delay, 100)) : 0,
      easing: EASE_OUT, useNativeDriver: true, isInteraction: false,
    })
    animation.start(({ finished }) => { if (finished) finish() })
    return () => { live = false; animation.stop() }
  }, [animate, delay, duration, progress, reduced, transitionKey, visible])
  return <Animated.View {...props} pointerEvents={visible ? props.pointerEvents : 'none'}
    accessibilityElementsHidden={!visible || props.accessibilityElementsHidden}
    importantForAccessibility={visible ? props.importantForAccessibility : 'no-hide-descendants'}
    style={[style, { opacity: progress, transform: [{ translateY: reduced ? 0 : progress.interpolate({ inputRange: [0, 1], outputRange: [Math.max(0, Math.min(distance, 8)), 0] }) }] }]}>
    {children}
  </Animated.View>
}
