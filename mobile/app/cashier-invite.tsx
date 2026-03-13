import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { colors, fonts, radii, shadows } from '@/lib/theme';

type InviteInfo = {
  id: string;
  business_id: string;
  branch_ids: string[];
  businessName: string;
};

export default function CashierInviteScreen() {
  const { refreshBusinessUser } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    lookupInvite();
  }, []);

  async function lookupInvite() {
    const { data, error: rpcError } = await supabase.rpc('get_my_pending_invite');

    if (rpcError || !data) {
      setError('No tienes invitaciones pendientes.');
      setChecking(false);
      return;
    }

    setInvite({
      id: data.id,
      business_id: data.business_id,
      branch_ids: data.branch_ids,
      businessName: data.business_name || 'el negocio',
    });
    setChecking(false);
  }

  async function handleAccept() {
    if (!invite) return;
    setAccepting(true);

    const { error: acceptError } = await supabase.rpc('accept_invite', {
      p_invite_id: invite.id,
    });

    if (acceptError) {
      setError(acceptError.message);
      setAccepting(false);
      return;
    }

    await refreshBusinessUser();
    router.replace('/(app)/(home)');
  }

  // ── Loading ──
  if (checking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Buscando tu invitación...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ──
  if (error || !invite) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-unread-outline" size={40} color={colors.secondary} />
          </View>
          <Text style={styles.errorTitle}>No se encontró invitación</Text>
          <Text style={styles.errorMessage}>{error ?? 'No tienes invitaciones pendientes.'}</Text>
          <Text style={styles.errorHint}>
            Pídele al administrador que te invite con el número que usaste para registrarte.
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Welcome / Accept ──
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centered}>
        <View style={styles.iconCircle}>
          <Ionicons name="storefront-outline" size={40} color={colors.primary} />
        </View>

        <Text style={styles.welcomeTitle}>¡Bienvenido!</Text>
        <Text style={styles.welcomeSub}>Has sido invitado a unirte a</Text>
        <Text style={styles.businessName}>{invite.businessName}</Text>

        <View style={styles.card}>
          <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
          <Text style={styles.cardText}>
            Al aceptar, podrás registrar transferencias en este negocio.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, accepting && { opacity: 0.6 }]}
          onPress={handleAccept}
          disabled={accepting}
          activeOpacity={0.8}
        >
          {accepting ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.buttonText}>Aceptar invitación</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.cancelLink}>
          <Text style={styles.cancelLinkText}>No por ahora</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 32,
  },
  loadingText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.secondary,
    marginTop: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    ...shadows.medium,
  },

  // Welcome
  welcomeTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 32,
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSub: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.secondary,
    textAlign: 'center',
  },
  businessName: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.primary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 32,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 16,
    width: '100%',
    marginBottom: 32,
    ...shadows.soft,
  },
  cardText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.secondary,
    lineHeight: 20,
  },

  // Error
  errorTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorHint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.secondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },

  // Buttons
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.surface,
  },
  cancelLink: {
    marginTop: 16,
    padding: 8,
  },
  cancelLinkText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.secondary,
  },
});
