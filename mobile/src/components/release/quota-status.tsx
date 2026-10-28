import { useCallback } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { t, useLocale, getLocale } from '@/lib/release/locale';
import { useRelease } from '@/lib/release/state';
import { SectionLabel } from '@/components/ui';
type Kind = 'recipes' | 'scans' | 'plans';
export function QuotaStatus({ kind }: {
    kind?: Kind;
}) {
    useLocale();
    const { membership, refreshMembership, offline } = useRelease();
    useFocusEffect(useCallback(() => { if (!offline)
        void refreshMembership?.(); }, [offline, refreshMembership]));
    const kinds: Kind[] = kind ? [kind] : ['recipes', 'scans', 'plans'];
    return <View className="my-3 rounded-2xl border border-line bg-panel p-4" accessibilityLiveRegion="polite">
    <SectionLabel>{t('Monthly usage')}</SectionLabel>
    {!membership ? <Text className="font-sans text-label text-muted">{t('Usage could not be verified. No allowance is assumed.')}</Text> : kinds.map(key => {
            const quota = membership.quotas[key];
            return <View key={key} className="mb-2"><Text className="font-sans text-body-sm text-secondary">{t(key)}: {t('%{remaining} remaining of %{limit}', { remaining: Math.max(0, quota.limit - quota.used), limit: quota.limit })}</Text><Text className="font-sans text-meta text-muted">{t('Renews %{date} UTC', { date: new Date(quota.resetsAt).toLocaleString(getLocale(), { timeZone: 'UTC' }) })}</Text></View>;
        })}
    <Text className="font-sans text-meta text-muted">{t('Calendar-month allowance. Reserved operations may be included in usage. Viewing existing content uses no AI allowance.')}</Text>
  </View>;
}
