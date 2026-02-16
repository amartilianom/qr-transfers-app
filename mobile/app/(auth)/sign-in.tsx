import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { colors, fonts, radii } from '@/lib/theme';

export default function SignInScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithOtp } = useAuth();
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role?: 'admin' | 'cashier' }>();

  const fullPhone = `+57${phone.replace(/\D/g, '')}`;

  async function handleSendOtp() {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      Alert.alert('Error', 'Ingresa un número de 10 dígitos');
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
      params: {
        phone: fullPhone,
        role: role || 'existing',
      },
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

        <View style={styles.phoneRow}>
          <View style={styles.prefix}>
            <Text style={styles.prefixText}>+57</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="300 123 4567"
            placeholderTextColor={colors.secondary}
            keyboardType="phone-pad"
            maxLength={13}
            value={phone}
            onChangeText={setPhone}
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSendOtp}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Enviando...' : 'Enviar código'}
          </Text>
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
    fontSize: 32,
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.secondary,
    marginBottom: 32,
  },
  phoneRow: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  prefix: {
    backgroundColor: colors.surface,
    borderRadius: radii.input,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  prefixText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.primary,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.input,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.primary,
    borderWidth: 1,
    borderColor: colors.border,
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
    fontSize: 16,
    color: colors.surface,
  },
});
