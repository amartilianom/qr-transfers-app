import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radii, shadows } from '@/lib/theme';

export default function AdminScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/(app)/admin/branches')}
          activeOpacity={0.8}
        >
          <Text style={styles.cardTitle}>Sucursales</Text>
          <Text style={styles.cardSubtitle}>Administrar sucursales del negocio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/(app)/admin/invite')}
          activeOpacity={0.8}
        >
          <Text style={styles.cardTitle}>Invitar usuarios</Text>
          <Text style={styles.cardSubtitle}>Generar enlace de invitación</Text>
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
  content: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 20,
    ...shadows.soft,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.primary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.secondary,
  },
});
