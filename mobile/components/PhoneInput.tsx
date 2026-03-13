import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii, shadows } from '@/lib/theme';

export interface Country {
  name: string;
  flag: string;
  dialCode: string;
  code: string;
}

// Ordered: Colombia first, then rest of LatAm, then world
export const COUNTRIES: Country[] = [
  { name: 'Colombia', flag: '🇨🇴', dialCode: '+57', code: 'CO' },
  { name: 'México', flag: '🇲🇽', dialCode: '+52', code: 'MX' },
  { name: 'Argentina', flag: '🇦🇷', dialCode: '+54', code: 'AR' },
  { name: 'Chile', flag: '🇨🇱', dialCode: '+56', code: 'CL' },
  { name: 'Perú', flag: '🇵🇪', dialCode: '+51', code: 'PE' },
  { name: 'Venezuela', flag: '🇻🇪', dialCode: '+58', code: 'VE' },
  { name: 'Ecuador', flag: '🇪🇨', dialCode: '+593', code: 'EC' },
  { name: 'Bolivia', flag: '🇧🇴', dialCode: '+591', code: 'BO' },
  { name: 'Paraguay', flag: '🇵🇾', dialCode: '+595', code: 'PY' },
  { name: 'Uruguay', flag: '🇺🇾', dialCode: '+598', code: 'UY' },
  { name: 'Brasil', flag: '🇧🇷', dialCode: '+55', code: 'BR' },
  { name: 'Panamá', flag: '🇵🇦', dialCode: '+507', code: 'PA' },
  { name: 'Costa Rica', flag: '🇨🇷', dialCode: '+506', code: 'CR' },
  { name: 'Guatemala', flag: '🇬🇹', dialCode: '+502', code: 'GT' },
  { name: 'Honduras', flag: '🇭🇳', dialCode: '+504', code: 'HN' },
  { name: 'El Salvador', flag: '🇸🇻', dialCode: '+503', code: 'SV' },
  { name: 'Nicaragua', flag: '🇳🇮', dialCode: '+505', code: 'NI' },
  { name: 'Cuba', flag: '🇨🇺', dialCode: '+53', code: 'CU' },
  { name: 'República Dominicana', flag: '🇩🇴', dialCode: '+1809', code: 'DO' },
  { name: 'Puerto Rico', flag: '🇵🇷', dialCode: '+1787', code: 'PR' },
  { name: 'España', flag: '🇪🇸', dialCode: '+34', code: 'ES' },
  { name: 'Estados Unidos', flag: '🇺🇸', dialCode: '+1', code: 'US' },
  { name: 'Canadá', flag: '🇨🇦', dialCode: '+1', code: 'CA' },
  { name: 'Reino Unido', flag: '🇬🇧', dialCode: '+44', code: 'GB' },
  { name: 'Alemania', flag: '🇩🇪', dialCode: '+49', code: 'DE' },
  { name: 'Francia', flag: '🇫🇷', dialCode: '+33', code: 'FR' },
  { name: 'Italia', flag: '🇮🇹', dialCode: '+39', code: 'IT' },
  { name: 'Portugal', flag: '🇵🇹', dialCode: '+351', code: 'PT' },
  { name: 'Países Bajos', flag: '🇳🇱', dialCode: '+31', code: 'NL' },
  { name: 'Suiza', flag: '🇨🇭', dialCode: '+41', code: 'CH' },
  { name: 'Australia', flag: '🇦🇺', dialCode: '+61', code: 'AU' },
  { name: 'China', flag: '🇨🇳', dialCode: '+86', code: 'CN' },
  { name: 'Japón', flag: '🇯🇵', dialCode: '+81', code: 'JP' },
  { name: 'India', flag: '🇮🇳', dialCode: '+91', code: 'IN' },
  { name: 'Rusia', flag: '🇷🇺', dialCode: '+7', code: 'RU' },
  { name: 'Arabia Saudita', flag: '🇸🇦', dialCode: '+966', code: 'SA' },
  { name: 'Emiratos Árabes', flag: '🇦🇪', dialCode: '+971', code: 'AE' },
  { name: 'Turquía', flag: '🇹🇷', dialCode: '+90', code: 'TR' },
  { name: 'Sudáfrica', flag: '🇿🇦', dialCode: '+27', code: 'ZA' },
  { name: 'Nigeria', flag: '🇳🇬', dialCode: '+234', code: 'NG' },
];

function parsePhone(raw: string): { country: Country; number: string } {
  const defaultCountry = COUNTRIES[0]; // Colombia
  if (!raw) return { country: defaultCountry, number: '' };

  const withPlus = raw.startsWith('+') ? raw : `+${raw}`;

  // Try longest dial code first to avoid prefix collisions (+1 vs +1787)
  const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const c of sorted) {
    if (withPlus.startsWith(c.dialCode)) {
      return { country: c, number: withPlus.slice(c.dialCode.length) };
    }
  }
  return { country: defaultCountry, number: raw };
}

interface Props {
  value: string;
  onChange: (fullNumber: string) => void;
}

export default function PhoneInput({ value, onChange }: Props) {
  const parsed = useMemo(() => parsePhone(value), []);
  const [country, setCountry] = useState<Country>(parsed.country);
  const [number, setNumber] = useState(parsed.number);
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = q ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.dialCode.includes(q)) : COUNTRIES;
    return [...list].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [search]);

  function selectCountry(c: Country) {
    setCountry(c);
    setSearch('');
    setModalVisible(false);
    onChange(`${c.dialCode}${number}`);
  }

  function handleNumberChange(text: string) {
    const digits = text.replace(/[^0-9]/g, '');
    setNumber(digits);
    onChange(`${country.dialCode}${digits}`);
  }

  return (
    <>
      <View style={styles.container}>
        {/* Country picker button */}
        <TouchableOpacity style={styles.dialButton} onPress={() => setModalVisible(true)} activeOpacity={0.7}>
          <Text style={styles.flag}>{country.flag}</Text>
          <Text style={styles.dialCode}>{country.dialCode}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.secondary} />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Number input */}
        <TextInput
          style={styles.input}
          value={number}
          onChangeText={handleNumberChange}
          placeholder="300 123 4567"
          placeholderTextColor={colors.secondary}
          keyboardType="phone-pad"
          returnKeyType="done"
        />
      </View>

      {/* Country picker modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar país</Text>
            <TouchableOpacity onPress={() => { setSearch(''); setModalVisible(false); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={16} color={colors.secondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar país o código..."
              placeholderTextColor={colors.secondary}
              autoFocus
              clearButtonMode="while-editing"
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.countryRow} onPress={() => selectCountry(item)} activeOpacity={0.7}>
                <Text style={styles.countryFlag}>{item.flag}</Text>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.countryDial}>{item.dialCode}</Text>
                {item.code === country.code && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingHorizontal: 16,
    ...shadows.soft,
  },
  dialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingRight: 8,
  },
  flag: {
    fontSize: 20,
  },
  dialCode: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.primary,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.primary,
    paddingVertical: 14,
  },

  // Modal
  modal: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: colors.surface,
    borderRadius: radii.input,
    paddingHorizontal: 12,
    ...shadows.soft,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.primary,
    paddingVertical: 12,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  countryFlag: {
    fontSize: 22,
  },
  countryName: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.primary,
  },
  countryDial: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.secondary,
    marginRight: 4,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 64,
  },
});
