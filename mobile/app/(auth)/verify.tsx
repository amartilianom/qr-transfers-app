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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { colors, fonts, radii } from '@/lib/theme';

export default function VerifyScreen() {
  const { phone, role } = useLocalSearchParams<{ phone: string; role?: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { verifyOtp, refreshBusinessUser } = useAuth();
  const router = useRouter();

  async function handleVerify() {
    if (code.length < 6) {
      Alert.alert('Error', 'Ingresa el código de 6 dígitos');
      return;
    }

    setLoading(true);
    const { error } = await verifyOtp(phone!, code);

    if (error) {
      setLoading(false);
      Alert.alert('Error', error.message);
      return;
    }

    // Refresh business user data
    await refreshBusinessUser();
    setLoading(false);

    // Route based on role
    if (role === 'admin') {
      // New admin → create business
      router.replace('/bootstrap');
    } else if (role === 'cashier') {
      // New cashier → check invite
      router.replace('/cashier-invite');
    }
    // else: existing user → AuthGate will handle routing
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Verificar código</Text>
        <Text style={styles.subtitle}>
          Ingresa el código enviado a {phone}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="123456"
          placeholderTextColor={colors.secondary}
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
          autoFocus
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Verificando...' : 'Verificar'}
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
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.input,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    fontFamily: fonts.semiBold,
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: 8,
    borderWidth: 1,
    borderColor: colors.border,
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
    fontSize: 16,
    color: colors.surface,
  },
});
