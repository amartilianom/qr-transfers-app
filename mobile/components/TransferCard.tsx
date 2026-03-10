import { View, Text, StyleSheet } from 'react-native';
import { Transfer } from '@/types/database';
import { colors, fonts, radii, shadows } from '@/lib/theme';
import { formatCOP } from '@/lib/theme';

interface TransferCardProps {
  transfer: Transfer;
}

const providerLabels: Record<string, string> = {
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  bancolombia: 'Bancolombia',
};

const providerColors: Record<string, string> = {
  nequi: '#E91E63',
  daviplata: '#FF5722',
  bancolombia: '#FFC107',
};

export default function TransferCard({ transfer }: TransferCardProps) {
  const time = new Date(transfer.occurred_at).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.left}>
          <View style={[styles.providerDot, { backgroundColor: providerColors[transfer.provider] ?? colors.secondary }]} />
          <View>
            <Text style={styles.provider}>{providerLabels[transfer.provider] ?? transfer.provider}</Text>
            <Text style={styles.time}>{time}</Text>
          </View>
        </View>
        <Text style={styles.amount}>{formatCOP(transfer.amount)}</Text>
      </View>
      {transfer.transaction_id ? (
        <Text style={styles.txnId} numberOfLines={1}>
          {transfer.transaction_id}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 16,
    ...shadows.soft,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  providerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  provider: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.primary,
  },
  time: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.secondary,
    marginTop: 2,
  },
  amount: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.primary,
  },
  txnId: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.secondary,
    marginTop: 8,
  },
});
