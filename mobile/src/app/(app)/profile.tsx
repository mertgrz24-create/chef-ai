import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '@/components/ui'
import { useAuth } from '@/lib/auth'

export default function Profile() {
  const { session, signOut } = useAuth()
  const email = session?.user.email ?? ''

  return (
    <View className="flex-1 bg-pantry">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-1 px-6 pt-6">
          <Text className="font-mono text-[11px] tracking-[2px] text-zest">ACCOUNT</Text>
          <Text className="mt-2 font-display text-[30px] text-chalk">Profile</Text>

          <View className="mt-8 rounded-2xl border border-chalk/10 bg-chalk/[0.03] p-5">
            <Text className="font-mono text-[10px] tracking-[1.5px] text-[#8fa093]">EMAIL</Text>
            <Text className="mt-1 font-sans text-[15px] text-chalk">{email}</Text>
          </View>

          <View className="mt-auto mb-6">
            <Button label="SIGN OUT" variant="ghost" onPress={() => signOut()} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  )
}
