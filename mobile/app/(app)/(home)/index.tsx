import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useBranch } from '@/lib/branch-context';
import { getTodayTransfers } from '@/lib/queries';
import { Transfer } from '@/types/database';
import HeroCard from '@/components/HeroCard';
import TransferCard from '@/components/TransferCard';
import BranchPicker from '@/components/BranchPicker';
import AppHeader from '@/components/AppHeader';
import { colors, fonts } from '@/lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const { selectedBranchIds, needsPicker } = useBranch();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const todayTotal = transfers.reduce((sum, t) => sum + Number(t.amount), 0);

  const fetchData = useCallback(async () => {
    if (selectedBranchIds.length === 0) return;
    const { data } = await getTodayTransfers(selectedBranchIds);
    setTransfers(data ?? []);
    setLoading(false);
  }, [selectedBranchIds]);

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

  if (selectedBranchIds.length === 0) {
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
      <AppHeader title="Tu Resumen" />
      <FlatList
        data={transfers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
            <TransferCard
              transfer={item}
              onPress={() => router.push({ pathname: '/(app)/transfer/confirm', params: { transferId: item.id, from: 'home' } })}
            />
          )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.heroContainer}>
            <HeroCard total={todayTotal} />
            <Text style={styles.sectionHeader}>Transacciones de hoy:</Text>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>No hay transferencias hoy</Text>
          ) : null
        }
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  heroContainer: {
    marginBottom: 4,
  },
  sectionHeader: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.primary,
    marginTop: 20,
    marginBottom: 12,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.secondary,
    textAlign: 'center',
    marginTop: 40,
  },
});
