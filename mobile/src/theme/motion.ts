import { Easing } from 'react-native'

/**
 * Motion constants, following Emil Kowalski's rules for interface animation.
 *
 * The built-in easings are too weak to read as intentional, so both curves are
 * custom. Enter and exit always use ease-out: ease-in delays the first frame,
 * which is the exact moment the user is watching, and makes an interface feel
 * sluggish at an identical duration.
 */
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1)
export const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1)

/** Nothing in the interface runs longer than 300ms. Exits beat enters. */
export const DUR = {
  press: 160,
  release: 140,
  chip: 180,
  enter: 240,
  exit: 140,
  screen: 280,
} as const

/** Step between staggered entrances. Longer delays just read as slowness. */
export const STAGGER = 50

/** Pressed scale — subtle enough to register as feedback, not as a bounce. */
export const PRESS_SCALE = 0.97
