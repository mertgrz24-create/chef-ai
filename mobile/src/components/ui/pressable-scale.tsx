import { useLocale } from '@/lib/release/locale';
import { useEffect, useState, type Ref, type ComponentRef } from 'react';
import { Animated, Platform, Pressable, View, type PressableProps, type StyleProp, type ViewStyle, } from 'react-native';
import * as Haptics from 'expo-haptics';
import { DUR, EASE_OUT, PRESS_SCALE } from '@/theme/motion';
import { useReducedMotion } from '@/theme/use-reduced-motion';
export type PressableScaleProps = Omit<PressableProps, 'style'> & {
    haptic?: 'none' | 'selection' | 'light';
    className?: string;
    wrapperStyle?: StyleProp<ViewStyle>;
    nativeRef?: Ref<ComponentRef<typeof View>>;
};
/** Keep animated styles on a wrapper so NativeWind owns the inner control. */
export function PressableScale({ haptic = 'none', onPressIn, onPressOut, wrapperStyle, nativeRef, disabled, accessibilityState, ...props }: PressableScaleProps) {
    useLocale();
    const [pressed] = useState(() => new Animated.Value(0));
    const reduceMotion = useReducedMotion();
    useEffect(() => {
        pressed.stopAnimation();
        pressed.setValue(0);
        return () => pressed.stopAnimation();
    }, [disabled, pressed, reduceMotion]);
    function animate(toValue: number, duration: number) {
        pressed.stopAnimation();
        if (reduceMotion) { pressed.setValue(toValue); return; }
        Animated.timing(pressed, {
            toValue,
            duration,
            easing: EASE_OUT,
            useNativeDriver: true,
        }).start();
    }
    return (<Animated.View style={[
            wrapperStyle,
            {
                // Keep both properties attached to one value throughout the animation.
                opacity: pressed.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, reduceMotion ? 0.75 : 1],
                }),
                transform: [
                    {
                        scale: pressed.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, reduceMotion ? 1 : PRESS_SCALE],
                        }),
                    },
                ],
            },
        ]}>
      <Pressable ref={nativeRef} accessibilityRole="button" {...props} style={{minHeight:Platform.OS==='android'?48:44,minWidth:Platform.OS==='android'?48:44}} disabled={disabled} accessibilityState={{ ...accessibilityState, disabled: !!disabled }} onPressIn={(event) => {
            if (disabled) return;
            animate(1, DUR.press);
            if (haptic === 'selection')
                void Haptics.selectionAsync().catch(() => { });
            else if (haptic === 'light')
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
            onPressIn?.(event);
        }} onPressOut={(event) => {
            animate(0, DUR.release);
            onPressOut?.(event);
        }}/>
    </Animated.View>);
}
