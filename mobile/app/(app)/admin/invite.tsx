import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { getBranches, createInvite } from '@/lib/queries';
import { Branch, UserRole } from '@/types/database';
import { colors, fonts, radii, shadows } from '@/lib/theme';

export default function InviteScreen() {
  const { session, businessUser } = useAuth();
  const [role, setRole] = useState<UserRole>('collaborator');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getBranches().then(({ data }) => setBranches(data ?? []));
    }, []),
  );

  function toggleBranch(branchId: string) {
    setSelectedBranches((prev) =>
      prev.includes(branchId) ? prev.filter((id) => id !== branchId) : [...prev, branchId],
    );
  }

  async function handleGenerate() {
    if (!businessUser || !session) return;
    if (role === 'collaborator' && selectedBranches.length === 0) {
      Alert.alert('Error', 'Selecciona al menos una sucursal para el colaborador');
      return;
    }

    setLoading(true);
    const { data, error } = await createInvite(
      businessUser.business_id,
      session.user.id,
      role,
      role === 'collaborator' ? selectedBranches : [],
    );
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    setInviteToken(data?.token ?? null);
  }

  async function handleCopy() {
    if (!inviteToken) return;
    const link = `qrtransfers://invite/${inviteToken}`;
    await Clipboard.setStringAsync(link);
    Alert.alert('Copiado', 'El enlace de invitación fue copiado al portapapeles');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Role selector */}
      <Text style={styles.label}>Rol</Text>
      <View style={styles.roleRow}>
        {(['admin', 'collaborator'] as UserRole[]).map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.rolePill, role === r && styles.rolePillActive]}
            onPress={() => {
              setRole(r);
              setInviteToken(null);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.rolePillText, role === r && styles.rolePillTextActive]}>
              {r === 'admin' ? 'Admin' : 'Colaborador'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Branch selector for collaborator */}
      {role === 'collaborator' && (
        <>
          <Text style={styles.label}>Sucursales permitidas</Text>
          {branches.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={[
                styles.branchOption,
                selectedBranches.includes(b.id) && styles.branchOptionActive,
              ]}
              onPress={() => toggleBranch(b.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.branchOptionText,
                  selectedBranches.includes(b.id) && styles.branchOptionTextActive,
                ]}
              >
                {b.name}
              </Text>
              {selectedBranches.includes(b.id) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Generate button */}
      <TouchableOpacity
        style={[styles.generateButton, loading && { opacity: 0.6 }]}
        onPress={handleGenerate}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text style={styles.generateButtonText}>
          {loading ? 'Generando...' : 'Generar invitación'}
        </Text>
      </TouchableOpacity>

      {/* Result */}
      {inviteToken && (
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Enlace de invitación:</Text>
          <Text style={styles.resultToken} selectable>
            qrtransfers://invite/{inviteToken}
          </Text>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopy}
            activeOpacity={0.8}
          >
            <Text style={styles.copyButtonText}>Copiar enlace</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.primary,
    marginBottom: 10,
    marginTop: 20,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rolePill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.button,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  rolePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rolePillText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.primary,
  },
  rolePillTextActive: {
    color: colors.surface,
    fontFamily: fonts.semiBold,
  },
  branchOption: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  branchOptionActive: {
    borderColor: colors.primary,
    backgroundColor: '#F0FAF3',
  },
  branchOptionText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.primary,
  },
  branchOptionTextActive: {
    fontFamily: fonts.semiBold,
  },
  checkmark: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.success,
  },
  generateButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  generateButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.surface,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 20,
    marginTop: 24,
    ...shadows.soft,
  },
  resultLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.secondary,
    marginBottom: 8,
  },
  resultToken: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.primary,
    marginBottom: 16,
  },
  copyButton: {
    backgroundColor: colors.highlight,
    borderRadius: radii.button,
    paddingVertical: 12,
    alignItems: 'center',
  },
  copyButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.primary,
  },
});
