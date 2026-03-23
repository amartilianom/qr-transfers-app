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
import {
  getBranches,
  getTeamCollaborators,
  getPendingInvites,
  createInvite,
  updateTeamMember,
  removeTeamMember,
  updateInviteMember,
  cancelInvite,
} from '@/lib/queries';
import { BusinessUser, Invite } from '@/types/database';
import PhoneInput from '@/components/PhoneInput';
import { colors, fonts, radii, shadows, sf } from '@/lib/theme';

type MemberItem =
  | { kind: 'member'; data: BusinessUser }
  | { kind: 'invite'; data: Invite };

type EditingState =
  | { mode: 'new' }
  | { mode: 'member'; item: BusinessUser }
  | { mode: 'invite'; item: Invite }
  | null;

export default function TeamScreen() {
  const router = useRouter();
  const { displayName, currentBusinessUser, session } = useAuth();
  const [items, setItems] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingState>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentBusinessUser) return;
    const [{ data: members }, { data: invites }] = await Promise.all([
      getTeamCollaborators(currentBusinessUser.business_id),
      getPendingInvites(currentBusinessUser.business_id),
    ]);
    const list: MemberItem[] = [
      ...(members ?? []).map((m): MemberItem => ({ kind: 'member', data: m })),
      ...(invites ?? []).map((i): MemberItem => ({ kind: 'invite', data: i })),
    ];
    setItems(list);
    setLoading(false);
  }, [currentBusinessUser]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  function openAdd() {
    setFormName('');
    setFormPhone('');
    setEditing({ mode: 'new' });
  }

  function openEditMember(item: BusinessUser) {
    setFormName(item.name ?? '');
    setFormPhone(item.whatsapp ?? '');
    setEditing({ mode: 'member', item });
  }

  function openEditInvite(item: Invite) {
    setFormName(item.name ?? '');
    setFormPhone(item.phone ?? '');
    setEditing({ mode: 'invite', item });
  }

  function cancelEdit() {
    setEditing(null);
  }

  async function handleSave() {
    if (!formName.trim()) return;
    setSaving(true);

    if (editing?.mode === 'new') {
      if (!currentBusinessUser || !session) { setSaving(false); return; }
      const { data: branches } = await getBranches();
      const branchIds = (branches ?? []).map((b) => b.id);
      if (branchIds.length === 0) {
        Alert.alert('Error', 'Crea al menos una sucursal primero.');
        setSaving(false);
        return;
      }
      const { error } = await createInvite(
        currentBusinessUser.business_id,
        session.user.id,
        'collaborator',
        branchIds,
        formName.trim(),
        formPhone.trim(),
      );
      if (error) { Alert.alert('Error', error.message); setSaving(false); return; }
    } else if (editing?.mode === 'member') {
      const { error } = await updateTeamMember(editing.item.id, {
        name: formName.trim(),
        whatsapp: formPhone.trim(),
      });
      if (error) { Alert.alert('Error', (error as any).message); setSaving(false); return; }
    } else if (editing?.mode === 'invite') {
      const { error } = await updateInviteMember(editing.item.id, {
        name: formName.trim(),
        phone: formPhone.trim(),
      });
      if (error) { Alert.alert('Error', (error as any).message); setSaving(false); return; }
    }

    setSaving(false);
    setEditing(null);
    fetchData();
  }

  async function handleRemoveMember(item: BusinessUser) {
    Alert.alert('Eliminar miembro', `¿Eliminar a ${item.name || 'este miembro'} del equipo?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => { await removeTeamMember(item.id); fetchData(); },
      },
    ]);
  }

  async function handleCancelInvite(item: Invite) {
    Alert.alert('Cancelar invitación', `¿Cancelar la invitación de ${item.name || item.phone}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar', style: 'destructive',
        onPress: async () => { await cancelInvite(item.id); fetchData(); },
      },
    ]);
  }

  const isFormView = editing !== null;

  function renderEditingBadge() {
    if (editing?.mode === 'invite') return <View style={[styles.badge, styles.badgePending]}><Text style={[styles.badgeText, styles.badgeTextPending]}>PENDIENTE</Text></View>;
    return <View style={[styles.badge, styles.badgeActive]}><Text style={styles.badgeText}>ACTIVO</Text></View>;
  }

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
        <Text style={styles.title}>Equipo de Caja</Text>
      </View>

      {/* Hint */}
      <Text style={styles.hint}>
        Si cambias el WhatsApp, se enviará un nuevo código de acceso.
      </Text>

      {isFormView ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            {/* Existing member summary at top of form */}
            {(editing.mode === 'member' || editing.mode === 'invite') && (
              <View style={styles.editingHeader}>
                <View style={styles.editingInfo}>
                  <Text style={styles.editingName}>{editing.item.name || '—'}</Text>
                  <Text style={styles.editingPhone}>
                    {editing.mode === 'member' ? (editing.item.whatsapp || '') : editing.item.phone}
                  </Text>
                </View>
                {renderEditingBadge()}
              </View>
            )}

            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>NOMBRE COMPLETO</Text>
              <TextInput
                style={styles.fieldInput}
                value={formName}
                onChangeText={setFormName}
                placeholder="Nombre del responsable"
                placeholderTextColor={colors.secondary}
                autoFocus
                returnKeyType="next"
                autoCapitalize="words"
              />
              <View style={styles.fieldDivider} />
              <Text style={styles.fieldLabel}>NÚMERO DE WHATSAPP</Text>
              <View style={styles.phoneWrapper}>
                <PhoneInput value={formPhone} onChange={setFormPhone} />
              </View>
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
        <>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => `${item.kind}-${item.data.id}`}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                <TouchableOpacity style={styles.addButton} onPress={openAdd} activeOpacity={0.7}>
                  <Ionicons name="add" size={20} color={colors.secondary} />
                  <Text style={styles.addButtonText}>Agregar Responsable</Text>
                </TouchableOpacity>
              }
              ListEmptyComponent={
                <Text style={styles.emptyText}>No hay miembros en el equipo todavía.</Text>
              }
              renderItem={({ item }) => {
                const isInvite = item.kind === 'invite';
                const name = item.data.name;
                const phone = isInvite
                  ? (item.data as Invite).phone
                  : (item.data as BusinessUser).whatsapp;

                return (
                  <View style={styles.memberCard}>
                    <View style={styles.memberTop}>
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{name || '—'}</Text>
                        {phone ? <Text style={styles.memberPhone}>{phone}</Text> : null}
                      </View>
                      <View style={[styles.badge, isInvite ? styles.badgePending : styles.badgeActive]}>
                        <Text style={[styles.badgeText, isInvite && styles.badgeTextPending]}>
                          {isInvite ? 'PENDIENTE' : 'ACTIVO'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.memberActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => isInvite
                          ? openEditInvite(item.data as Invite)
                          : openEditMember(item.data as BusinessUser)
                        }
                        activeOpacity={0.7}
                      >
                        <Ionicons name="pencil-outline" size={15} color={colors.primary} />
                        <Text style={styles.actionText}>Editar</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonDanger]}
                        onPress={() => isInvite
                          ? handleCancelInvite(item.data as Invite)
                          : handleRemoveMember(item.data as BusinessUser)
                        }
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={15} color={colors.error} />
                        <Text style={styles.actionTextDanger}>Eliminar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
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
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: sf(28),
    color: colors.primary,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: sf(14),
    color: colors.secondary,
    paddingHorizontal: 20,
    marginBottom: 20,
    lineHeight: 20,
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
    marginBottom: 12,
  },
  addButtonText: {
    fontFamily: fonts.medium,
    fontSize: sf(17),
    color: colors.secondary,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: sf(14),
    color: colors.secondary,
    textAlign: 'center',
    marginTop: 32,
  },
  memberCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 16,
    gap: 12,
    ...shadows.soft,
  },
  memberTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  memberInfo: {
    flex: 1,
    marginRight: 12,
  },
  memberName: {
    fontFamily: fonts.semiBold,
    fontSize: sf(17),
    color: colors.primary,
  },
  memberPhone: {
    fontFamily: fonts.regular,
    fontSize: sf(15),
    color: colors.secondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeActive: {
    backgroundColor: '#D1FAE5',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: sf(13),
    color: colors.success,
    letterSpacing: 0.5,
  },
  badgeTextPending: {
    color: '#B45309',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonDanger: {
    borderColor: '#FECACA',
  },
  actionText: {
    fontFamily: fonts.medium,
    fontSize: sf(16),
    color: colors.primary,
  },
  actionTextDanger: {
    fontFamily: fonts.medium,
    fontSize: sf(16),
    color: colors.error,
  },

  // Form
  formContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  editingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 16,
    ...shadows.soft,
  },
  editingInfo: {
    flex: 1,
    marginRight: 12,
  },
  editingName: {
    fontFamily: fonts.semiBold,
    fontSize: sf(17),
    color: colors.primary,
  },
  editingPhone: {
    fontFamily: fonts.regular,
    fontSize: sf(15),
    color: colors.secondary,
    marginTop: 2,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingHorizontal: 16,
    paddingBottom: 14,
    ...shadows.soft,
  },
  fieldLabel: {
    fontFamily: fonts.semiBold,
    fontSize: sf(13),
    color: colors.secondary,
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 2,
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
  phoneWrapper: {
    marginTop: 4,
    marginHorizontal: -16,
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
