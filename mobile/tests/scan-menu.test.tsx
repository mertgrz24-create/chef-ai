import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import React from 'react'
import { AppState, Linking, Platform, type AppStateStatus } from 'react-native'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
const mockApi = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockUpload = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockGetPermission = jest.fn<() => Promise<unknown>>()
const mockRequestPermission = jest.fn<() => Promise<unknown>>()
const mockCamera = jest.fn<() => Promise<unknown>>()
const mockLibrary = jest.fn<() => Promise<unknown>>()
const mockPending = jest.fn<() => Promise<unknown>>()
const mockPrepare = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockRemove = jest.fn(), mockRemovePicked = jest.fn()
const mockTrack = jest.fn<() => Promise<void>>().mockResolvedValue()
const mockState = { aiAllowed: true, offline: false, track: mockTrack }
const mockInvalidate=jest.fn()
jest.mock('@/lib/release/kitchen-data',()=>({useKitchenInvalidation:()=>mockInvalidate}))
let mockLanguage = 'en'
let mockBlur: (() => void) | void
const mockFocusCleanups=new Set<()=>void>()
jest.mock('@/lib/release/state', () => ({ useRelease: () => mockState }))
jest.mock('@/lib/release/locale', () => ({
  useLocale: () => {}, getLocale: () => mockLanguage,
  t: (key: string, vars: Record<string, unknown> = {}) => {
    const messages = require('@/lib/release/messages').messages
    const label = mockLanguage === 'tr' ? messages[key] ?? key : key
    return label.replace(/%\{(\w+)\}/g, (_: string, name: string) => String(vars[name]))
  },
}))
jest.mock('@/lib/api', () => ({
  ...jest.requireActual<typeof import('@/lib/release/request')>('@/lib/release/request'),
  apiFetch: (...args: unknown[]) => mockApi(...args),
  apiUpload: (...args: unknown[]) => mockUpload(...args),
}))
jest.mock('expo-router', () => ({
  router: { navigate: jest.fn() },
  useFocusEffect: (callback: () => (() => void) | void) => require('react').useEffect(() => {
    const cleanup = callback(); if(cleanup)mockFocusCleanups.add(cleanup)
    mockBlur=()=>{for(const close of mockFocusCleanups)close()}
    return ()=>{if(cleanup){mockFocusCleanups.delete(cleanup);cleanup()}}
  }, [callback]),
}))
jest.mock('@/components/release/gates', () => ({ AiGate: () => null }))
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }))
jest.mock('expo-image', () => ({ Image: (props: object) => {
  const { View } = require('react-native'); return <View {...props} />
} }))
jest.mock('expo-image-picker', () => ({
  getCameraPermissionsAsync: () => mockGetPermission(),
  requestCameraPermissionsAsync: () => mockRequestPermission(),
  launchCameraAsync: () => mockCamera(),
  launchImageLibraryAsync: () => mockLibrary(),
  getPendingResultAsync: () => mockPending(),
}))
jest.mock('@/lib/release/photos', () => ({
  preparePhoto: (...args: unknown[]) => mockPrepare(...args),
  removeTemporaryPhoto: (uri: string) => mockRemove(uri),
  removePickedTemporaryPhoto: (uri: string) => mockRemovePicked(uri),
}))
jest.mock('@/components/ui', () => {
  const { View, Text, Pressable } = require('react-native')
  const { t } = require('@/lib/release/locale')
  const Container = ({ children }: { children: React.ReactNode }) => <View>{children}</View>
  const Button = ({ label, onPress, disabled, loading }: { label: string; onPress: () => void; disabled?: boolean; loading?: boolean }) => (
    <Pressable accessibilityRole="button" accessibilityLabel={t(label)} disabled={disabled || loading} accessibilityState={{ disabled: !!disabled || !!loading }} onPress={() => { onPress() }}><Text>{t(label)}</Text></Pressable>
  )
  return {
    MotionView: jest.requireActual<typeof import('@/components/ui/motion-view')>('@/components/ui/motion-view').MotionView,
    ScreenScroll: Container, SectionLabel: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>,
    ScreenHeader: ({ title }: { title: string }) => <Text>{title}</Text>,
    PressableScale: ({ onPress, ...props }: { onPress?: () => void }) => <Pressable {...props} onPress={() => { onPress?.() }} />,
    Button, Chip: ({ label }: { label: string }) => <Text>{label}</Text>,
    LoadingRows: () => <Text>initial-loading</Text>,
    BusyState: ({ label }: { label: string }) => <Text>{label}</Text>,
    Notice: ({ title, description, action }: { title: string; description?: string; action?: { label: string; onPress: () => void } }) => <View><Text>{t(title)}</Text>{description && <Text>{t(description)}</Text>}{action && <Button {...action} />}</View>,
    EmptyState: ({ title }: { title: string }) => <Text>{title}</Text>,
    RecipeTicket: ({ recipe }: { recipe: { name: string } }) => <Text>ticket: {recipe.name}</Text>,
  }
})
import Scan from '@/app/(app)/scan'
import Menu from '@/app/(app)/meal-plan'
import { ApiError } from '@/lib/api'
const asset = { uri: 'file:///app-cache/picked.jpg', width: 1600, height: 1200 }
const picked = { canceled: false, assets: [asset] }
const plan = { id: 'fixture-plan', user_id: 'fixture', week_start_date: '2026-10-12', created_at: '', updated_at: '', meals: [{ day: 'monday', breakfast: { name: 'Oats', ingredients: ['oats'], instructions: 'Cook' }, dinner: { name: 'Soup', ingredients: ['tomato'], instructions: 'Simmer' } }] }
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r }); return { promise, resolve } }
beforeEach(() => {
  jest.restoreAllMocks()
  for (const fn of [mockApi, mockUpload, mockGetPermission, mockRequestPermission, mockCamera, mockLibrary, mockPending, mockPrepare, mockRemove, mockRemovePicked, mockTrack]) fn.mockReset()
  mockTrack.mockResolvedValue()
  mockState.aiAllowed = true; mockState.offline = false; mockLanguage = 'en'
  mockApi.mockReset(); mockUpload.mockReset(); mockCamera.mockReset()
  mockGetPermission.mockResolvedValue({ granted: true, canAskAgain: true })
  mockRequestPermission.mockResolvedValue({ granted: true, canAskAgain: true })
  mockPending.mockResolvedValue(null); mockLibrary.mockResolvedValue(picked); mockCamera.mockResolvedValue(picked)
  mockPrepare.mockResolvedValue({ ...asset, uri: 'file:///app-cache/normalized.jpg', mimeType: 'image/jpeg' })
  mockUpload.mockResolvedValue({ ingredients: ['tomato'], resultId: 'result' })
})
async function preview(screen: Awaited<ReturnType<typeof render>>) {
  await fireEvent.press(screen.getByText('Choose from library'))
  await waitFor(() => expect(screen.getByLabelText('Selected ingredient photo')).toBeTruthy())
}
describe('camera and preview', () => {
  it('does not ask again after permanent denial; library still works', async () => {
    mockGetPermission.mockResolvedValue({ granted: false, canAskAgain: false })
    const s = await render(<Scan />); await fireEvent.press(s.getByText('Take a photo'))
    await waitFor(() => expect(s.getByText('Open settings')).toBeTruthy())
    expect(mockRequestPermission).not.toHaveBeenCalled(); expect(mockCamera).not.toHaveBeenCalled()
    await preview(s); expect(mockUpload).not.toHaveBeenCalled()
  })
  it('requests an askable camera permission only on tap', async () => {
    mockGetPermission.mockResolvedValue({ granted: false, canAskAgain: true })
    const s = await render(<Scan />); expect(mockRequestPermission).not.toHaveBeenCalled()
    await fireEvent.press(s.getByText('Take a photo')); await waitFor(() => expect(mockCamera).toHaveBeenCalledTimes(1))
    expect(mockRequestPermission).toHaveBeenCalledTimes(1); expect(mockUpload).not.toHaveBeenCalled()
  })
  it('requires a rendered preview and explicit confirmation before analysis', async () => {
    const pending = deferred<unknown>(); mockUpload.mockReturnValueOnce(pending.promise)
    const s = await render(<Scan />); await preview(s)
    await fireEvent.press(s.getByText('Analyze photo')); expect(mockUpload).not.toHaveBeenCalled()
    await fireEvent(s.getByLabelText('Selected ingredient photo'), 'load')
    const analyze = s.getByText('Analyze photo')
    await act(async () => { await fireEvent.press(analyze); await fireEvent.press(analyze) })
    await waitFor(() => expect(mockUpload).toHaveBeenCalledTimes(1))
    expect(mockUpload.mock.calls[0][2]).toBeInstanceOf(AbortSignal)
    await act(async () => pending.resolve({ ingredients: ['tomato'], resultId: 'result' }))
    await waitFor(() => expect(s.getByText('tomato')).toBeTruthy())
    expect(mockRemove).toHaveBeenCalledWith('file:///app-cache/normalized.jpg')
  })
  it('keeps analysis disabled when the preview cannot load', async () => {
    const s = await render(<Scan />); await preview(s)
    await fireEvent(s.getByLabelText('Selected ingredient photo'), 'error')
    expect(s.getByText('This photo couldn’t be displayed. Choose another image.')).toBeTruthy()
    await fireEvent.press(s.getByText('Analyze photo')); expect(mockPrepare).not.toHaveBeenCalled()
  })
  it('preserves the previous preview after picker cancellation', async () => {
    const s = await render(<Scan />); await preview(s); mockLibrary.mockResolvedValueOnce({ canceled: true, assets: null })
    await fireEvent.press(s.getByText('Choose from library')); await waitFor(() => expect(mockLibrary).toHaveBeenCalledTimes(2))
    expect(s.getByLabelText('Selected ingredient photo')).toBeTruthy()
  })
  it('recovers an Android picker result without analyzing it', async () => {
    jest.replaceProperty(Platform, 'OS', 'android'); mockPending.mockResolvedValueOnce(picked)
    const s = await render(<Scan />); await waitFor(() => expect(s.getByLabelText('Selected ingredient photo')).toBeTruthy())
    expect(mockUpload).not.toHaveBeenCalled()
  })
  it('rechecks Settings return without automatically opening the camera', async () => {
    let listener!: (value: AppStateStatus) => void
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, fn) => { listener = fn; return { remove: jest.fn() } })
    jest.spyOn(Linking, 'openSettings').mockResolvedValue()
    mockGetPermission.mockResolvedValueOnce({ granted: false, canAskAgain: false })
    const s = await render(<Scan />); await fireEvent.press(s.getByText('Take a photo'))
    await waitFor(() => expect(s.getByText('Open settings')).toBeTruthy())
    await fireEvent.press(s.getByText('Open settings')); await act(async () => { listener('active') })
    await waitFor(() => expect(s.queryByText('Open settings')).toBeNull()); expect(mockCamera).not.toHaveBeenCalled()
  })
  it('offers manual entry on quota rejection without repeatedly analyzing', async () => {
    mockUpload.mockRejectedValueOnce(new ApiError('quota', 403, 'limit_reached'))
    const s = await render(<Scan />); await preview(s)
    await fireEvent(s.getByLabelText('Selected ingredient photo'), 'load')
    await act(async () => { await fireEvent.press(s.getByText('Analyze photo')) })
    expect(s.getByText('Add ingredients manually')).toBeTruthy()
    await fireEvent.press(s.getByText('Analyze photo')); expect(mockUpload).toHaveBeenCalledTimes(1)
  })
  it('aborts an in-flight upload on unmount and cleans its temporary file', async () => {
    const pending = deferred<unknown>(); mockUpload.mockReturnValueOnce(pending.promise)
    const s = await render(<Scan />); await preview(s)
    await fireEvent(s.getByLabelText('Selected ingredient photo'), 'load')
    await act(async () => { await fireEvent.press(s.getByText('Analyze photo')) })
    const signal = mockUpload.mock.calls[0][2] as AbortSignal
    await s.unmount(); expect(signal.aborted).toBe(true)
    await act(async () => pending.resolve({ ingredients: ['tomato'] }))
    expect(mockTrack).not.toHaveBeenCalled()
    expect(mockRemove).toHaveBeenCalledWith('file:///app-cache/normalized.jpg')
  })
  it('does not open a camera permission sheet after leaving Scan', async () => {
    const pending = deferred<unknown>(); mockGetPermission.mockReturnValueOnce(pending.promise)
    const s = await render(<Scan />); await fireEvent.press(s.getByText('Take a photo'))
    await act(() => { if (mockBlur) mockBlur() })
    await act(async () => pending.resolve({ granted: false, canAskAgain: true }))
    expect(mockRequestPermission).not.toHaveBeenCalled(); expect(mockCamera).not.toHaveBeenCalled()
  })
  it('does not upload a normalization result after unmount', async () => {
    const pending = deferred<typeof asset>(); mockPrepare.mockReturnValueOnce(pending.promise)
    const s = await render(<Scan />); await preview(s); await fireEvent(s.getByLabelText('Selected ingredient photo'), 'load'); await fireEvent.press(s.getByText('Analyze photo')); await s.unmount()
    await act(async () => pending.resolve(asset)); expect(mockUpload).not.toHaveBeenCalled(); expect(mockRemove).toHaveBeenCalledWith(asset.uri)
  })
})
describe('weekly menu', () => {
  it('shows an offline explanation without an endless initial spinner or request', async () => {
    mockState.offline = true; mockLanguage = 'tr'; const s = await render(<Menu />)
    expect(s.getByText('Çevrimdışısın')).toBeTruthy(); expect(s.queryByText('initial-loading')).toBeNull(); expect(mockApi).not.toHaveBeenCalled()
  })
  it('loads the empty week only for a real404', async () => {
    mockApi.mockRejectedValueOnce(new ApiError('empty', 404)); const s = await render(<Menu />)
    await waitFor(() => expect(s.getByText('Your week starts here')).toBeTruthy())
  })
  it('shows a read error rather than an empty week and allows retry', async () => {
    mockApi.mockRejectedValueOnce(new ApiError('network', 0)).mockResolvedValueOnce({ plan }); const s = await render(<Menu />)
    await waitFor(() => expect(s.getByText('Your meal plan couldn’t load')).toBeTruthy())
    expect(s.queryByText('Your week starts here')).toBeNull(); await fireEvent.press(s.getByText('Try again'))
    await waitFor(() => expect(s.getByText('Oats')).toBeTruthy())
  })
  it('uses stable meal IDs for Turkish spinner/requests, locks taps and retains meals on failure', async () => {
    mockLanguage = 'tr'; const pending = deferred<unknown>(); mockApi.mockResolvedValueOnce({ plan }).mockReturnValueOnce(pending.promise)
    const s = await render(<Menu />); await waitFor(() => expect(s.getByText('Oats')).toBeTruthy())
    const swap = s.getByLabelText('kahvaltı öğününü yenile: Oats'); await fireEvent.press(swap); await fireEvent.press(swap)
    expect(mockApi).toHaveBeenCalledTimes(2); expect(s.getByLabelText('kahvaltı öğününü yenile: Oats').props.accessibilityState.busy).toBe(true)
    expect(mockApi.mock.calls[1][1]).toMatchObject({ method: 'PATCH', body: JSON.stringify({ day: 'monday', meal: 'breakfast' }) })
    await act(async () => pending.resolve({ plan: { ...plan, meals: [{ ...plan.meals[0], breakfast: { ...plan.meals[0].breakfast, name: 'Eggs' } }] } }))
    expect(s.getByText('Eggs')).toBeTruthy(); expect(mockInvalidate).toHaveBeenCalledWith('plan')
    mockApi.mockRejectedValueOnce(new ApiError('quota',403,'limit_reached')); await fireEvent.press(s.getByLabelText('kahvaltı öğününü yenile: Eggs'))
    await waitFor(() => expect(s.getByText('Plan güncellenemedi')).toBeTruthy()); expect(s.getByText('Eggs')).toBeTruthy()
  })
  it('keeps an open meal detail readable and disables generation offline', async () => {
    mockApi.mockResolvedValueOnce({ plan }); const s = await render(<Menu />); await waitFor(() => expect(s.getByText('Oats')).toBeTruthy())
    await fireEvent.press(s.getByLabelText('breakfast: Oats')); expect(s.getByText('ticket: Oats')).toBeTruthy()
    mockState.offline = true; await s.rerender(<Menu />); await fireEvent.press(s.getByText('Regenerate whole week')); expect(mockApi).toHaveBeenCalledTimes(1)
    expect(s.getByText('ticket: Oats')).toBeTruthy()
  })
  it('does not let an older refresh overwrite a newly generated plan', async () => {
    const old = deferred<unknown>()
    const updated = { ...plan, meals: [{ ...plan.meals[0], breakfast: { ...plan.meals[0].breakfast, name: 'New breakfast' } }] }
    mockApi.mockResolvedValueOnce({ plan }).mockReturnValueOnce(old.promise).mockResolvedValueOnce({ plan: updated })
    const s = await render(<Menu />); await waitFor(() => expect(s.getByText('Oats')).toBeTruthy())
    mockState.offline = true; await s.rerender(<Menu />)
    mockState.offline = false; await s.rerender(<Menu />)
    await waitFor(() => expect(mockApi).toHaveBeenCalledTimes(2))
    const readSignal = (mockApi.mock.calls[1][1] as { signal: AbortSignal }).signal
    await fireEvent.press(s.getByText('Regenerate whole week'))
    await waitFor(() => expect(s.getByText('New breakfast')).toBeTruthy())
    expect(readSignal.aborted).toBe(true)
    await act(async () => old.resolve({ plan }))
    expect(s.queryByText('Oats')).toBeNull(); expect(s.getByText('New breakfast')).toBeTruthy()
  })
  it('aborts a pending read when the screen unmounts', async () => {
    const pending = deferred<unknown>(); mockApi.mockReturnValueOnce(pending.promise)
    const s = await render(<Menu />)
    const signal = (mockApi.mock.calls[0][1] as { signal: AbortSignal }).signal
    await s.unmount(); expect(signal.aborted).toBe(true)
    await act(async () => pending.resolve({ plan }))
  })

})

