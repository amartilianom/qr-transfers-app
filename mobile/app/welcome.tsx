import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, radii } from '@/lib/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Bienvenido</Text>
        <Text style={styles.subtitle}>
          ¿Eres nuevo o ya tienes una cuenta?
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/new-user-role')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Soy nuevo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => router.push('/(auth)/sign-in')}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Ya tengo cuenta
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
    fontSize: 32,
    color: colors.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 18,
    color: colors.secondary,
    marginBottom: 48,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  buttonText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.surface,
  },
  secondaryButtonText: {
    color: colors.primary,
  },
});
