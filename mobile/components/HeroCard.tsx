import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radii, shadows, sf, formatCOP } from '@/lib/theme';

interface HeroCardProps {
  total: number;
  label?: string;
}

export default function HeroCard({ total, label = 'Total de hoy' }: HeroCardProps) {
  const dateLabel = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.total}>{formatCOP(total)}</Text>
      <Text style={styles.date}>{dateLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.highlight,
    borderRadius: radii.hero,
    padding: 28,
    alignItems: 'center',
    ...shadows.medium,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: sf(16),
    color: colors.primary,
    opacity: 0.7,
    marginBottom: 6,
  },
  total: {
    fontFamily: fonts.extraBold,
    fontSize: sf(44),
    color: colors.primary,
  },
  date: {
    fontFamily: fonts.regular,
    fontSize: sf(15),
    color: colors.primary,
    opacity: 0.6,
    marginTop: 6,
  },
});
