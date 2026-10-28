import { t, useLocale } from '@/lib/release/locale';
import { useState, type ComponentRef, type Ref } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors } from '@/theme/tokens';
export function Field({ label, error, hint, inputRef, ...props }: TextInputProps & {
    label: string;
    error?: string;
    hint?: string;
    inputRef?: Ref<ComponentRef<typeof TextInput>>;
}) {
    useLocale();
    const [focused, setFocused] = useState(false);
    return (<View className="gap-2">
      <Text className="font-sans-bold text-label text-secondary">{typeof label === 'string' ? t(label) : label}</Text>
      <TextInput {...props}
      placeholder={props.placeholder ? t(props.placeholder) : undefined} ref={inputRef} accessibilityLabel={props.accessibilityLabel ?? label} accessibilityHint={error ?? hint ?? props.accessibilityHint} onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
        }} onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
        }} placeholderTextColor={colors.muted} className={`min-h-13 rounded-xl border bg-panel px-4 py-3 font-sans text-body text-content ${error ? 'border-error-ink' : focused ? 'border-pantry' : 'border-ink-muted/50'}`}/>
      {error ? (<ErrorText>{typeof error === 'string' ? t(error) : error}</ErrorText>) : hint ? (<Text className="font-sans text-meta text-muted">{typeof hint === 'string' ? t(hint) : hint}</Text>) : null}
    </View>);
}
export function ErrorText({ children }: {
    children: React.ReactNode;
}) {
    useLocale();
    return children ? (<Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="font-sans text-label text-error-ink">
      {typeof children === 'string' ? t(children) : children}
    </Text>) : null;
}
