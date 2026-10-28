import { t, useLocale } from '@/lib/release/locale';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Animated, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useReducedMotion } from '@/theme/use-reduced-motion';
import { colors } from '@/theme/tokens';
import { EASE_IN_OUT } from '@/theme/motion';
import { Button } from './button';
import { PressableScale } from './pressable-scale';
export function EmptyState({ icon, title, description, action, }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description?: ReactNode;
    action?: {
        label: string;
        onPress: () => void;
    };
}) {
    useLocale();
    return (<View className="my-8 items-center">
      <View className="h-16 w-16 items-center justify-center rounded-2xl bg-surface-2">
        <Ionicons name={icon} size={28} color={colors.pantry}/>
      </View>
      <Text accessibilityRole="header" className="mt-4 text-center font-display text-display-sm text-content">
        {typeof title === 'string' ? t(title) : title}
      </Text>
      {description ? (<Text className="mt-2 text-center font-sans text-body-sm text-secondary">
          {typeof description === 'string' ? t(description) : description}
        </Text>) : null}
      {action ? (<View className="mt-5 w-full">
          <Button {...action}/>
        </View>) : null}
    </View>);
}
export function Notice({ title, description, tone = 'error', action, onDismiss, }: {
    title: string;
    description?: string;
    tone?: 'error' | 'success' | 'info';
    onDismiss?: () => void;
    action?: {
        label: string;
        onPress: () => void;
    };
}) {
    useLocale();
    const error = tone === 'error';
    return (<View accessibilityLiveRegion="polite" accessibilityRole={error ? 'alert' : undefined} className={`mt-4 rounded-xl border p-4 ${error ? 'border-clay/50 bg-clay/10' : 'border-line bg-surface-2'}`}>
      <View className="flex-row items-start gap-2.5">
        <Ionicons name={error
            ? 'alert-circle-outline'
            : tone === 'success'
                ? 'checkmark-circle-outline'
                : 'information-circle-outline'} size={20} color={error ? colors['error-ink'] : colors.pantry}/>
        <View className="flex-1">
          <Text className={`font-sans-bold text-body-sm ${error ? 'text-error-ink' : 'text-content'}`}>
            {typeof title === 'string' ? t(title) : title}
          </Text>
          {description ? (<Text className="mt-1 font-sans text-label text-secondary">
              {typeof description === 'string' ? t(description) : description}
            </Text>) : null}
        </View>
        {onDismiss ? (<PressableScale onPress={onDismiss} accessibilityLabel={t("Dismiss message")} className="h-11 w-11 items-center justify-center">
            <Ionicons name="close" size={20} color={colors.secondary}/>
          </PressableScale>) : null}
      </View>
      {action ? (<View className="mt-3">
          <Button {...action} variant="ghost"/>
        </View>) : null}
    </View>);
}
export function BusyState({ label, description, }: {
    label: string;
    description?: string;
}) {
    useLocale();
    return (<View accessibilityRole="progressbar" accessibilityLabel={typeof label === 'string' ? t(label) : label} accessibilityState={{ busy: true }} className="my-6 flex-row items-start gap-3 rounded-xl bg-surface-2 p-4">
      <ActivityIndicator color={colors.pantry}/>
      <View className="flex-1">
        <Text className="font-sans-bold text-body-sm text-content">
          {typeof label === 'string' ? t(label) : label}
        </Text>
        {description ? (<Text className="mt-1 font-sans text-label text-secondary">
            {typeof description === 'string' ? t(description) : description}
          </Text>) : null}
      </View>
    </View>);
}
export function Skeleton({ className }: {
    className?: string;
}) {
    useLocale();
    const reduceMotion = useReducedMotion();
    const [opacity] = useState(() => new Animated.Value(0.6));
    useEffect(() => {
        if (reduceMotion) {
            opacity.setValue(0.6);
            return;
        }
        const animation = Animated.loop(Animated.sequence([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 700,
                easing: EASE_IN_OUT,
                useNativeDriver: true,
                isInteraction: false,
            }),
            Animated.timing(opacity, {
                toValue: 0.4,
                duration: 700,
                easing: EASE_IN_OUT,
                useNativeDriver: true,
                isInteraction: false,
            }),
        ]));
        animation.start();
        return () => animation.stop();
    }, [reduceMotion, opacity]);
    return (<Animated.View accessible={false} importantForAccessibility="no-hide-descendants" style={{ opacity }}>
      <View className={`rounded-lg bg-border ${className ?? ''}`}/>
    </Animated.View>);
}
export function LoadingRows() {
    useLocale();
    return (<View accessibilityRole="progressbar" accessibilityLabel={t("Loading content")} className="mt-5 gap-3">
      {[0, 1, 2].map((i) => (<Skeleton key={i} className="h-20 w-full"/>))}
    </View>);
}
