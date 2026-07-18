import { Stack } from 'expo-router'

// Single-stack for now; becomes a tab navigator (pantry / recipes / plan /
// profile) in M4 once those screens exist.
export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#1E3A2F' },
      }}
    />
  )
}
