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


export default function TransferCard({ transfer }: TransferCardProps) {
  const time = new Date(transfer.occurred_at).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.provider}>{providerLabels[transfer.provider] ?? transfer.provider}</Text>
          {transfer.transaction_id ? (
            <Text style={styles.txnId} numberOfLines={1}>{transfer.transaction_id}</Text>
          ) : null}
        </View>
        <View style={styles.right}>
          <Text style={styles.amount}>{formatCOP(transfer.amount)}</Text>
          <Text style={styles.time}>{time}</Text>
        </View>
      </View>
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
    alignItems: 'flex-start',
  },
  left: {
    flex: 1,
    flexDirection: 'column',
  },
  right: {
    alignItems: 'flex-end',
  },
  provider: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.primary,
  },
  txnId: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.secondary,
    marginTop: 2,
  },
  amount: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.primary,
  },
  time: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.secondary,
    marginTop: 2,
  },
});
