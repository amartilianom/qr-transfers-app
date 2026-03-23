import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBranch } from '@/lib/branch-context';
import { useAuth } from '@/lib/auth-context';
import BranchPicker from '@/components/BranchPicker';
import { colors, fonts, radii, shadows, sf } from '@/lib/theme';

interface AppHeaderProps {
  title: string;
}

export default function AppHeader({ title }: AppHeaderProps) {
  const router = useRouter();
  const { currentBranch, isAllBranches, branches } = useBranch();
  const { currentBusinessUser, displayName, signOut } = useAuth();
  const [pickerVisible, setPickerVisible] = useState(false);

  const isAdmin = currentBusinessUser?.role === 'admin';
  const canSwitchBranch = branches.length >= 1;
  const branchLabel = isAllBranches ? 'Todas' : (currentBranch?.name ?? '—');

  function onGearPress() {
    router.push('/(app)/admin');
  }

  return (
    <View style={styles.container}>
      {/* Row 1: greeting + gear */}
      <View style={styles.row}>
        <Text style={styles.greeting}>Hola, {displayName}</Text>
        <TouchableOpacity onPress={onGearPress} activeOpacity={0.7} style={styles.gearButton}>
          <Ionicons name="settings-outline" size={22} color={colors.primary} />
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
          <Text style={styles.branchName}>{branchLabel}</Text>
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
    fontSize: sf(16),
    color: colors.secondary,
  },
  gearButton: {
    padding: 10,
    margin: -10,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: sf(28),
    color: colors.primary,
    marginBottom: 16,
  },
  branchSection: {
    gap: 6,
  },
  branchLabel: {
    fontFamily: fonts.regular,
    fontSize: sf(14),
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
    fontSize: sf(17),
    color: colors.primary,
  },
  chevron: {
    fontSize: sf(14),
    color: colors.secondary,
  },
});
