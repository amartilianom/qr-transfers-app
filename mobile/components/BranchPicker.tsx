import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { useBranch } from '@/lib/branch-context';
import { useAuth } from '@/lib/auth-context';
import { colors, fonts, radii, shadows } from '@/lib/theme';
import { Branch } from '@/types/database';

interface BranchPickerProps {
  visible: boolean;
  onClose?: () => void;
}

export default function BranchPicker({ visible, onClose }: BranchPickerProps) {
  const { branches, selectBranch, selectAllBranches, currentBranch, isAllBranches } = useBranch();
  const { currentBusinessUser } = useAuth();
  const isCollaborator = currentBusinessUser?.role !== 'admin';

  async function handleSelect(branch: Branch) {
    if (isCollaborator && currentBranch && currentBranch.id !== branch.id) {
      Alert.alert(
        '¿Cambiar de sucursal?',
        `Asegúrate de haber terminado tu turno en ${currentBranch.name} antes de cambiar.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Cambiar',
            onPress: async () => {
              await selectBranch(branch.id);
              onClose?.();
            },
          },
        ],
      );
    } else {
      await selectBranch(branch.id);
      onClose?.();
    }
  }

  function handleSelectAll() {
    selectAllBranches();
    onClose?.();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>Selecciona una sucursal</Text>

          {/* "Todas" option — admins only */}
          {!isCollaborator && (
            <>
              <TouchableOpacity
                style={[styles.branchItem, isAllBranches && styles.branchItemActive]}
                onPress={handleSelectAll}
                activeOpacity={0.7}
              >
                <Text style={[styles.branchName, isAllBranches && styles.branchNameActive]}>
                  Todas
                </Text>
              </TouchableOpacity>
              <View style={styles.separator} />
            </>
          )}

          <FlatList
            data={branches}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.branchItem,
                  !isAllBranches && item.id === currentBranch?.id && styles.branchItemActive,
                ]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.branchName,
                    !isAllBranches && item.id === currentBranch?.id && styles.branchNameActive,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '60%',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.primary,
    marginBottom: 20,
  },
  branchItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: radii.card,
    ...shadows.soft,
    backgroundColor: colors.surface,
  },
  branchItemActive: {
    backgroundColor: colors.highlight,
  },
  branchName: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.primary,
  },
  branchNameActive: {
    fontFamily: fonts.bold,
  },
  separator: {
    height: 8,
  },
});
