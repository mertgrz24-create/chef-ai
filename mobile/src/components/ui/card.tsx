import { t, useLocale } from '@/lib/release/locale';
import { Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { PressableScale } from './pressable-scale';
const CARD_BASE = 'rounded-2xl bg-panel p-4';
export function Card({ children, className, }: {
    children: ReactNode;
    className?: string;
}) {
    useLocale();
    return <View className={`${CARD_BASE} ${className ?? ''}`}>{children}</View>;
}
export function StatCard({ value, label, highlight, }: {
    value: string | number;
    label: string;
    highlight?: boolean;
}) {
    useLocale();
    return (<View className="flex-1 py-2">
      <Text className="font-display text-display-lg text-pantry">{value}</Text>
      <Text className={`mt-1 font-sans text-label ${highlight ? 'text-error-ink' : 'text-muted'}`}>
        {typeof label === 'string' ? t(label) : label}
      </Text>
    </View>);
}
export function ActionCard({ icon, title, subtitle, onPress, }: {
    icon: ReactNode;
    title: string;
    subtitle: string;
    onPress: () => void;
}) {
    useLocale();
    return (<PressableScale onPress={onPress} wrapperStyle={{ flex: 1 }} className={CARD_BASE}>
      <View className="mb-4 h-11 w-11 items-center justify-center rounded-xl bg-surface-2">
        {icon}
      </View>
      <Text className="font-sans-bold text-body text-pantry">{typeof title === 'string' ? t(title) : title}</Text>
      <Text className="mt-1 font-sans text-meta text-muted">{typeof subtitle === 'string' ? t(subtitle) : subtitle}</Text>
    </PressableScale>);
}
export function Row({ icon, title, subtitle, onPress, right, }: {
    icon?: ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    right?: ReactNode;
}) {
    useLocale();
    const content = (<View className="min-h-16 flex-row items-center gap-3 py-3">
      {icon ? (<View className="h-11 w-11 items-center justify-center rounded-xl bg-surface-2">
          {icon}
        </View>) : null}
      <View className="min-w-0 flex-1">
        <Text className="font-sans-bold text-body-sm text-pantry">{typeof title === 'string' ? t(title) : title}</Text>
        {subtitle ? (<Text className="mt-0.5 font-sans text-label text-muted">
            {typeof subtitle === 'string' ? t(subtitle) : subtitle}
          </Text>) : null}
      </View>
      {right}
    </View>);
    return onPress ? (<PressableScale onPress={onPress}>{content}</PressableScale>) : (content);
}
