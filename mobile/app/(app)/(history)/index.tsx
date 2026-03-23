import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useBranch } from '@/lib/branch-context';
import { useAuth } from '@/lib/auth-context';
import { getTransfersByDateRange } from '@/lib/queries';
import { Transfer } from '@/types/database';
import TransferCard from '@/components/TransferCard';
import AppHeader from '@/components/AppHeader';
import HistoryDashboard from '@/components/HistoryDashboard';
import { colors, fonts, formatCOP, radii, shadows, sf } from '@/lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Period, getPeriodInfo, buildChartBars } from '@/lib/history-utils';

type Section = { title: string; total: number; data: Transfer[] };
type BranchStat = { id: string; name: string; total: number; count: number };

function groupByDate(transfers: Transfer[]): Section[] {
  const map = new Map<string, Transfer[]>();

  for (const t of transfers) {
    const key = new Date(t.occurred_at).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }

  const fmt = (d: Date) =>
    d.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const todayKey = fmt(new Date());
  const yesterdayKey = fmt(new Date(Date.now() - 86_400_000));

  return Array.from(map.entries()).map(([key, data]) => {
    let title = key;
    if (key === todayKey) title = 'Hoy';
    else if (key === yesterdayKey) title = 'Ayer';
    return { title, total: data.reduce((s, t) => s + Number(t.amount), 0), data };
  });
}

export default function HistoryScreen() {
  const router = useRouter();
  const { selectedBranchIds, branches, isAllBranches } = useBranch();
  const { currentBusinessUser, session } = useAuth();
  const isCollaborator = currentBusinessUser?.role !== 'admin';
  const showBreakdown = !isCollaborator && isAllBranches && branches.length > 1;
  const [period, setPeriod] = useState<Period>('day');
  const [offset, setOffset] = useState(0);
  const [allFetched, setAllFetched] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const periodInfo = useMemo(() => getPeriodInfo(period, offset), [period, offset]);

  const fetchData = useCallback(async () => {
    if (selectedBranchIds.length === 0) return;
    const { data } = await getTransfersByDateRange(
      selectedBranchIds,
      periodInfo.fetchStart,
      periodInfo.fetchEnd,
    );
    setAllFetched(data ?? []);
    setLoading(false);
  }, [selectedBranchIds, periodInfo.fetchStart, periodInfo.fetchEnd]);

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

  function handlePeriodChange(p: Period) {
    setPeriod(p);
    setOffset(0);
  }

  const scopedFetched = useMemo(
    () => isCollaborator
      ? allFetched.filter((t) => t.created_by === session?.user.id)
      : allFetched,
    [allFetched, isCollaborator, session],
  );

  // List and total use the narrower listStart/listEnd (relevant for 'day' mode)
  const listTransfers = useMemo(() => {
    const { listStart, listEnd } = periodInfo;
    return scopedFetched.filter((t) => {
      const d = new Date(t.occurred_at).getTime();
      return d >= listStart.getTime() && d <= listEnd.getTime();
    });
  }, [scopedFetched, periodInfo]);

  // In 'day' mode the chart only plots the selected day — other bars stay at zero.
  // In all other modes the chart spans the full fetched period.
  const chartBars = useMemo(
    () => buildChartBars(
      periodInfo.emptyBars,
      period === 'day' ? listTransfers : scopedFetched,
      periodInfo.getBucketIndex,
    ),
    [period, listTransfers, scopedFetched, periodInfo],
  );

  const total = useMemo(
    () => listTransfers.reduce((s, t) => s + Number(t.amount), 0),
    [listTransfers],
  );

  const sections = useMemo(() => groupByDate(listTransfers), [listTransfers]);

  const branchStats = useMemo<BranchStat[]>(() => {
    if (!showBreakdown) return [];
    return branches.map((b) => {
      const bt = listTransfers.filter((t) => t.branch_id === b.id);
      return { id: b.id, name: b.name, total: bt.reduce((s, t) => s + Number(t.amount), 0), count: bt.length };
    });
  }, [showBreakdown, branches, listTransfers]);

  const dashboard = (
    <HistoryDashboard
      period={period}
      offset={offset}
      total={total}
      periodLabel={periodInfo.periodLabel}
      rangeLabel={periodInfo.rangeLabel}
      chartBars={chartBars}
      canGoForward={periodInfo.canGoForward}
      onPeriodChange={handlePeriodChange}
      onPrev={() => setOffset((o) => o - 1)}
      onNext={() => setOffset((o) => Math.min(o + 1, 0))}
      showChart={!isCollaborator}
      transferCount={isCollaborator || showBreakdown ? listTransfers.length : undefined}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader title="Tu Historial" />
        {dashboard}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Tu Historial" />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <TransferCard
              transfer={item}
              branchName={showBreakdown ? branches.find((b) => b.id === item.branch_id)?.name : undefined}
              onPress={() => router.push({ pathname: '/(app)/transfer/confirm', params: { transferId: item.id, from: 'history' } })}
            />
          </View>
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionDot}>·</Text>
            <Text style={styles.sectionTotal}>{formatCOP(section.total)}</Text>
          </View>
        )}
        ListHeaderComponent={
          <View>
            {dashboard}
            {showBreakdown && (
              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownHeader}>Este período por sucursal:</Text>
                {branchStats.map((s) => {
                  const pct = total > 0 ? Math.round((s.total / total) * 100) : null;
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
              </View>
            )}
            <View style={styles.divider} />
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay transferencias en este período</Text>
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        stickySectionHeadersEnabled={false}
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontFamily: fonts.medium,
    fontSize: sf(14),
    color: colors.secondary,
  },
  sectionDot: {
    fontFamily: fonts.medium,
    fontSize: sf(14),
    color: colors.secondary,
  },
  sectionTotal: {
    fontFamily: fonts.semiBold,
    fontSize: sf(14),
    color: colors.secondary,
  },
  cardWrapper: {
    marginBottom: 10,
  },
  breakdownSection: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  breakdownHeader: {
    fontFamily: fonts.semiBold,
    fontSize: sf(14),
    color: colors.secondary,
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
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: sf(15),
    color: colors.secondary,
    textAlign: 'center',
    marginTop: 40,
  },
});
