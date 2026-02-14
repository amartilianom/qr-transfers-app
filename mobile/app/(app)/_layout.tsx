import { Tabs } from 'expo-router';
import { BranchProvider } from '@/lib/branch-context';
import { useAuth } from '@/lib/auth-context';
import CustomTabBar from '@/components/CustomTabBar';
import { colors } from '@/lib/theme';

export default function AppLayout() {
  const { businessUser } = useAuth();
  const isAdmin = businessUser?.role === 'admin';

  return (
    <BranchProvider>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: colors.surface },
        }}
      >
        <Tabs.Screen
          name="(home)"
          options={{ title: 'Inicio' }}
        />
        <Tabs.Screen
          name="transfer"
          options={{
            title: 'Transferencia',
            href: null, // hide from tab bar, accessed via FAB
          }}
        />
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            href: isAdmin ? undefined : null, // hide for non-admins
          }}
        />
      </Tabs>
    </BranchProvider>
  );
}
