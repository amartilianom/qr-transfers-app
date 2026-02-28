import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useBranch } from '@/lib/branch-context';
import { useAuth } from '@/lib/auth-context';
import BranchPicker from '@/components/BranchPicker';
import { colors, fonts, radii, shadows } from '@/lib/theme';

interface AppHeaderProps {
  title: string;
}

export default function AppHeader({ title }: AppHeaderProps) {
  const router = useRouter();
  const { currentBranch, branches } = useBranch();
  const { businessUser, signOut } = useAuth();
  const [pickerVisible, setPickerVisible] = useState(false);

  const isAdmin = businessUser?.role === 'admin';
  const roleLabel = isAdmin ? 'Admin' : 'Colaborador';
  const canSwitchBranch = branches.length > 1;

  function onGearPress() {
    router.push('/(app)/admin');
  }

  return (
    <View style={styles.container}>
      {/* Row 1: greeting + gear */}
      <View style={styles.row}>
        <Text style={styles.greeting}>Hola, {roleLabel}</Text>
        <TouchableOpacity onPress={onGearPress} activeOpacity={0.7} style={styles.gearButton}>
          <Text style={styles.gearIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* Row 2: screen title */}
      <Text style={styles.title}>{title}</Text>

      {/* Row 3: branch selector */}
      <View style={styles.branchSection}>
        <Text style={styles.branchLabel}>Sucursal en la que te encuentras</Text>
        <TouchableOpacity
          style={styles.branchSelector}
          onPress={() => canSwitchBranch && setPickerVisible(true)}
          activeOpacity={canSwitchBranch ? 0.7 : 1}
        >
          <Text style={styles.branchName}>{currentBranch?.name ?? '—'}</Text>
          {canSwitchBranch && <Text style={styles.chevron}>▾</Text>}
        </TouchableOpacity>
      </View>

      <BranchPicker visible={pickerVisible} onClose={() => setPickerVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  greeting: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.secondary,
  },
  gearButton: {
    padding: 10,
    margin: -10,
  },
  gearIcon: {
    fontSize: 20,
    color: colors.primary,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 26,
    color: colors.primary,
    marginBottom: 16,
  },
  branchSection: {
    gap: 6,
  },
  branchLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.secondary,
  },
  branchSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.input,
    paddingVertical: 12,
    paddingHorizontal: 14,
    ...shadows.soft,
  },
  branchName: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.primary,
  },
  chevron: {
    fontSize: 14,
    color: colors.secondary,
  },
});
