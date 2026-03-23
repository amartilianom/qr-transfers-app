import { useState, useCallback, useMemo } from 'react';
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
import { useAuth } from '@/lib/auth-context';
import { getTodayTransfers } from '@/lib/queries';
import { Transfer } from '@/types/database';
import HeroCard from '@/components/HeroCard';
import TransferCard from '@/components/TransferCard';
import AppHeader from '@/components/AppHeader';
import { colors, fonts, formatCOP, radii, shadows, sf } from '@/lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

type BranchStat = { id: string; name: string; total: number; count: number };

export default function HomeScreen() {
  const router = useRouter();
  const { selectedBranchIds, branches, isAllBranches } = useBranch();
  const { currentBusinessUser, session } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isCollaborator = currentBusinessUser?.role !== 'admin';
  const showBreakdown = !isCollaborator && isAllBranches && branches.length > 1;

  const visibleTransfers = useMemo(
    () => isCollaborator
      ? transfers.filter((t) => t.created_by === session?.user.id)
      : transfers,
    [transfers, isCollaborator, session],
  );

  const todayTotal = useMemo(
    () => visibleTransfers.reduce((sum, t) => sum + Number(t.amount), 0),
    [visibleTransfers],
  );

  const branchStats = useMemo<BranchStat[]>(() => {
    if (!showBreakdown) return [];
    return branches.map((b) => {
      const bt = transfers.filter((t) => t.branch_id === b.id);
      return { id: b.id, name: b.name, total: bt.reduce((s, t) => s + Number(t.amount), 0), count: bt.length };
    });
  }, [showBreakdown, branches, transfers]);

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
        data={visibleTransfers}
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
            <HeroCard
              total={todayTotal}
              label={isCollaborator ? 'Mi total de hoy' : undefined}
            />
            {showBreakdown && (
              <>
                <Text style={styles.breakdownHeader}>Hoy por sucursal:</Text>
                {branchStats.map((s) => {
                  const pct = todayTotal > 0 ? Math.round((s.total / todayTotal) * 100) : null;
                  return (
                    <View key={s.id} style={styles.breakdownCard}>
                      <View>
                        <Text style={styles.breakdownName}>{s.name}</Text>
                        <Text style={styles.breakdownCount}>{s.count} transferencias</Text>
                      </View>
                      <View style={styles.breakdownRight}>
                        <Text style={styles.breakdownTotal}>{formatCOP(s.total)}</Text>
                        <Text style={styles.breakdownPct}>{pct !== null ? `${pct}%` : '—'}</Text>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
            <Text style={styles.sectionHeader}>
              {isCollaborator ? 'Mis transferencias de hoy:' : 'Transacciones de hoy:'}
            </Text>
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
  breakdownHeader: {
    fontFamily: fonts.semiBold,
    fontSize: sf(14),
    color: colors.secondary,
    marginTop: 20,
    marginBottom: 10,
  },
  breakdownCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    ...shadows.soft,
  },
  breakdownName: {
    fontFamily: fonts.medium,
    fontSize: sf(16),
    color: colors.primary,
  },
  breakdownCount: {
    fontFamily: fonts.regular,
    fontSize: sf(13),
    color: colors.secondary,
    marginTop: 2,
  },
  breakdownRight: {
    alignItems: 'flex-end',
  },
  breakdownTotal: {
    fontFamily: fonts.semiBold,
    fontSize: sf(16),
    color: colors.primary,
  },
  breakdownPct: {
    fontFamily: fonts.regular,
    fontSize: sf(13),
    color: colors.secondary,
    marginTop: 2,
  },
});
