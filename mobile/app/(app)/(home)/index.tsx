import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useBranch } from '@/lib/branch-context';
import { useAuth } from '@/lib/auth-context';
import { getTodayTransfers } from '@/lib/queries';
import { Transfer } from '@/types/database';
import HeroCard from '@/components/HeroCard';
import TransferCard from '@/components/TransferCard';
import BranchPicker from '@/components/BranchPicker';
import { colors, fonts } from '@/lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { currentBranch, branches, needsPicker } = useBranch();
  const { signOut } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  const todayTotal = transfers.reduce((sum, t) => sum + Number(t.amount), 0);

  const fetchData = useCallback(async () => {
    if (!currentBranch) return;
    const { data } = await getTodayTransfers(currentBranch.id);
    setTransfers(data ?? []);
    setLoading(false);
  }, [currentBranch]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [fetchData]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }

  if (!currentBranch) {
    return (
      <SafeAreaView style={styles.container}>
        <BranchPicker visible={needsPicker} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => branches.length > 1 && setPickerVisible(true)}
          activeOpacity={branches.length > 1 ? 0.7 : 1}
        >
          <Text style={styles.branchName}>
            {currentBranch.name}
            {branches.length > 1 ? ' ▾' : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={signOut} activeOpacity={0.7}>
          <Text style={styles.signOut}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={transfers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransferCard transfer={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.heroContainer}>
            <HeroCard total={todayTotal} />
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>No hay transferencias hoy</Text>
          ) : null
        }
      />

      <BranchPicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
      />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  branchName: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.primary,
  },
  signOut: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.secondary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  heroContainer: {
    marginBottom: 20,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.secondary,
    textAlign: 'center',
    marginTop: 40,
  },
});
