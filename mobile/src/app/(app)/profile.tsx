import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Constants from 'expo-constants'
import { Button } from '@/components/ui'
import { useAuth } from '@/lib/auth'

function memberSince(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="py-3">
      <Text className="font-mono text-[10px] tracking-[1.5px] text-[#8fa093]">{label}</Text>
      <Text className="mt-1 font-sans text-[15px] text-chalk">{value}</Text>
    </View>
  )
}

export default function Profile() {
  const { session, signOut } = useAuth()
  const email = session?.user.email ?? ''
  const version = Constants.expoConfig?.version ?? '1.0.0'

  return (
    <View className="flex-1 bg-pantry">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-1 px-6 pt-6">
          <Text className="font-mono text-[11px] tracking-[2px] text-zest">ACCOUNT</Text>
          <Text className="mt-2 font-display text-[30px] text-chalk">Profile</Text>

          {/* account info */}
          <View className="mt-6 rounded-2xl border border-chalk/10 bg-chalk/[0.03] px-5 py-1">
            <InfoRow label="EMAIL" value={email} />
            <View className="h-px bg-chalk/10" />
            <InfoRow label="MEMBER SINCE" value={memberSince(session?.user.created_at)} />
          </View>

          {/* brand / app info */}
          <View className="mt-4 rounded-2xl bg-ink p-5">
            <Text className="font-display text-[20px] text-chalk">
              Chef<Text className="text-zest">AI</Text>
            </Text>
            <Text className="mt-1 font-sans text-[13px] text-[#8fa093]">
              Cook what you already have.
            </Text>
            <View className="mt-4 flex-row items-center gap-2">
              <Text className="font-mono text-[10px] tracking-[1.5px] text-[#6e7263]">
                VERSION {version}
              </Text>
            </View>
          </View>

          <View className="mt-auto mb-6">
            <Button label="SIGN OUT" variant="ghost" onPress={() => signOut()} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  )
}
