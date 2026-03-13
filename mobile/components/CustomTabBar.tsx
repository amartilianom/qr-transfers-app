import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadows, sf } from '@/lib/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { default: IoniconsName; active: IoniconsName }> = {
  Inicio:    { default: 'home-outline',  active: 'home' },
  Historial: { default: 'time-outline',  active: 'time' },
};

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const router = useRouter();

  // Expo Router transforms `href: null` into `tabBarItemStyle: { display: 'none' }`
  const visibleRoutes = state.routes.filter(
    (route) => (descriptors[route.key].options.tabBarItemStyle as any)?.display !== 'none',
  );

  const mid = Math.ceil(visibleRoutes.length / 2);
  const leftRoutes = visibleRoutes.slice(0, mid);
  const rightRoutes = visibleRoutes.slice(mid);

  function renderTab(route: (typeof visibleRoutes)[0]) {
    const { options } = descriptors[route.key];
    const label = (options.tabBarLabel ?? options.title ?? route.name) as string;
    const isFocused = state.index === state.routes.indexOf(route);
    const icons = TAB_ICONS[label];
    const iconName = icons ? (isFocused ? icons.active : icons.default) : 'ellipse-outline';

    function onPress() {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    }

    return (
      <TouchableOpacity key={route.key} style={styles.tab} onPress={onPress} activeOpacity={0.7}>
        <Ionicons
          name={iconName}
          size={22}
          color={isFocused ? colors.primary : colors.secondary}
        />
        <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        <View style={styles.leftGroup}>{leftRoutes.map(renderTab)}</View>
        <View style={styles.fabSpacer} />
        <View style={styles.rightGroup}>{rightRoutes.map(renderTab)}</View>
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(app)/transfer/capture')}
        activeOpacity={0.8}
      >
        <Ionicons name="scan-outline" size={28} color={colors.surface} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingBottom: 20,
    paddingTop: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    ...shadows.medium,
    shadowOffset: { width: 0, height: -4 },
  },
  leftGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  rightGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  tab: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 28,
    gap: 3,
  },
  tabLabel: {
    fontFamily: fonts.medium,
    fontSize: sf(14),
    color: colors.secondary,
  },
  tabLabelActive: {
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  fabSpacer: {
    width: 80,
  },
  fab: {
    position: 'absolute',
    top: -28,
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
  },
});
