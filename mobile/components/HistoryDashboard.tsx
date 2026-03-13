import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, formatCOP } from '@/lib/theme';
import { Period, ChartBar, formatChartValue } from '@/lib/history-utils';

const PERIOD_TABS: { key: Period; label: string }[] = [
  { key: 'day', label: 'Día' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
  { key: 'year', label: 'Año' },
];

const BAR_MAX_HEIGHT = 120;

interface Props {
  period: Period;
  offset: number;
  total: number;
  periodLabel: string;
  rangeLabel: string;
  chartBars: ChartBar[];
  canGoForward: boolean;
  onPeriodChange: (p: Period) => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function HistoryDashboard({
  period,
  offset,
  total,
  periodLabel,
  rangeLabel,
  chartBars,
  canGoForward,
  onPeriodChange,
  onPrev,
  onNext,
}: Props) {
  const maxValue = Math.max(...chartBars.map((b) => b.value), 1);

  return (
    <View style={styles.container}>
      {/* Period tabs */}
      <View style={styles.tabs}>
        {PERIOD_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onPeriodChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabLabel, period === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {period === tab.key && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Date navigator */}
      <View style={styles.navigator}>
        <TouchableOpacity
          onPress={onPrev}
          hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
          activeOpacity={0.6}
        >
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.periodInfo}>
          <Text style={styles.periodLabel}>{periodLabel}</Text>
          <Text style={styles.rangeLabel}>{rangeLabel}</Text>
        </View>

        <TouchableOpacity
          onPress={onNext}
          disabled={!canGoForward}
          hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
          activeOpacity={0.6}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={canGoForward ? colors.primary : colors.border}
          />
        </TouchableOpacity>
      </View>

      {/* Total */}
      <Text style={styles.total}>{formatCOP(total)}</Text>

      {/* Bar chart */}
      <View style={styles.chartContainer}>
        <View style={styles.barsRow}>
          {chartBars.map((bar, i) => {
            const barH = maxValue > 0 ? (bar.value / maxValue) * BAR_MAX_HEIGHT : 0;
            return (
              <View key={i} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View style={[styles.bar, { height: Math.max(barH, bar.value > 0 ? 4 : 0) }]} />
                </View>
                <Text style={styles.barLabel}>{bar.label}</Text>
              </View>
            );
          })}
        </View>

        {/* Y-axis labels on the right */}
        <View style={styles.yAxis} pointerEvents="none">
          <Text style={styles.yLabel}>{formatChartValue(maxValue)}</Text>
          <Text style={styles.yLabel}>$0</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingTop: 8,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    marginRight: 24,
    paddingBottom: 4,
    alignItems: 'center',
  },
  tabLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.secondary,
  },
  tabLabelActive: {
    fontFamily: fonts.bold,
    color: colors.success,
  },
  tabUnderline: {
    marginTop: 3,
    height: 2,
    width: '100%',
    backgroundColor: colors.success,
    borderRadius: 1,
  },

  // Navigator
  navigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 8,
  },
  periodInfo: {
    alignItems: 'center',
    minWidth: 140,
  },
  periodLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.primary,
  },
  rangeLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.secondary,
    marginTop: 2,
  },

  // Total
  total: {
    fontFamily: fonts.extraBold,
    fontSize: 32,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 20,
  },

  // Chart
  chartContainer: {
    marginHorizontal: 20,
    marginBottom: 8,
    position: 'relative',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: BAR_MAX_HEIGHT + 24, // bars + label
    paddingRight: 36, // space for y-axis
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    width: '60%',
    height: BAR_MAX_HEIGHT,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  barLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.secondary,
    marginTop: 6,
  },

  // Y-axis
  yAxis: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 24,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  yLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.secondary,
  },
});
