import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { colors, fonts, radii, shadows } from '@/lib/theme';
import PhoneInput from '@/components/PhoneInput';

export default function ProfileScreen() {
  const router = useRouter();
  const { session } = useAuth();

  const meta = session?.user.user_metadata ?? {};

  const [name, setName] = useState<string>(meta.full_name ?? '');
  const [whatsapp, setWhatsapp] = useState<string>(meta.whatsapp ?? session?.user.phone ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: name.trim(), whatsapp: whatsapp.trim() },
    });
    setSaving(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Listo', 'Perfil actualizado correctamente.');
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top greeting row */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hola, {name || 'Admin'}</Text>
        <Ionicons name="settings-outline" size={22} color={colors.primary} />
      </View>

      {/* Back + title row */}
      <View style={styles.titleRow}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Mi Perfil</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Name field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>NOMBRE DEL ADMINISTRADOR</Text>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Tu nombre"
                placeholderTextColor={colors.secondary}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* WhatsApp field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>NÚMERO DE WHATSAPP</Text>
            <PhoneInput value={whatsapp} onChange={setWhatsapp} />
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    fontSize: 14,
    color: colors.secondary,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 28,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 26,
    color: colors.primary,
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 40,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.secondary,
    letterSpacing: 0.8,
  },
  inputCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingHorizontal: 16,
    paddingVertical: 4,
    ...shadows.soft,
  },
  input: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.primary,
    paddingVertical: 14,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.card,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.surface,
  },
});
