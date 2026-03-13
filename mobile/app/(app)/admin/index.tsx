import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { colors, fonts, radii, shadows, sf } from '@/lib/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type MenuItem = {
  icon: IoniconsName;
  label: string;
  onPress: () => void;
};

export default function AdminScreen() {
  const router = useRouter();
  const { displayName, businessUser, signOut } = useAuth();

  const isAdmin = businessUser?.role === 'admin';

  const menuItems: MenuItem[] = [
    {
      icon: 'person-circle-outline',
      label: 'Mi Perfil',
      onPress: () => router.push('/(app)/admin/profile'),
    },
    ...(isAdmin ? [
      {
        icon: 'storefront-outline' as IoniconsName,
        label: 'Sucursales',
        onPress: () => router.push('/(app)/admin/branches'),
      },
      {
        icon: 'people-outline' as IoniconsName,
        label: 'Equipo de Caja',
        onPress: () => router.push('/(app)/admin/invite'),
      },
    ] : []),
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header row */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hola, {displayName}</Text>
        <Ionicons name="settings-outline" size={22} color={colors.primary} />
      </View>

      <Text style={styles.title}>Ajustes</Text>

      <View style={styles.content}>
        {/* Menu items */}
        <View style={styles.group}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.row,
                index < menuItems.length - 1 && styles.rowBorder,
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Ionicons name={item.icon} size={22} color={colors.primary} style={styles.rowIcon} />
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.secondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutCard} onPress={() => signOut()} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={22} color={colors.error} style={styles.rowIcon} />
          <Text style={styles.signOutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 4,
  },
  greeting: {
    fontFamily: fonts.medium,
    fontSize: sf(16),
    color: colors.secondary,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: sf(28),
    color: colors.primary,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    ...shadows.soft,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowIcon: {
    marginRight: 14,
  },
  rowLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: sf(17),
    color: colors.primary,
  },
  signOutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingVertical: 16,
    paddingHorizontal: 16,
    ...shadows.soft,
  },
  signOutText: {
    fontFamily: fonts.medium,
    fontSize: sf(17),
    color: colors.error,
  },
});
