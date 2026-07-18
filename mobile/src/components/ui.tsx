import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native'
import { useState } from 'react'

/**
 * Design-system primitives ("Mise en Place"), shared across screens so the
 * app reads as one system. Tokens come from tailwind.config.js.
 */

export function Button({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
}: {
  label: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'ghost'
}) {
  const isPrimary = variant === 'primary'
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`h-13 items-center justify-center rounded-full px-6 ${
        isPrimary ? 'bg-zest' : 'border border-chalk/25'
      } ${disabled || loading ? 'opacity-60' : ''}`}
      style={{ height: 52 }}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#17180F' : '#F5F6F1'} />
      ) : (
        <Text
          className={`font-mono-bold text-[13px] tracking-wide ${
            isPrimary ? 'text-ink' : 'text-chalk'
          }`}
        >
          {label}
        </Text>
      )}
    </Pressable>
  )
}

export function Field({
  label,
  ...props
}: { label: string } & TextInputProps) {
  const [focused, setFocused] = useState(false)
  return (
    <View className="gap-2">
      <Text className="font-mono text-[11px] tracking-[1.5px] text-[#8fa093]">
        {label.toUpperCase()}
      </Text>
      <TextInput
        {...props}
        onFocus={(e) => {
          setFocused(true)
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          props.onBlur?.(e)
        }}
        placeholderTextColor="#5f7267"
        className={`rounded-xl border bg-chalk/5 px-4 py-3.5 font-sans text-[15px] text-chalk ${
          focused ? 'border-zest' : 'border-chalk/15'
        }`}
      />
    </View>
  )
}

/** Full-bleed pantry-green screen — the app's default backdrop. */
export function Screen({ children }: { children: React.ReactNode }) {
  return <View className="flex-1 bg-pantry">{children}</View>
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  if (!children) return null
  return <Text className="font-sans text-[13px] text-clay">{children}</Text>
}
