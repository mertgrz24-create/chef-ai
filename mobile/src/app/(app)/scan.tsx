import { useRecoveredAi } from '@/components/release/ai-recovery'
import { visionSchema } from '@/lib/release/contracts'
import { QuotaStatus } from '@/components/release/quota-status'
import { useKitchenInvalidation } from '@/lib/release/kitchen-data'
import { aiErrorMessage } from '@/lib/release/ai-error'
import { t, useLocale } from '@/lib/release/locale'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, Linking, Platform, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { router, useFocusEffect } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { ApiError, apiFetch, apiUpload } from '@/lib/api'
import type { PantryItem } from '@/lib/types'
import { isoInDays } from '@/lib/expiry'
import {
  BusyState,
  Button,
  Chip,
  EmptyState,
  Notice,
  MotionView,
  ScreenHeader,
  ScreenScroll,
  SectionLabel,
} from '@/components/ui'
import { colors } from '@/theme/tokens'
import { useRelease } from '@/lib/release/state'
import { AiGate } from '@/components/release/gates'
import {
  preparePhoto,
  removeTemporaryPhoto,
  removePickedTemporaryPhoto,
} from '@/lib/release/photos'
type Phase = 'idle' | 'preview' | 'analyzing' | 'results'
export default function Scan() {
  useLocale()
  const invalidate=useKitchenInvalidation()
  const { aiAllowed, offline, track, refreshMembership } = useRelease()
  const mounted = useRef(true)
  const focused = useRef(true)
  useFocusEffect(useCallback(() => {
    focused.current = true
    return () => { focused.current = false }
  }, []))
  const pickerVersion = useRef(0)
  const upload = useRef<AbortController | null>(null)
  const assetUri = useRef<string | null>(null)
  const waitingForSettings = useRef(false)
  const [cameraBlocked, setCameraBlocked] = useState(false)
  const [previewReady, setPreviewReady] = useState(false)
  const temporary = useRef<string | null>(null)
  const pickedTemporary = useRef<string | null>(null)
  const [resultMotion, setResultMotion] = useState(0)
  const [resultId, setResultId] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null)
  const [detected, setDetected] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [limitReached, setLimitReached] = useState(false)
  const [saving, setSaving] = useState(false)
  const [picking, setPicking] = useState(false)
  const recovered=useRecoveredAi('scan')
  useFocusEffect(useCallback(()=>{
    if(!recovered?.result)return
    const parsed=visionSchema.safeParse(recovered.result.response)
    if(parsed.success){
      const names=[...new Set(parsed.data.ingredients.map(name=>name.trim()).filter(Boolean))]
      setResultMotion(value=>value+1);setDetected(names);setSelected(new Set(names));setResultId(parsed.data.resultId??'');setError(null);setPhase('results');recovered.consume()
    }
  },[recovered]))
  const busy = phase === 'analyzing' || saving || picking
  // Lock synchronous taps too; picker and upload must never start twice.
  const operation = useRef(false)
  const acceptPhoto = useCallback((next: ImagePicker.ImagePickerAsset) => {
    if (!mounted.current) {
      removePickedTemporaryPhoto(next.uri)
      return
    }
    if (pickedTemporary.current !== next.uri)
      removePickedTemporaryPhoto(pickedTemporary.current)
    pickedTemporary.current = next.uri
    assetUri.current = next.uri
    setPreviewReady(false)
    setAsset(next)
    setDetected([])
    setSelected(new Set())
    setResultId('')
    setError(null)
    setLimitReached(false)
    removeTemporaryPhoto(temporary.current)
    temporary.current = null
    setPhase('preview')
  }, [])
  useEffect(() => {
    mounted.current = true
    // Android can recreate the activity while the native picker is open.
    const version = pickerVersion.current
    if (Platform.OS === 'android') {
      void ImagePicker.getPendingResultAsync().then((result) => {
        if (!mounted.current || version !== pickerVersion.current || operation.current || !result) return
        if ('code' in result) setError('Couldn’t open that photo. Try again or choose another image.')
        else if (!result.canceled && result.assets[0]) acceptPhoto(result.assets[0])
      }).catch(() => {
        if (mounted.current && version === pickerVersion.current)
          setError('Couldn’t recover your photo. Please choose it again.')
      })
    }
    const listener = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !waitingForSettings.current) return
      waitingForSettings.current = false
      void ImagePicker.getCameraPermissionsAsync().then((permission) => {
        if (!mounted.current || !focused.current) return
        setCameraBlocked(!permission.granted && !permission.canAskAgain)
        setError(permission.granted ? null : 'Camera access is off. Allow it in Settings, or choose a photo from your library.')
      }).catch(() => {
        if (mounted.current) setError('Couldn’t check camera permission. Try again or choose a photo.')
      })
    })
    return () => {
      mounted.current = false
      upload.current?.abort()
      listener.remove()
      removeTemporaryPhoto(temporary.current)
      removePickedTemporaryPhoto(pickedTemporary.current)
    }
  }, [acceptPhoto])
  async function openCameraSettings() {
    waitingForSettings.current = true
    try { await Linking.openSettings() }
    catch {
      waitingForSettings.current = false
      if (mounted.current) setError('Open your device settings to allow camera access.')
    }
  }
  async function pick(source: 'camera' | 'library') {
    if (operation.current || !mounted.current || !focused.current) return
    operation.current = true
    ++pickerVersion.current
    setPicking(true)
    setError(null)
    try {
      if (source === 'camera') {
        let permission = await ImagePicker.getCameraPermissionsAsync()
        if (!mounted.current || !focused.current) return
        if (!permission.granted && permission.canAskAgain) {
          permission = await ImagePicker.requestCameraPermissionsAsync()
        }
        if (!mounted.current) return
        setCameraBlocked(!permission.granted && !permission.canAskAgain)
        if (!permission.granted) {
          setError('Camera access is off. Allow it in Settings, or choose a photo from your library.')
          return
        }
      }
      // The system photo picker for still images needs no full-library permission.
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        quality: 0.8,
        exif: false,
        base64: false,
      }
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options)
      if (result.canceled || !result.assets[0]) return
      acceptPhoto(result.assets[0])
    } catch {
      if (mounted.current) setError(source === 'camera'
        ? 'Couldn’t open the camera. Try again or choose a photo from your library.'
        : 'Couldn’t open that photo. Try again or choose another image.')
    } finally {
      operation.current = false
      if (mounted.current) setPicking(false)
    }
  }
  async function analyze(photo: ImagePicker.ImagePickerAsset) {
    if (!aiAllowed || offline || !mounted.current) return
    setPhase('analyzing')
    setError(null)
    setLimitReached(false)
    try {
      const normalized = await preparePhoto(photo)
      if (!mounted.current) {
        removeTemporaryPhoto(normalized.uri)
        return
      }
      temporary.current = normalized.uri
      const controller = new AbortController()
      upload.current = controller
      photo = normalized
      const form = new FormData()
      form.append('image', {
        uri: photo.uri,
        name: photo.fileName ?? 'fridge.jpg',
        type: photo.mimeType ?? 'image/jpeg',
      } as unknown as Blob)
      const { ingredients, resultId } = await apiUpload<{
        ingredients: string[]
        resultId?: string
      }>('/api/vision', form, controller.signal)
      if (!mounted.current) return
      const names = [
        ...new Set(ingredients.map((name) => name.trim()).filter(Boolean)),
      ]
      setResultMotion(value=>value+1)
      setDetected(names)
      setSelected(new Set(names))
      setResultId(resultId ?? '')
      void track('scan_completed')
      setPhase('results')
    } catch (e) {
      if (!mounted.current) return
      if (
        e instanceof ApiError &&
        e.status === 403 &&
        e.code === 'limit_reached'
      ) {
        setLimitReached(true)
        setError(
          'You’ve reached the photo analysis limit for your plan. You can still add ingredients manually in Pantry.',
        )
      } else
        setError(
          aiErrorMessage(
            e,
            e instanceof ApiError && e.status === 429
            ? 'Photo analysis is busy. Wait a moment, then try again.'
              : 'Couldn’t analyze this photo. Retry it or choose a clearer image.',
          ),
        )
      setPhase('preview')
    } finally {
      void refreshMembership?.()
      removeTemporaryPhoto(temporary.current)
      temporary.current = null
      upload.current = null
    }
  }
  async function retry() {
    if (!asset || !previewReady || limitReached || operation.current || !aiAllowed || offline) return
    operation.current = true
    try {
      await analyze(asset)
    } finally {
      operation.current = false
    }
  }
  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }
  async function addToPantry() {
    if (!selected.size || operation.current || offline) return
    operation.current = true
    setSaving(true)
    setError(null)
    const names = [...selected]
    try {
      const results = await Promise.allSettled(
        names.map((name) =>
          apiFetch<{
            item: PantryItem
          }>('/api/pantry', {
            method: 'POST',
            body: JSON.stringify({ name, expiry_date: isoInDays(7) }),
          }),
        ),
      )
      if (!mounted.current) return
      const saved = new Set(
        names.filter((_, i) => results[i].status === 'fulfilled'),
      )
      if(saved.size) invalidate?.('pantry')
      if (saved.size === names.length) {
        reset()
        router.navigate('/pantry')
      } else {
        // Only failed entries remain selectable, so retrying cannot duplicate confirmed saves.
        setDetected((prev) => prev.filter((name) => !saved.has(name)))
        setSelected(new Set(names.filter((name) => !saved.has(name))))
        setError(
          t(
            '%{saved} added. %{failed} couldn’t be added. Retry only the remaining ingredients.',
            { saved: saved.size, failed: names.length - saved.size },
          ),
        )
      }
    } finally {
      if (mounted.current) setSaving(false)
      operation.current = false
    }
  }
  function reset() {
    removePickedTemporaryPhoto(pickedTemporary.current)
    pickedTemporary.current = null
    removeTemporaryPhoto(temporary.current)
    temporary.current = null
    setResultId('')
    setPhase('idle')
    assetUri.current = null
    setPreviewReady(false)
    setAsset(null)
    setDetected([])
    setSelected(new Set())
    setError(null)
    setLimitReached(false)
  }
  return (
    <ScreenScroll>
      <ScreenHeader
        eyebrow={t('PANTRY ASSISTANT')}
        title={t('Scan ingredients')}
        description={t(
          'Photograph your ingredients, then choose what to add to your pantry.',
        )}
      />
      <QuotaStatus kind="scans" />
      <AiGate />
      <View className="mt-5 overflow-hidden rounded-3xl bg-pantry">
        {asset ? (
          <MotionView animate={previewReady} transitionKey={asset.uri}>
          <Image
            key={asset.uri}
            source={{ uri: asset.uri }}
            onLoad={() => {
              if (mounted.current && assetUri.current === asset.uri) setPreviewReady(true)
            }}
            onError={() => {
              if (mounted.current && assetUri.current === asset.uri) {
                setPreviewReady(false)
                setError('This photo couldn’t be displayed. Choose another image.')
              }
            }}
            style={{ width: '100%', aspectRatio: 4 / 3 }}
            contentFit="contain"
            accessibilityLabel={t('Selected ingredient photo')}
          /></MotionView>
        ) : (
          <View className="aspect-[4/3] items-center justify-center px-5">
            <Ionicons name="scan-outline" size={48} color={colors.zest} />
            <Text className="mt-4 text-center font-display text-display-sm text-chalk">
              {t('What have you got?')}
            </Text>
            <Text className="mt-2 text-center font-sans text-body-sm text-chalk-2">
              {t('One clear photo is all you need.')}
            </Text>
          </View>
        )}
      </View>
      {phase === 'preview' ? (
        <View className="mt-5 gap-3">
          {limitReached ? <Button label={t('Add ingredients manually')} onPress={() => router.navigate('/pantry')} /> : null}
          <Button
            label={t('Analyze photo')}
            onPress={retry}
            disabled={!aiAllowed || !previewReady || busy || offline || limitReached}
          />
          <Button
            label={t('Choose from library')}
            variant="ghost"
            onPress={() => pick('library')}
            disabled={busy}
          />
          <Button
            label={t('Remove photo')}
            variant="ghost"
            onPress={reset}
            disabled={busy}
          />
        </View>
      ) : null}
      {phase === 'analyzing' ? (
        <BusyState
          label={t('Reading your ingredients\u2026')}
          description={t(
            'Keep this screen open. You\u2019ll be able to review everything before adding it.',
          )}
        />
      ) : null}
      {error ? (
        <Notice
          title={
            limitReached
              ? 'Photo analysis limit reached'
              : 'Let’s try that again'
          }
          description={error}
          action={
            phase === 'preview' && asset && previewReady && !limitReached && !busy && !offline
              ? { label: 'Retry this photo', onPress: retry }
              : undefined
          }
        />
      ) : null}
      {phase === 'results' && detected.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title={t('No ingredients found')}
          description={t(
            'Try better light and spread ingredients out so their shapes are visible.',
          )}
          action={{ label: 'Choose another photo', onPress: reset }}
        />
      ) : null}
      {phase === 'results' && detected.length > 0 ? (
        <>
          <SectionLabel>{t('Review ingredients')}</SectionLabel>
          <Text className="mb-3 font-sans text-body-sm text-secondary">
            {t('Tap to select or remove an ingredient.')}
            {' '}{t('%{count} selected.', { count: selected.size })}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {detected.map((name,index) => (
              <MotionView key={name} transitionKey={resultMotion} delay={Math.min(index*20,100)}>
              <Chip
                label={name}
                active={selected.has(name)}
                onPress={() => toggle(name)}
                strikeInactive
                disabled={saving}
              /></MotionView>
            ))}
          </View>
          <Text className="mt-4 font-sans text-label text-muted">
            {t(
              'Added with a use-within date of 1 week. Check the dates on your food.',
            )}
          </Text>
          <View className="mt-5 gap-3">
            <Button
              label={t('Add %{count} to pantry', { count: selected.size })}
              loadingLabel={t('Adding ingredients\u2026')}
              onPress={addToPantry}
              loading={saving}
              disabled={!selected.size || offline}
            />
            {!selected.size ? (
              <Text className="text-center font-sans text-label text-secondary">
                {t('Select at least one ingredient to continue.')}
              </Text>
            ) : null}
            <Button
              label={t('Choose another photo')}
              variant="ghost"
              onPress={reset}
              disabled={saving}
            />
          </View>
        </>
      ) : null}
      {phase === 'results' ? (
        <View className="mt-4">
          <Button
            label={t('Report a problem')}
            variant="ghost"
            onPress={() =>
              router.navigate({
                pathname: '/report',
                params: { source: 'scan', resultId },
              })
            }
          />
        </View>
      ) : null}
      {phase === 'idle' ? (
        <View className="mt-5 gap-3">
          {limitReached ? (
            <Button
              label={t('Add ingredients manually')}
              onPress={() => router.navigate('/pantry')}
            />
          ) : (
            <>
              <Button
                label={t('Take a photo')}
                onPress={() => pick('camera')}
                disabled={busy}
                icon={
                  <Ionicons
                    name="camera-outline"
                    size={20}
                    color={colors.chalk}
                  />
                }
              />
              <Button
                label={t('Choose from library')}
                variant="ghost"
                onPress={() => pick('library')}
                disabled={busy}
              />
            </>
          )}
          {cameraBlocked ? (
            <Button label={t('Open settings')} variant="ghost" onPress={openCameraSettings} disabled={busy} />
          ) : null}
          <SectionLabel>{t('A better scan')}</SectionLabel>
          <Text className="font-sans text-body-sm text-secondary">
            {t(
              'Use good light and spread ingredients out. Keep labels visible and avoid blurry close-ups.',
            )}
          </Text>
        </View>
      ) : null}
    </ScreenScroll>
  )
}
