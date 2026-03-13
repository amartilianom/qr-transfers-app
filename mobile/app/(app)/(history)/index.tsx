import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useBranch } from '@/lib/branch-context';
import { getTransfersByDateRange } from '@/lib/queries';
import { Transfer } from '@/types/database';
import TransferCard from '@/components/TransferCard';
import AppHeader from '@/components/AppHeader';
import HistoryDashboard from '@/components/HistoryDashboard';
import { colors, fonts, formatCOP } from '@/lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Period, getPeriodInfo, buildChartBars } from '@/lib/history-utils';

type Section = { title: string; total: number; data: Transfer[] };

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
  const { selectedBranchIds } = useBranch();
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

  // List and total use the narrower listStart/listEnd (relevant for 'day' mode)
  const listTransfers = useMemo(() => {
    const { listStart, listEnd } = periodInfo;
    return allFetched.filter((t) => {
      const d = new Date(t.occurred_at).getTime();
      return d >= listStart.getTime() && d <= listEnd.getTime();
    });
  }, [allFetched, periodInfo]);

  // In 'day' mode the chart only plots the selected day — other bars stay at zero.
  // In all other modes the chart spans the full fetched period.
  const chartBars = useMemo(
    () => buildChartBars(
      periodInfo.emptyBars,
      period === 'day' ? listTransfers : allFetched,
      periodInfo.getBucketIndex,
    ),
    [period, listTransfers, allFetched, periodInfo],
  );

  const total = useMemo(
    () => listTransfers.reduce((s, t) => s + Number(t.amount), 0),
    [listTransfers],
  );

  const sections = useMemo(() => groupByDate(listTransfers), [listTransfers]);

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
            <TransferCard transfer={item} />
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
    fontSize: 12,
    color: colors.secondary,
  },
  sectionDot: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.secondary,
  },
  sectionTotal: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.secondary,
  },
  cardWrapper: {
    marginBottom: 10,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.secondary,
    textAlign: 'center',
    marginTop: 40,
  },
});
