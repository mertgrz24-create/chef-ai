import { t, useLocale } from '@/lib/release/locale';
import { Text, View } from 'react-native';
import type { ReactNode } from 'react';
export function Ticket({ title, meta, children, }: {
    title: string;
    meta?: ReactNode;
    children: ReactNode;
}) {
    useLocale();
    return (<View className="overflow-hidden rounded-3xl bg-panel">
      <View className="flex-row items-center justify-between gap-3 border-b border-dashed border-line px-5 py-4">
        <View className="flex-row items-center gap-2">
          <View className="h-2 w-2 rounded-full bg-pantry"/>
          <Text className="font-mono text-meta tracking-label text-muted">
            {typeof title === 'string' ? t(title) : title}
          </Text>
        </View>
        {meta}
      </View>
      <View className="px-5 pb-6 pt-5">{children}</View>
    </View>);
}
