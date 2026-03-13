import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { colors, fonts, radii, sf } from '@/lib/theme';
import PhoneInput from '@/components/PhoneInput';

export default function SignInScreen() {
  const [fullPhone, setFullPhone] = useState('+57');
  const [loading, setLoading] = useState(false);
  const { signInWithOtp } = useAuth();
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role?: 'admin' | 'cashier' }>();

  async function handleSendOtp() {
    // Strip dial code and count remaining digits
    if (fullPhone.replace(/\D/g, '').length < 7) {
      Alert.alert('Error', 'Ingresa un número válido');
      return;
    }

    setLoading(true);
    const { error } = await signInWithOtp(fullPhone);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    router.push({
      pathname: '/(auth)/verify',
      params: { phone: fullPhone, role: role || 'existing' },
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Bienvenido</Text>
        <Text style={styles.subtitle}>Ingresa tu número de celular para continuar</Text>

        <View style={styles.phoneWrapper}>
          <PhoneInput value={fullPhone} onChange={setFullPhone} />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSendOtp}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color={colors.surface} />
            : <Text style={styles.buttonText}>Enviar código</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    fontSize: sf(32),
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: sf(16),
    color: colors.secondary,
    marginBottom: 32,
  },
  phoneWrapper: {
    marginBottom: 24,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: fonts.semiBold,
    fontSize: sf(16),
    color: colors.surface,
  },
});
