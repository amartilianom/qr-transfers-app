import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { colors, fonts, radii, shadows } from '@/lib/theme';

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Tab items on the left and right, FAB in the center */}
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = (options.tabBarLabel ?? options.title ?? route.name) as string;
          const isFocused = state.index === index;

          // Insert FAB spacer before the second tab
          const isSecondHalf = index >= Math.ceil(state.routes.length / 2);

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
            <View key={route.key} style={styles.tabWrapper}>
              {isSecondHalf && index === Math.ceil(state.routes.length / 2) && (
                <View style={styles.fabSpacer} />
              )}
              <TouchableOpacity
                style={styles.tab}
                onPress={onPress}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    isFocused && styles.tabLabelActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(app)/transfer/capture')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
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
    justifyContent: 'space-around',
    alignItems: 'center',
    ...shadows.medium,
    shadowOffset: { width: 0, height: -4 },
  },
  tabWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  tabLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.secondary,
  },
  tabLabelActive: {
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  fabSpacer: {
    width: 72,
  },
  fab: {
    position: 'absolute',
    top: -28,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: radii.fab,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
  },
  fabIcon: {
    fontSize: 28,
    color: colors.surface,
    fontFamily: fonts.bold,
    marginTop: -2,
  },
});
