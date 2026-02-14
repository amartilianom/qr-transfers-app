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
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { getBranches, createBranch, updateBranch } from '@/lib/queries';
import { Branch } from '@/types/database';
import { colors, fonts, radii, shadows } from '@/lib/theme';

export default function BranchesScreen() {
  const { businessUser } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

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

  async function handleAdd() {
    if (!newName.trim() || !businessUser) return;
    setAdding(true);
    const { error } = await createBranch(businessUser.business_id, newName.trim());
    setAdding(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    setNewName('');
    fetchData();
  }

  async function handleToggle(branch: Branch) {
    await updateBranch(branch.id, { active: !branch.active });
    fetchData();
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Add branch */}
      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder="Nueva sucursal"
          placeholderTextColor={colors.secondary}
          value={newName}
          onChangeText={setNewName}
        />
        <TouchableOpacity
          style={[styles.addButton, adding && { opacity: 0.6 }]}
          onPress={handleAdd}
          disabled={adding}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>Agregar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={branches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.branchCard}>
            <View>
              <Text style={styles.branchName}>{item.name}</Text>
              <Text style={styles.branchStatus}>
                {item.active ? 'Activa' : 'Inactiva'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleToggle(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleText, !item.active && { color: colors.success }]}>
                {item.active ? 'Desactivar' : 'Activar'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={styles.listContent}
      />
    </View>
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
    backgroundColor: colors.background,
  },
  addRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  addInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.input,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  addButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.surface,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
  branchName: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.primary,
  },
  branchStatus: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.secondary,
    marginTop: 2,
  },
  toggleText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.error,
  },
});
