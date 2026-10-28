import React, { useState } from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import { AccessibilityInfo, Animated, Text, TextInput } from 'react-native'
import { MotionView } from '@/components/ui/motion-view'
import { useReducedMotion } from '@/theme/use-reduced-motion'
import { PressableScale } from '@/components/ui/pressable-scale'

jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn(async () => {}), impactAsync: jest.fn(async () => {}), ImpactFeedbackStyle: { Light: 'light' } }))
let listeners: ((value: boolean) => void)[]
let stop: jest.Mock
let starts: jest.Mock
beforeEach(() => {
  listeners = []
  stop = jest.fn()
  starts = jest.fn()
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false)
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((_event, listener) => {
    listeners.push(listener as (value: boolean) => void)
    return { remove: jest.fn() }
  })
  jest.spyOn(Animated, 'timing').mockImplementation(() => ({ start: starts, stop, reset: jest.fn() }))
})
afterEach(() => jest.restoreAllMocks())

it('keeps input state and actions usable through transitions and system preference changes', async () => {
  function Form({ version }: { version: number }) {
    const [value, setValue] = useState('')
    return <MotionView transitionKey={version}><TextInput accessibilityLabel="Entry" value={value} onChangeText={setValue}/></MotionView>
  }
  const ui = await render(<Form version={0}/>)
  await fireEvent.changeText(ui.getByLabelText('Entry'), 'keep this draft')
  await ui.rerender(<Form version={1}/>)
  expect(starts).toHaveBeenCalled()
  expect(ui.getByLabelText('Entry').props.value).toBe('keep this draft')
  await act(async () => listeners.forEach(listener => listener(true)))
  expect(stop).toHaveBeenCalled()
  const count = starts.mock.calls.length
  await ui.rerender(<Form version={2}/>)
  expect(starts).toHaveBeenCalledTimes(count)
  expect(ui.getByLabelText('Entry').props.value).toBe('keep this draft')
  await ui.unmount()
})
it('does not replay entry just because the system preference becomes available', async () => {
  const ui = await render(<MotionView><Text>Content</Text></MotionView>)
  await waitFor(() => expect(AccessibilityInfo.isReduceMotionEnabled).toHaveBeenCalled())
  const count = starts.mock.calls.length
  await act(async () => listeners.forEach(listener => listener(false)))
  expect(starts).toHaveBeenCalledTimes(count)
  await ui.unmount()
})
it('does not run exit completion after unmount; reduced motion completes it without waiting', async () => {
  const exited = jest.fn()
  const ui = await render(<MotionView visible onExited={exited}><Text>Row</Text></MotionView>)
  await ui.rerender(<MotionView visible={false} onExited={exited}><Text>Row</Text></MotionView>)
  const callback = starts.mock.calls.at(-1)?.[0]
  expect(exited).not.toHaveBeenCalled()
  await ui.unmount()
  await act(async () => callback?.({ finished: true }))
  expect(exited).not.toHaveBeenCalled()
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true)
  const quiet = await render(<MotionView visible={false} onExited={exited}><Text>Row</Text></MotionView>)
  expect(exited).toHaveBeenCalledTimes(1)
  await quiet.unmount()
})
it('keeps button actions independent of animation completion and disables loading actions', async () => {
  const action = jest.fn()
  const ui = await render(<PressableScale onPress={action} accessibilityLabel="Action"><Text>Action</Text></PressableScale>)
  await fireEvent.press(ui.getByLabelText('Action'))
  expect(action).toHaveBeenCalledTimes(1)
  await ui.rerender(<PressableScale disabled onPress={action} accessibilityLabel="Action"><Text>Action</Text></PressableScale>)
  await fireEvent.press(ui.getByLabelText('Action'))
  expect(action).toHaveBeenCalledTimes(1)
  await ui.unmount()
})

it('honors a newer system event when the initial preference query resolves late', async () => {
  let finish!: (value: boolean) => void
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockImplementation(()=>new Promise(resolve=>{finish=resolve}))
  function Probe(){return <Text>{useReducedMotion()?'quiet':'motion'}</Text>}
  const ui=await render(<Probe />)
  await act(async()=>listeners.forEach(listener=>listener(true)))
  await act(async()=>finish(false))
  expect(ui.getByText('quiet')).toBeTruthy()
  await ui.unmount()
})
