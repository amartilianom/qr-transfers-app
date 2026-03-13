import { Stack } from 'expo-router';
import { colors, fonts } from '@/lib/theme';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontFamily: fonts.bold, fontSize: 18, color: colors.primary },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="branches" options={{ headerShown: false }} />
      <Stack.Screen name="invite" options={{ headerShown: false }} />
    </Stack>
  );
}
