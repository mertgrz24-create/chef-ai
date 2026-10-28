import { t, useLocale } from '@/lib/release/locale';
import { ActivityIndicator, Text } from 'react-native';
import type { ReactNode } from 'react';
import { PressableScale } from './pressable-scale';
import { colors } from '@/theme/tokens';
export function Button({ label, onPress, loading, loadingLabel, disabled, variant = 'primary', icon, }: {
    label: string;
    onPress: () => void;
    loading?: boolean;
    loadingLabel?: string;
    disabled?: boolean;
    variant?: 'primary' | 'ghost' | 'danger' | 'accent';
    icon?: ReactNode;
}) {
    useLocale();
    useLocale();
    const filled = variant === 'primary';
    const foreground = filled
        ? colors.chalk
        : variant === 'danger'
            ? colors['error-ink']
            : colors.pantry;
    return (<PressableScale onPress={onPress} disabled={disabled || loading} accessibilityLabel={t(t(loading ? (loadingLabel ?? label) : label))} accessibilityState={{
            disabled: !!(disabled || loading),
            busy: !!loading,
        }} haptic="light" className={`min-h-13 flex-row items-center justify-center gap-2 rounded-2xl px-4 py-3 ${filled ? 'bg-pantry' : variant === 'accent' ? 'bg-zest' : variant === 'danger' ? 'border border-clay/40 bg-clay/5' : 'border border-line bg-panel'} ${disabled ? 'opacity-40' : ''}`}>
      {loading ? <ActivityIndicator color={foreground} size="small"/> : icon}
      <Text className={`shrink text-center font-sans-bold text-body-sm ${filled ? 'text-chalk' : variant === 'danger' ? 'text-error-ink' : 'text-pantry'}`}>
        {t(t(loading ? (loadingLabel ?? label) : label))}
      </Text>
    </PressableScale>);
}
