import { t, useLocale } from '@/lib/release/locale';
import { useRef, useState, type ComponentRef } from 'react';
import { Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Field, Notice, ScreenHeader, ScreenScroll, } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { LegalLinks } from '@/components/release/gates';
type FieldErrors = {
    email?: string;
    password?: string;
};
export function AuthForm({ mode }: {
    mode: 'login' | 'signup';
}) {
    useLocale();
    const signup = mode === 'signup';
    const { signIn, signUp, resend } = useAuth();
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fields, setFields] = useState<FieldErrors>({});
    const [error, setError] = useState<string | null>(null);
    const [confirmation, setConfirmation] = useState(false);
    const [loading, setLoading] = useState(false);
    const passwordInput = useRef<ComponentRef<typeof TextInput>>(null);
    const operation = useRef(false);
    async function submit() {
        if (operation.current)
            return;
        const next: FieldErrors = {};
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
            next.email = 'Enter a valid email address.';
        if (!password)
            next.password = 'Enter your password.';
        else if (signup && password.length < 6)
            next.password = 'Use at least 6 characters.';
        setFields(next);
        setError(null);
        if (Object.keys(next).length)
            return;
        operation.current = true;
        setLoading(true);
        try {
            if (signup) {
                const { needsConfirmation } = await signUp(email.trim(), password);
                setConfirmation(needsConfirmation);
            }
            else
                await signIn(email.trim(), password);
        }
        catch {
            setError(t('Couldn’t sign in or create your account. Check your details and try again.'));
        }
        finally {
            setLoading(false);
            operation.current = false;
        }
    }
    return (<ScreenScroll contentClassName="justify-center pb-10">
      <View className="py-6">
        <Text className="mb-8 font-display text-display-md text-pantry">{t("Chef")}<Text className="text-pantry">{t("AI")}</Text>
        </Text>
        <ScreenHeader eyebrow={signup ? 'YOUR KITCHEN STARTS HERE' : 'YOUR EVERYDAY KITCHEN'} title={signup ? <>{t("Cook what you")}{'\n'}{t("already have.")}</> : 'Welcome back.'} description={signup
            ? 'Create a free account. Start with what’s in your fridge.'
            : 'Sign in to your pantry and find your next dinner.'}/>
        {confirmation ? (<>
            <Notice tone="success" title={t("Check your inbox")} description={t('We sent a confirmation link. Confirm your account, then sign in. Check your spam folder too.')}/>
            <View className="mt-5 gap-3">
              <Button label={t('Resend confirmation')} loading={resending} onPress={async () => { if (resending)
            return; setResending(true); try {
            await resend(email.trim());
            setResent(true);
        }
        catch {
            setError(t('Email could not be sent. Check the address and wait 60 seconds before retrying.'));
        }
        finally {
            setResending(false);
        } }}/>
              {resent ? <Notice tone="success" title={t('Check your inbox')}/> : null}
              {error ? <Notice title={error}/> : null}
              <Button label={t("Go to sign in")} onPress={() => router.replace('/login')}/>
            </View>
          </>) : (<View className="mt-7 gap-4">
            <Field label={t("Email")} value={email} onChangeText={(text) => {
                setEmail(text);
                setFields((prev) => ({ ...prev, email: undefined }));
            }} error={fields.email} placeholder={t("you@example.com")} autoCapitalize="none" autoCorrect={false} autoComplete="email" keyboardType="email-address" returnKeyType="next" onSubmitEditing={() => passwordInput.current?.focus()} editable={!loading}/>
            <Field label={t("Your password")} inputRef={passwordInput} value={password} onChangeText={(text) => {
                setPassword(text);
                setFields((prev) => ({ ...prev, password: undefined }));
            }} error={fields.password} hint={signup ? 'At least 6 characters.' : undefined} placeholder={t("Your password")} secureTextEntry autoComplete={signup ? 'new-password' : 'current-password'} returnKeyType="go" onSubmitEditing={submit} editable={!loading}/>
            {error ? (<Notice title={signup
                    ? 'Account couldn’t be created'
                    : 'Sign in unsuccessful'} description={error}/>) : null}
            <View className="mt-2">
              <Button label={signup ? 'Create account' : 'Sign in'} loadingLabel={signup ? 'Creating account…' : 'Signing in…'} onPress={submit} loading={loading}/>
            </View>
          </View>)}
        {!signup && !confirmation ? <View className="mt-4"><Button label={t('Forgot password?')} variant="ghost" onPress={() => router.navigate('/forgot-password')} disabled={loading}/></View> : null}
        <LegalLinks />
        {!confirmation ? (<View className="mt-6 gap-2">
            <Text className="text-center font-sans text-body-sm text-muted">
              {t(signup ? 'Already have an account?' : 'New here?')}
            </Text>
            <Button label={signup ? 'Sign in' : 'Create an account'} variant="ghost" disabled={loading} onPress={() => router.replace(signup ? '/login' : '/signup')}/>
          </View>) : null}
      </View>
    </ScreenScroll>);
}
