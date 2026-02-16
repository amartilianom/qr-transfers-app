import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { colors, fonts, radii } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import type { Business, BusinessUser } from '@/types/database';

type BusinessUserWithBusiness = BusinessUser & {
  business: Business;
};

export default function BusinessSelectScreen() {
  const { switchBusiness } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessUserWithBusiness[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchBusinesses();
  }, []);

  async function fetchBusinesses() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.replace('/(auth)/sign-in');
      return;
    }

    const { data, error } = await supabase
      .from('business_user')
      .select(`
        *,
        business:business_id (*)
      `)
      .eq('user_id', user.id)
      .eq('active', true)
      .returns<BusinessUserWithBusiness[]>();

    if (!error && data) {
      setBusinesses(data);
      // Auto-select the last_selected or first one
      const lastSelected = data.find(bu => bu.last_selected);
      setSelected(lastSelected?.id || data[0]?.id);
    }

    setLoading(false);
  }

  async function handleContinue() {
    if (selected && switchBusiness) {
      await switchBusiness(selected);
      router.replace('/(app)/(home)');
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Selecciona tu negocio</Text>
        <Text style={styles.subtitle}>
          Tienes acceso a múltiples negocios
        </Text>

        {businesses.map((bu) => (
          <TouchableOpacity
            key={bu.id}
            style={[
              styles.businessItem,
              selected === bu.id && styles.businessItemSelected,
            ]}
            onPress={() => setSelected(bu.id)}
            activeOpacity={0.8}
          >
            <View style={styles.radioContainer}>
              <View
                style={[
                  styles.radioOuter,
                  selected === bu.id && styles.radioOuterSelected,
                ]}
              >
                {selected === bu.id && <View style={styles.radioInner} />}
              </View>
            </View>
            <View style={styles.businessInfo}>
              <Text style={styles.businessName}>{bu.business.name}</Text>
              <Text style={styles.businessRole}>
                {bu.role === 'admin' ? 'Administrador' : 'Cajero'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/bootstrap')}
          activeOpacity={0.8}
        >
          <Text style={styles.createButtonText}>+ Crear nuevo negocio</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          disabled={!selected}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continuar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.secondary,
    marginBottom: 32,
  },
  businessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.button,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  businessItemSelected: {
    borderColor: colors.primary,
  },
  radioContainer: {
    marginRight: 16,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.primary,
    marginBottom: 4,
  },
  businessRole: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.secondary,
  },
  createButton: {
    backgroundColor: colors.surface,
    borderRadius: radii.button,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  createButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.primary,
  },
  footer: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.surface,
  },
});
