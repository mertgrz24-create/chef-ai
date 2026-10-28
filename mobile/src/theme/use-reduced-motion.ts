import { useEffect, useState } from 'react'
import { AccessibilityInfo } from 'react-native'

// Newly inserted rows can use the preference already read by the screen.
let lastKnown: boolean | undefined

/** Follow the system preference, including changes made while the app is open. */
export function useReducedMotion() {
  // Prefer a quiet first frame until the device preference has been read.
  const [reduced, setReduced] = useState(() => lastKnown ?? true)
  useEffect(() => {
    let active = true
    let changed = false
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active && !changed) { lastKnown = value; setReduced(value) }
      })
      .catch(() => {})
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      value => { if (active) { changed = true; lastKnown = value; setReduced(value) } },
    )
    return () => {
      active = false
      subscription.remove()
    }
  }, [])
  return reduced
}
