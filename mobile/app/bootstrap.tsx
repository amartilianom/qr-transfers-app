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
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { colors, fonts, radii } from '@/lib/theme';

export default function BootstrapScreen() {
  const [businessName, setBusinessName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [loading, setLoading] = useState(false);
  const { refreshBusinessUser } = useAuth();

  async function handleCreate() {
    if (!businessName.trim() || !branchName.trim()) {
      Alert.alert('Error', 'Ambos campos son obligatorios');
      return;
    }

    setLoading(true);
    const { error } = await supabase.rpc('bootstrap_business', {
      p_business_name: businessName.trim(),
      p_branch_name: branchName.trim(),
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    await refreshBusinessUser();
    // AuthGate will redirect to /(app) once businessUser is set
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Configura tu negocio</Text>
        <Text style={styles.subtitle}>
          Ingresa el nombre de tu negocio y tu primera sucursal
        </Text>

        <Text style={styles.label}>Nombre del negocio</Text>
        <TextInput
          style={styles.input}
          placeholder="Mi Restaurante"
          placeholderTextColor={colors.secondary}
          value={businessName}
          onChangeText={setBusinessName}
          autoFocus
        />

        <Text style={styles.label}>Nombre de la sucursal</Text>
        <TextInput
          style={styles.input}
          placeholder="Sede Principal"
          placeholderTextColor={colors.secondary}
          value={branchName}
          onChangeText={setBranchName}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creando...' : 'Crear negocio'}
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
    fontSize: 28,
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.secondary,
    marginBottom: 32,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.input,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.primary,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
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