it('invalidates Today suggestions after a whole-week replacement',async()=>{
  mockLanguage='en';mockState.offline=false;mockApi.mockReset();mockInvalidate.mockClear()
  mockApi.mockResolvedValueOnce({plan}).mockResolvedValueOnce({plan:{...plan,updated_at:'updated'}})
  const s=await render(<Menu/>)
  await waitFor(()=>expect(s.getByText('Oats')).toBeTruthy())
  await fireEvent.press(s.getByText('Regenerate whole week'))
  await waitFor(()=>expect(mockInvalidate).toHaveBeenCalledWith('plan'))
  expect(mockApi.mock.calls[1][0]).toBe('/api/meal-plan/generate')
})

it('D day/detail transitions preserve the selected meal and perform only the original read', async () => {
  const twoDays={...plan,meals:[...plan.meals,{day:'tuesday',breakfast:{...plan.meals[0].breakfast,name:'Tuesday oats'},dinner:{...plan.meals[0].dinner,name:'Tuesday soup'}}]}
  mockApi.mockResolvedValue({plan:twoDays})
  const ui=await render(<Menu />)
  await waitFor(()=>expect(ui.getByText('Oats')).toBeTruthy())
  await fireEvent.press(ui.getByLabelText('Show tuesday meals'))
  await fireEvent.press(ui.getByLabelText('Show monday meals'))
  await fireEvent.press(ui.getByLabelText('Show tuesday meals'))
  await fireEvent.press(ui.getByLabelText('dinner: Tuesday soup'))
  expect(ui.getByText('ticket: Tuesday soup')).toBeTruthy()
  await fireEvent.press(ui.getByLabelText('Close meal details'))
  expect(ui.getByText('Tuesday soup')).toBeTruthy()
  expect(mockApi).toHaveBeenCalledTimes(1)
  expect(mockApi).toHaveBeenCalledWith('/api/meal-plan',expect.anything())
  expect(mockUpload).not.toHaveBeenCalled()
  await ui.unmount()
})
