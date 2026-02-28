import { useState, useCallback } from 'react';
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
import { getTransferHistory } from '@/lib/queries';
import { Transfer } from '@/types/database';
import TransferCard from '@/components/TransferCard';
import AppHeader from '@/components/AppHeader';
import { colors, fonts, formatCOP } from '@/lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

type Section = {
  title: string;
  total: number;
  data: Transfer[];
};

function groupByDate(transfers: Transfer[]): Section[] {
  const map = new Map<string, Transfer[]>();

  for (const t of transfers) {
    const date = new Date(t.occurred_at);
    const key = date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }

  const today = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return Array.from(map.entries()).map(([key, data]) => {
    let title = key;
    if (key === today) title = 'Hoy';
    else if (key === yesterday) title = 'Ayer';

    const total = data.reduce((sum, t) => sum + Number(t.amount), 0);
    return { title, total, data };
  });
}

export default function HistoryScreen() {
  const { currentBranch } = useBranch();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentBranch) return;
    const { data } = await getTransferHistory(currentBranch.id);
    setSections(groupByDate(data ?? []));
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Tu Historial" />
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
            <Text style={styles.sectionTotal}>{formatCOP(section.total)}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay transferencias registradas</Text>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTotal: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primary,
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
