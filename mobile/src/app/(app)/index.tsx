import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth'

// What you have — the raw input, as pantry tags.
const pantry = ['spinach', 'chicken', 'garlic', 'rice', 'lemon']

// What you get — the fired ticket.
const ticketIngredients = [
  '2 chicken breasts',
  '3 cups spinach',
  '4 garlic cloves',
  '1 cup jasmine rice',
]

/**
 * The signature element, ported from the web hero: ingredients (input) become a
 * printed kitchen ticket (output). Same tokens and type roles as the web app.
 */
function RecipeTicket() {
  return (
    <View className="overflow-hidden rounded-2xl bg-surface">
      {/* ink header bar */}
      <View className="flex-row items-center justify-between bg-ink px-4 py-2.5">
        <Text className="font-mono text-[11px] tracking-widest text-chalk">ORDER #0428</Text>
        <Text className="font-mono text-[11px] tracking-widest text-zest">35 MIN</Text>
      </View>

      <View className="px-5 pb-5 pt-4">
        <Text className="font-mono-bold text-[10px] tracking-[2px] text-pantry">
          TONIGHT&apos;S PICK
        </Text>
        <Text className="mb-3 mt-1.5 font-display text-[26px] leading-[30px] text-ink">
          Garlic Chicken{'\n'}& Spinach Rice
        </Text>

        {ticketIngredients.map((line) => (
          <View key={line} className="mb-1.5 flex-row items-center gap-2">
            <Text className="text-pantry">▪</Text>
            <Text className="font-mono text-[12px] text-ink-2">{line}</Text>
          </View>
        ))}

        {/* perforated divider */}
        <View className="my-4 border-t border-dashed border-border" />

        <View className="mb-4 flex-row justify-between">
          {['520 KCAL', '42 P', '48 C', '14 F'].map((macro) => (
            <Text key={macro} className="font-mono text-[11px] text-ink-muted">
              {macro}
            </Text>
          ))}
        </View>

        <View className="rounded-md bg-zest py-3">
          <Text className="text-center font-mono-bold text-[12px] tracking-wide text-ink">
            VIEW RECIPE →
          </Text>
        </View>
      </View>
    </View>
  )
}

export default function Home() {
  const { session, signOut } = useAuth()
  const firstName = session?.user.email?.split('@')[0] ?? 'chef'

  return (
    <View className="flex-1 bg-pantry">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView contentContainerClassName="px-6 pb-12" showsVerticalScrollIndicator={false}>
          <View className="mt-6 flex-row items-center justify-between">
            <Text className="font-mono text-[11px] tracking-[2px] text-zest">
              AI KITCHEN DECISION ENGINE
            </Text>
            <Pressable onPress={() => signOut()} hitSlop={8}>
              <Text className="font-mono text-[11px] tracking-wide text-[#8fa093]">SIGN OUT</Text>
            </Pressable>
          </View>

          <Text className="mt-4 font-sans text-[13px] text-[#8fa093]">
            Signed in as {firstName}
          </Text>

          <Text className="mt-4 font-display text-[34px] leading-[38px] text-chalk">
            Tonight&apos;s dinner is already in your <Text className="text-zest">fridge.</Text>
          </Text>

          <Text className="mt-4 font-sans text-[15px] leading-[23px] text-[#c3c8ba]">
            Snap what you&apos;ve got. Chef-AI reads your ingredients and fires back a recipe you
            can actually make.
          </Text>

          {/* the raw input */}
          <Text className="mb-2.5 mt-8 font-mono text-[10px] tracking-[2px] text-[#8fa093]">
            IN YOUR PANTRY
          </Text>
          <View className="mb-8 flex-row flex-wrap gap-2">
            {pantry.map((ingredient) => (
              <View key={ingredient} className="rounded-full border border-chalk/20 px-3 py-1">
                <Text className="font-mono text-[12px] text-[#e4e8dd]">{ingredient}</Text>
              </View>
            ))}
          </View>

          {/* the fired output */}
          <RecipeTicket />
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
