import { t, useLocale } from '@/lib/release/locale';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View, } from 'react-native';
import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './pressable-scale';
import { colors } from '@/theme/tokens';
export function Screen({ children }: {
    children: ReactNode;
}) {
    useLocale();
    return <View className="flex-1 bg-canvas">{typeof children === 'string' ? t(children) : children}</View>;
}
export function ScreenScroll({ children, contentClassName = 'pb-8', }: {
    children: ReactNode;
    contentClassName?: string;
}) {
    useLocale();
    return (<Screen>
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerClassName={`flex-grow px-5 pt-5 ${contentClassName}`} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
            {typeof children === 'string' ? t(children) : children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Screen>);
}
export function ScreenHeader({ eyebrow, title, description, onBack, action, }: {
    eyebrow?: string;
    title: ReactNode;
    description?: string;
    onBack?: () => void;
    action?: ReactNode;
}) {
    useLocale();
    return (<View>
      {onBack ? (<PressableScale onPress={onBack} accessibilityLabel={t("Back to Today")} className="mb-3 min-h-11 flex-row items-center gap-2 self-start pr-4">
          <Ionicons name="arrow-back" size={20} color={colors.pantry}/>
          <Text className="font-sans-bold text-body-sm text-pantry">{t("Today")}</Text>
        </PressableScale>) : null}
      {eyebrow ? (<Text className="mb-2 font-mono text-meta tracking-label text-muted">
          {typeof eyebrow === 'string' ? t(eyebrow) : eyebrow}
        </Text>) : null}
      <View className="flex-row items-center gap-3">
        <Text accessibilityRole="header" className="min-w-0 flex-1 font-display text-display-lg tracking-tight text-pantry">
          {typeof title === 'string' ? t(title) : title}
        </Text>
        {action}
      </View>
      {description ? (<Text className="mt-2 font-sans text-body-sm text-secondary">
          {typeof description === 'string' ? t(description) : description}
        </Text>) : null}
    </View>);
}
export function SectionLabel({ children, className = 'mb-3 mt-7', }: {
    children: ReactNode;
    className?: string;
}) {
    useLocale();
    return (<Text accessibilityRole="header" className={`font-display text-display-sm text-pantry ${className}`}>
      {typeof children === 'string' ? t(children) : children}
    </Text>);
}
