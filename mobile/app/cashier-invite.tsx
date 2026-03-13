import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { colors, fonts, radii } from '@/lib/theme';

export default function CashierInviteScreen() {
  const { refreshBusinessUser } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkInvite();
  }, []);

  async function checkInvite() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.phone) {
      setError('No se pudo obtener tu número de teléfono');
      setChecking(false);
      return;
    }

    // Normalize phone to E.164 (+prefix) to match how PhoneInput stores it
    const phone = user.phone.startsWith('+') ? user.phone : `+${user.phone}`;

    // Check for pending invite
    const { data: invites, error: inviteError } = await supabase
      .from('invite')
      .select('id, business_id, branch_ids')
      .eq('phone', phone)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .limit(1);

    if (inviteError) {
      setError(inviteError.message);
      setChecking(false);
      return;
    }

    if (!invites || invites.length === 0) {
      setError('No tienes invitaciones pendientes');
      setChecking(false);
      return;
    }

    // Accept the invite
    const { error: acceptError } = await supabase.rpc('accept_invite', {
      p_invite_id: invites[0].id,
    });

    if (acceptError) {
      setError(acceptError.message);
      setChecking(false);
      return;
    }

    // Refresh business user and navigate to app
    await refreshBusinessUser();
    router.replace('/(app)/(home)');
  }

  function handleGoBack() {
    router.back();
  }

  if (checking) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Verificando invitación...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.errorTitle}>No se encontró invitación</Text>
          <Text style={styles.errorMessage}>
            {error}
          </Text>
          <Text style={styles.errorHint}>
            Debes ser invitado por un administrador para unirte como cajero.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={handleGoBack}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.secondary,
    marginTop: 16,
  },
  errorTitle: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.secondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorHint: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.secondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.surface,
  },
});
