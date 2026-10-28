import { t, useLocale } from '@/lib/release/locale';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './pressable-scale';
import { colors } from '@/theme/tokens';
import { MotionView } from './motion-view';
import { DUR } from '@/theme/motion';
export function Chip({ label, active, onPress, strikeInactive, size = 'md', disabled, }: {
    label: string;
    active: boolean;
    onPress: () => void;
    strikeInactive?: boolean;
    size?: 'sm' | 'md';
    disabled?: boolean;
}) {
    useLocale();
    return (<PressableScale onPress={onPress} disabled={disabled} accessibilityRole="checkbox" accessibilityLabel={typeof label === 'string' ? t(label) : label} accessibilityState={{ checked: active, disabled: !!disabled }} haptic="selection" className={`min-h-11 max-w-full flex-row items-center gap-2 rounded-xl border py-2 ${size === 'sm' ? 'px-3' : 'px-3.5'} ${active ? 'border-pantry bg-pantry' : 'border-line bg-panel'} ${disabled ? 'opacity-50' : ''}`}>
      <MotionView transitionKey={active ? 1 : 0} duration={DUR.chip} distance={0} style={{flexDirection:'row',alignItems:'center',gap:8,flexShrink:1}}>
      {size === 'md' ? (<View className={`h-4 w-4 items-center justify-center rounded ${active ? 'bg-zest' : 'border border-ink-muted/50'}`}>
          {active ? (<Ionicons name="checkmark" size={12} color={colors.pantry}/>) : null}
        </View>) : null}
      <Text className={`shrink font-sans text-label ${active ? 'text-chalk' : strikeInactive ? 'text-muted line-through' : 'text-secondary'}`}>
        {typeof label === 'string' ? t(label) : label}
      </Text>
      </MotionView>
    </PressableScale>);
}
