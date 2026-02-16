import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, radii } from '@/lib/theme';

export default function NewUserRoleScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>¿Cuál es tu rol?</Text>
        <Text style={styles.subtitle}>
          Selecciona si eres administrador o cajero
        </Text>

        <TouchableOpacity
          style={styles.roleButton}
          onPress={() => router.push('/(auth)/sign-in?role=admin')}
          activeOpacity={0.8}
        >
          <Text style={styles.roleTitle}>Administrador</Text>
          <Text style={styles.roleDescription}>
            Crea y gestiona tu negocio, sucursales y empleados
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roleButton}
          onPress={() => router.push('/(auth)/sign-in?role=cashier')}
          activeOpacity={0.8}
        >
          <Text style={styles.roleTitle}>Cajero</Text>
          <Text style={styles.roleDescription}>
            Únete al negocio al que fuiste invitado
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.secondary,
    marginBottom: 48,
    textAlign: 'center',
  },
  roleButton: {
    backgroundColor: colors.surface,
    borderRadius: radii.button,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  roleTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    color: colors.primary,
    marginBottom: 8,
  },
  roleDescription: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.secondary,
  },
});
