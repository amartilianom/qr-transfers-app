import { Tabs } from 'expo-router';
import { BranchProvider } from '@/lib/branch-context';
import CustomTabBar from '@/components/CustomTabBar';
import { colors } from '@/lib/theme';

export default function AppLayout() {
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
          name="(history)"
          options={{ title: 'Historial' }}
        />
        <Tabs.Screen
          name="transfer"
          options={{ title: 'Transferencia', href: null }}
        />
        <Tabs.Screen
          name="admin"
          options={{ title: 'Admin', href: null }}
        />
      </Tabs>
    </BranchProvider>
  );
}
