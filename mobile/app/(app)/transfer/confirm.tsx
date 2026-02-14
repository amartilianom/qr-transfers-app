import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth-context';
import { useBranch } from '@/lib/branch-context';
import { createTransfer, uploadReceipt, checkDuplicateTransactionId } from '@/lib/queries';
import { TransferProvider } from '@/types/database';
import { colors, fonts, radii, shadows } from '@/lib/theme';

const providers: { value: TransferProvider; label: string }[] = [
  { value: 'nequi', label: 'Nequi' },
  { value: 'daviplata', label: 'Daviplata' },
  { value: 'bancolombia', label: 'Bancolombia' },
];

export default function ConfirmScreen() {
  const router = useRouter();
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const { session, businessUser } = useAuth();
  const { currentBranch } = useBranch();

  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState<TransferProvider>('nequi');
  const [transactionId, setTransactionId] = useState('');
  const [occurredAt, setOccurredAt] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(false);

  async function handleCheckDuplicate() {
    if (!transactionId.trim() || !currentBranch) return;

    const { data } = await checkDuplicateTransactionId(transactionId.trim(), currentBranch.id);
    if (data && data.length > 0) {
      setDuplicateWarning(
        `Ya existe una transferencia con este ID (${data[0].provider}, $${data[0].amount}). Puedes guardar de todas formas.`,
      );
    } else {
      setDuplicateWarning(null);
    }
  }

  async function handleSave() {
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }
    if (!currentBranch || !session) return;

    setLoading(true);

    let receiptPath: string | null = null;
    if (imageUri) {
      const storagePath = `${businessUser!.business_id}/${currentBranch.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await uploadReceipt(imageUri, storagePath);
      if (!uploadError) {
        receiptPath = storagePath;
      }
    }

    const { error } = await createTransfer({
      branch_id: currentBranch.id,
      created_by: session.user.id,
      amount: Number(amount),
      provider,
      transaction_id: transactionId.trim() || null,
      receipt_path: receiptPath,
      occurred_at: occurredAt.toISOString(),
    });

    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    router.dismissAll();
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backText}>Atrás</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirmar datos</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          {/* Thumbnail */}
          {imageUri && (
            <TouchableOpacity
              onPress={() => setImagePreview(true)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: imageUri }} style={styles.thumbnail} />
            </TouchableOpacity>
          )}

          {/* Amount */}
          <Text style={styles.label}>Monto *</Text>
          <TextInput
            style={styles.inputLarge}
            placeholder="0"
            placeholderTextColor={colors.secondary}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            autoFocus
          />

          {/* Provider */}
          <Text style={styles.label}>Proveedor</Text>
          <View style={styles.providerRow}>
            {providers.map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[
                  styles.providerPill,
                  provider === p.value && styles.providerPillActive,
                ]}
                onPress={() => setProvider(p.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.providerPillText,
                    provider === p.value && styles.providerPillTextActive,
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Transaction ID */}
          <Text style={styles.label}>ID de transacción</Text>
          <TextInput
            style={styles.input}
            placeholder="Número de referencia"
            placeholderTextColor={colors.secondary}
            value={transactionId}
            onChangeText={(t) => {
              setTransactionId(t);
              setDuplicateWarning(null);
            }}
            onBlur={handleCheckDuplicate}
          />
          {duplicateWarning && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>{duplicateWarning}</Text>
            </View>
          )}

          {/* Date & Time */}
          <Text style={styles.label}>Fecha y hora</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.dateText}>
                {occurredAt.toLocaleDateString('es-CO')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.dateText}>
                {occurredAt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={occurredAt}
              mode="date"
              onChange={(_, date) => {
                setShowDatePicker(false);
                if (date) setOccurredAt(date);
              }}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={occurredAt}
              mode="time"
              onChange={(_, date) => {
                setShowTimePicker(false);
                if (date) setOccurredAt(date);
              }}
            />
          )}

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Guardando...' : 'Guardar transferencia'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Full image preview modal */}
      <Modal visible={imagePreview} transparent animationType="fade">
        <TouchableOpacity
          style={styles.previewOverlay}
          onPress={() => setImagePreview(false)}
          activeOpacity={1}
        >
          <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
        </TouchableOpacity>
      </Modal>
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
    paddingVertical: 12,
  },
  backText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.secondary,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.primary,
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: radii.card,
    marginBottom: 20,
    backgroundColor: colors.border,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.primary,
    marginBottom: 8,
    marginTop: 16,
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
  },
  inputLarge: {
    backgroundColor: colors.surface,
    borderRadius: radii.input,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  providerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  providerPill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.button,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  providerPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  providerPillText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.primary,
  },
  providerPillTextActive: {
    color: colors.surface,
    fontFamily: fonts.semiBold,
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    borderRadius: radii.input,
    padding: 12,
    marginTop: 8,
  },
  warningText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#856404',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.input,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.primary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.surface,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '90%',
    height: '80%',
  },
});
