import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { getBranches, createBranch, updateBranch } from '@/lib/queries';
import { Branch } from '@/types/database';
import { colors, fonts, radii, shadows, sf } from '@/lib/theme';

type EditingState = { mode: 'new' } | { mode: 'edit'; branch: Branch } | null;

export default function BranchesScreen() {
  const router = useRouter();
  const { displayName, businessUser } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingState>(null);
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    const { data } = await getBranches();
    setBranches(data ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  function openAdd() {
    setFormName('');
    setFormAddress('');
    setEditing({ mode: 'new' });
  }

  function openEdit(branch: Branch) {
    setFormName(branch.name);
    setFormAddress(branch.address ?? '');
    setEditing({ mode: 'edit', branch });
  }

  function cancelEdit() {
    setEditing(null);
  }

  async function handleSave() {
    if (!formName.trim()) return;
    setSaving(true);

    if (editing?.mode === 'new') {
      if (!businessUser) return;
      const { error } = await createBranch(businessUser.business_id, formName.trim(), formAddress.trim() || undefined);
      if (error) {
        Alert.alert('Error', error.message);
        setSaving(false);
        return;
      }
    } else if (editing?.mode === 'edit') {
      const { error } = await updateBranch(editing.branch.id, {
        name: formName.trim(),
        address: formAddress.trim() || null,
      });
      if (error) {
        Alert.alert('Error', (error as any).message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setEditing(null);
    fetchData();
  }

  async function handleDelete(branch: Branch) {
    Alert.alert(
      'Eliminar sucursal',
      `¿Seguro que deseas eliminar "${branch.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await updateBranch(branch.id, { active: false });
            fetchData();
          },
        },
      ],
    );
  }

  const isFormView = editing !== null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Greeting row */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hola, {displayName}</Text>
        <Ionicons name="settings-outline" size={22} color={colors.primary} />
      </View>

      {/* Back + title row */}
      <View style={styles.titleRow}>
        <TouchableOpacity
          onPress={isFormView ? cancelEdit : () => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Sucursales</Text>
      </View>

      {isFormView ? (
        /* ── Edit / Add form ── */
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>NOMBRE DE LA SEDE</Text>
              <TextInput
                style={styles.fieldInput}
                value={formName}
                onChangeText={setFormName}
                placeholder="Ej. Sede Norte"
                placeholderTextColor={colors.secondary}
                autoFocus
                returnKeyType="next"
              />
              <View style={styles.fieldDivider} />
              <Text style={styles.fieldLabel}>DIRECCIÓN</Text>
              <TextInput
                style={styles.fieldInput}
                value={formAddress}
                onChangeText={setFormAddress}
                placeholder="Ej. Calle 100 #15-20, Bogotá"
                placeholderTextColor={colors.secondary}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
            </View>

            <View style={styles.formButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelEdit} activeOpacity={0.7}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        /* ── Branch list ── */
        <>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={branches}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={
                <TouchableOpacity style={styles.addButton} onPress={openAdd} activeOpacity={0.7}>
                  <Ionicons name="add" size={20} color={colors.secondary} />
                  <Text style={styles.addButtonText}>Agregar Sede</Text>
                </TouchableOpacity>
              }
              renderItem={({ item }) => (
                <View style={styles.branchCard}>
                  <View style={styles.branchInfo}>
                    <Text style={styles.branchName}>{item.name}</Text>
                    {item.address ? (
                      <Text style={styles.branchAddress}>{item.address}</Text>
                    ) : null}
                  </View>
                  <View style={styles.branchActions}>
                    <TouchableOpacity
                      style={styles.editAction}
                      onPress={() => openEdit(item)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="pencil-outline" size={16} color={colors.success} />
                      <Text style={styles.editText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(item)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />
          )}
        </>
      )}
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
    fontSize: sf(16),
    color: colors.secondary,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: sf(28),
    color: colors.primary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radii.card,
    paddingVertical: 16,
    marginBottom: 10,
  },
  addButtonText: {
    fontFamily: fonts.medium,
    fontSize: sf(17),
    color: colors.secondary,
  },
  branchCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.soft,
  },
  branchInfo: {
    flex: 1,
    marginRight: 12,
  },
  branchName: {
    fontFamily: fonts.semiBold,
    fontSize: sf(17),
    color: colors.primary,
  },
  branchAddress: {
    fontFamily: fonts.regular,
    fontSize: sf(15),
    color: colors.secondary,
    marginTop: 2,
  },
  branchActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  editAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editText: {
    fontFamily: fonts.medium,
    fontSize: sf(16),
    color: colors.success,
  },

  // Form
  formContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingHorizontal: 16,
    paddingVertical: 4,
    ...shadows.soft,
  },
  fieldLabel: {
    fontFamily: fonts.semiBold,
    fontSize: sf(13),
    color: colors.secondary,
    letterSpacing: 0.8,
    marginTop: 14,
  },
  fieldInput: {
    fontFamily: fonts.medium,
    fontSize: sf(17),
    color: colors.primary,
    paddingVertical: 10,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.card,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: sf(17),
    color: colors.primary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radii.card,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: fonts.bold,
    fontSize: sf(17),
    color: colors.surface,
  },
});
