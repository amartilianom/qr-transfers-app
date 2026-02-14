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
      <Stack.Screen name="index" options={{ title: 'Admin' }} />
      <Stack.Screen name="branches" options={{ title: 'Sucursales' }} />
      <Stack.Screen name="invite" options={{ title: 'Invitar usuario' }} />
    </Stack>
  );
}
