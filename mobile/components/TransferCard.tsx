import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Transfer } from '@/types/database';
import { colors, fonts, radii, shadows, sf, formatCOP } from '@/lib/theme';

interface TransferCardProps {
  transfer: Transfer;
  branchName?: string;
  onPress?: () => void;
}

const providerLabels: Record<string, string> = {
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  bancolombia: 'Bancolombia',
};


export default function TransferCard({ transfer, branchName, onPress }: TransferCardProps) {
  const time = new Date(transfer.occurred_at).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={onPress ? 0.7 : 1} disabled={!onPress}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.provider}>{providerLabels[transfer.provider] ?? transfer.provider}</Text>
          {transfer.transaction_id ? (
            <Text style={styles.txnId} numberOfLines={1}>{transfer.transaction_id}</Text>
          ) : null}
          {branchName && (
            <View style={styles.branchTag}>
              <Text style={styles.branchTagText}>{branchName}</Text>
            </View>
          )}
        </View>
        <View style={styles.right}>
          <Text style={styles.amount}>{formatCOP(transfer.amount)}</Text>
          <Text style={styles.time}>{time}</Text>
        </View>
      </View>
    </TouchableOpacity>
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
    fontSize: sf(17),
    color: colors.primary,
  },
  txnId: {
    fontFamily: fonts.regular,
    fontSize: sf(14),
    color: colors.secondary,
    marginTop: 2,
  },
  amount: {
    fontFamily: fonts.bold,
    fontSize: sf(17),
    color: colors.primary,
  },
  time: {
    fontFamily: fonts.regular,
    fontSize: sf(14),
    color: colors.secondary,
    marginTop: 2,
  },
  branchTag: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#E6FAF8',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  branchTagText: {
    fontFamily: fonts.medium,
    fontSize: sf(12),
    color: colors.success,
  },
});
