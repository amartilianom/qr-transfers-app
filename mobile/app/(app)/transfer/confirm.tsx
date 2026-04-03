import { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { useBranch } from '@/lib/branch-context';
import {
  createTransfer,
  uploadReceipt,
  checkDuplicateTransactionId,
  getTransfer,
  getReceiptSignedUrl,
  analyzeReceipt,
  deleteTransfer,
} from '@/lib/queries';
import { Transfer, TransferProvider } from '@/types/database';
import { colors, fonts, radii, shadows, sf } from '@/lib/theme';

const providers: { value: TransferProvider; label: string }[] = [
  { value: 'bancamia', label: 'Bancamía' },
  { value: 'bancolombia', label: 'Bancolombia' },
  { value: 'banco caja social', label: 'Banco Caja Social' },
  { value: 'banco de bogota', label: 'Banco de Bogotá' },
  { value: 'banco de occidente', label: 'Banco de Occidente' },
  { value: 'banco popular', label: 'Banco Popular' },
  { value: 'banco w', label: 'Banco W' },
  { value: 'bbva', label: 'BBVA Colombia' },
  { value: 'bold', label: 'Bold' },
  { value: 'confiar', label: 'Confiar' },
  { value: 'daviplata', label: 'Daviplata' },
  { value: 'davivienda', label: 'Davivienda' },
  { value: 'gnb sudameris', label: 'GNB Sudameris' },
  { value: 'itau', label: 'Itaú' },
  { value: 'lulo bank', label: 'Lulo Bank' },
  { value: 'movii', label: 'Movii' },
  { value: 'nequi', label: 'Nequi' },
  { value: 'nubank', label: 'Nubank' },
  { value: 'rappipay', label: 'RappiPay' },
  { value: 'scotiabank colpatria', label: 'Scotiabank Colpatria' },
];

export default function ConfirmScreen() {
  const router = useRouter();
  // imageUri  → create mode
  // transferId → view mode
  const { imageUri, transferId, from } = useLocalSearchParams<{ imageUri?: string; transferId?: string; from?: string }>();
  const { session, currentBusinessUser } = useAuth();
  const { currentBranch } = useBranch();

  const isViewMode = !!transferId;

  // ── View-mode state ──
  const [viewTransfer, setViewTransfer] = useState<Transfer | null>(null);
  const [viewBranchName, setViewBranchName] = useState<string>('—');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [viewLoading, setViewLoading] = useState(isViewMode);

  // ── Create-mode state ──
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState<TransferProvider>('nequi');
  const [transactionId, setTransactionId] = useState('');
  const [occurredAt, setOccurredAt] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showProviderPicker, setShowProviderPicker] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const extractedRef = useRef(false);

  // ── Load existing transfer ──
  useEffect(() => {
    if (!isViewMode) return;
    setReceiptUrl(null);
    (async () => {
      const { data } = await getTransfer(transferId!);
      if (!data) { setViewLoading(false); return; }
      const t = data as any;
      setViewTransfer(t as Transfer);
      setViewBranchName(t.branch?.name ?? '—');
      if (t.receipt_path) {
        const { data: urlData } = await getReceiptSignedUrl(t.receipt_path);
        if (urlData?.signedUrl) setReceiptUrl(urlData.signedUrl);
      }
      setViewLoading(false);
    })();
  }, [transferId]);

  // ── AI extraction (create mode only, runs once) ──
  useEffect(() => {
    if (!imageUri || extractedRef.current) return;
    extractedRef.current = true;
    (async () => {
      setExtracting(true);
      try {
        let b64: string;
        if (Platform.OS === 'web') {
          const resp = await fetch(imageUri);
          const blob = await resp.blob();
          b64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } else {
          b64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
        }
        const { data, error } = await analyzeReceipt(b64);
        if (error) {
          setExtractError(`Error del servidor: ${JSON.stringify(error)}`);
        } else if (data?.error) {
          setExtractError(`Error de análisis: ${data.error}`);
        } else if (data) {
          if (data.amount != null) setAmount(String(data.amount));
          if (data.provider) setProvider(data.provider);
          if (data.transaction_id) setTransactionId(data.transaction_id);
          if (data.occurred_at) {
            const d = new Date(data.occurred_at);
            if (!isNaN(d.getTime())) setOccurredAt(d);
          }
        }
      } catch (e: any) {
        setExtractError(`Excepción: ${e?.message ?? String(e)}`);
      } finally {
        setExtracting(false);
      }
    })();
  }, [imageUri]);

  // ── Helpers ──
  const providerLabel = (v: TransferProvider) =>
    providers.find((p) => p.value === v)?.label ?? v;

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  }
  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }

  const createDateLabel = occurredAt.toLocaleDateString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
  const createTimeLabel = occurredAt.toLocaleTimeString('es-CO', {
    hour: '2-digit', minute: '2-digit',
  });

  async function handleCheckDuplicate() {
    if (!transactionId.trim() || !currentBusinessUser) return;
    const { data } = await checkDuplicateTransactionId(transactionId.trim(), currentBusinessUser.business_id);
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

    setSaving(true);

    let receiptPath: string | null = null;
    if (imageUri) {
      const ext = imageUri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const storagePath = `${currentBusinessUser!.business_id}/${currentBranch.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await uploadReceipt(imageUri, storagePath);
      if (!uploadError) receiptPath = storagePath;
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

    setSaving(false);
    if (error) { Alert.alert('Error', error.message); return; }
    router.navigate('/(app)/(home)');
  }

  async function handleDelete() {
    Alert.alert(
      'Eliminar transferencia',
      '¿Estás seguro? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteTransfer(transferId!);
            if (error) { Alert.alert('Error', error.message); return; }
            from === 'history' ? router.navigate('/(app)/(history)') : router.navigate('/(app)/(home)');
          },
        },
      ],
    );
  }

  // ── Loading state (view mode) ──
  if (isViewMode && (viewLoading || !viewTransfer)) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Shared image for view mode ──
  const viewImageUri = receiptUrl ?? undefined;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={() => from === 'history' ? router.navigate('/(app)/(history)') : router.navigate('/(app)/(home)')} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Receipt image */}
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={() => (isViewMode ? viewImageUri : imageUri) && setImagePreview(true)}
            activeOpacity={(isViewMode ? viewImageUri : imageUri) ? 0.8 : 1}
          >
            {(isViewMode ? viewImageUri : imageUri) ? (
              <Image
                source={{ uri: isViewMode ? viewImageUri! : imageUri! }}
                style={styles.receiptImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={40} color={colors.secondary} />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.imageCaption}>Comprobante capturado</Text>

          {/* Title */}
          <Text style={styles.title}>Verifica los datos</Text>

          {/* AI extraction indicator */}
          {extracting && (
            <View style={styles.extractingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.extractingText}>Analizando comprobante…</Text>
            </View>
          )}
          {extractError && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>{extractError}</Text>
            </View>
          )}

          {/* Amount */}
          <Text style={styles.fieldLabel}>Monto del comprobante</Text>
          {isViewMode ? (
            <View style={styles.amountCard}>
              <Text style={styles.amountText}>
                {Number(viewTransfer?.amount ?? 0).toLocaleString('es-CO')}
              </Text>
            </View>
          ) : (
            <View style={styles.amountCard}>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor={colors.primary}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />
            </View>
          )}

          {/* Branch */}
          <Text style={styles.fieldLabel}>Registrado en</Text>
          <View style={styles.fieldCard}>
            <Text style={styles.fieldValue}>
              {isViewMode ? viewBranchName : (currentBranch?.name ?? '—')}
            </Text>
          </View>

          {/* Date */}
          <Text style={styles.fieldLabel}>Fecha</Text>
          {isViewMode ? (
            <View style={styles.fieldCard}>
              <Text style={styles.fieldValue}>{formatDate(viewTransfer!.occurred_at)}</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.fieldCard} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
              <Text style={styles.fieldValue}>{createDateLabel}</Text>
            </TouchableOpacity>
          )}

          {/* Time */}
          <Text style={styles.fieldLabel}>Hora</Text>
          {isViewMode ? (
            <View style={styles.fieldCard}>
              <Text style={styles.fieldValue}>{formatTime(viewTransfer!.occurred_at)}</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.fieldCard} onPress={() => setShowTimePicker(true)} activeOpacity={0.7}>
              <Text style={styles.fieldValue}>{createTimeLabel}</Text>
            </TouchableOpacity>
          )}

          {/* Provider / Banco */}
          <Text style={styles.fieldLabel}>Banco</Text>
          {isViewMode ? (
            <View style={styles.fieldCard}>
              <Text style={styles.fieldValue}>{providerLabel(viewTransfer!.provider)}</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.fieldCard} onPress={() => setShowProviderPicker(true)} activeOpacity={0.7}>
              <Text style={styles.fieldValue}>{providerLabel(provider)}</Text>
              <Ionicons name="chevron-down" size={18} color={colors.secondary} />
            </TouchableOpacity>
          )}

          {/* Transaction ID */}
          <Text style={styles.fieldLabel}>Codigo Transaccion</Text>
          {isViewMode ? (
            <View style={styles.fieldCard}>
              <Text style={styles.fieldValue}>{viewTransfer?.transaction_id ?? '—'}</Text>
            </View>
          ) : (
            <View style={styles.fieldCard}>
              <TextInput
                style={styles.fieldInput}
                placeholder="Número de referencia"
                placeholderTextColor={colors.secondary}
                value={transactionId}
                onChangeText={(t) => { setTransactionId(t); setDuplicateWarning(null); }}
                onBlur={handleCheckDuplicate}
              />
            </View>
          )}
          {duplicateWarning && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>{duplicateWarning}</Text>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {isViewMode ? (
            currentBusinessUser?.role === 'admin' && (
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.8}>
                <Ionicons name="trash-outline" size={18} color={colors.surface} />
                <Text style={styles.deleteButtonText}>Eliminar registro</Text>
              </TouchableOpacity>
            )
          ) : (
            <TouchableOpacity
              style={[styles.saveButton, (saving || extracting) && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving || extracting}
              activeOpacity={0.8}
            >
              {saving
                ? <ActivityIndicator color={colors.surface} />
                : <Text style={styles.saveButtonText}>Confirmar y Guardar</Text>
              }
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Date / time pickers (create mode only) */}
      {showDatePicker && (
        <DateTimePicker
          value={occurredAt}
          mode="date"
          onChange={(_, date) => { setShowDatePicker(false); if (date) setOccurredAt(date); }}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={occurredAt}
          mode="time"
          onChange={(_, date) => { setShowTimePicker(false); if (date) setOccurredAt(date); }}
        />
      )}

      {/* Provider picker modal (create mode only) */}
      <Modal visible={showProviderPicker} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowProviderPicker(false)} activeOpacity={1}>
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Selecciona el banco</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {providers.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[styles.modalOption, provider === p.value && styles.modalOptionActive]}
                  onPress={() => { setProvider(p.value); setShowProviderPicker(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalOptionText, provider === p.value && styles.modalOptionTextActive]}>
                    {p.label}
                  </Text>
                  {provider === p.value && <Ionicons name="checkmark" size={20} color={colors.success} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Full image preview modal */}
      <Modal visible={imagePreview} transparent animationType="fade">
        <TouchableOpacity style={styles.previewOverlay} onPress={() => setImagePreview(false)} activeOpacity={1}>
          <Image
            source={{ uri: isViewMode ? viewImageUri! : imageUri! }}
            style={styles.previewImage}
            resizeMode="contain"
          />
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  // Receipt image
  imageContainer: {
    width: '100%',
    height: 300,
    borderRadius: radii.card,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginBottom: 10,
    ...shadows.soft,
  },
  receiptImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCaption: {
    fontFamily: fonts.regular,
    fontSize: sf(14),
    color: colors.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },

  // Title
  title: {
    fontFamily: fonts.extraBold,
    fontSize: sf(24),
    color: colors.primary,
    marginBottom: 20,
  },

  // Fields
  fieldLabel: {
    fontFamily: fonts.medium,
    fontSize: sf(13),
    color: colors.secondary,
    marginBottom: 6,
    marginTop: 12,
    letterSpacing: 0.3,
  },
  fieldCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.soft,
  },
  fieldValue: {
    fontFamily: fonts.medium,
    fontSize: sf(17),
    color: colors.primary,
  },
  fieldInput: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: sf(17),
    color: colors.primary,
    padding: 0,
  },

  // Amount (yellow card)
  amountCard: {
    backgroundColor: colors.highlight,
    borderRadius: radii.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    ...shadows.soft,
  },
  amountInput: {
    fontFamily: fonts.bold,
    fontSize: sf(28),
    color: colors.primary,
    padding: 0,
  },
  amountText: {
    fontFamily: fonts.bold,
    fontSize: sf(28),
    color: colors.primary,
  },

  // Warning
  warningBox: {
    backgroundColor: '#FFF3CD',
    borderRadius: radii.input,
    padding: 12,
    marginTop: 8,
  },
  warningText: {
    fontFamily: fonts.regular,
    fontSize: sf(13),
    color: '#856404',
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 12,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: sf(17),
    color: colors.surface,
  },
  deleteButton: {
    backgroundColor: '#DC2626',
    borderRadius: radii.button,
    paddingVertical: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: sf(17),
    color: colors.surface,
  },

  // Provider modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: sf(17),
    color: colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: radii.card,
  },
  modalOptionActive: {
    backgroundColor: '#F0FDF4',
  },
  modalOptionText: {
    fontFamily: fonts.medium,
    fontSize: sf(17),
    color: colors.primary,
  },
  modalOptionTextActive: {
    fontFamily: fonts.semiBold,
    color: colors.success,
  },

  // AI extraction indicator
  extractingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  extractingText: {
    fontFamily: fonts.regular,
    fontSize: sf(14),
    color: colors.secondary,
  },

  // Full image preview
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
