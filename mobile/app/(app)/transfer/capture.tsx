import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radii, shadows } from '@/lib/theme';

export default function CaptureScreen() {
  const router = useRouter();

  async function pickImage(useCamera: boolean) {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso para continuar');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
        });

    if (!result.canceled && result.assets[0]) {
      router.push({
        pathname: '/(app)/transfer/confirm',
        params: { imageUri: result.assets[0].uri },
      });
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backText}>Cancelar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Registrar transferencia</Text>
        <Text style={styles.subtitle}>
          Toma una foto o selecciona la captura de pantalla de la transferencia
        </Text>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => pickImage(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.optionIcon}>📷</Text>
          <Text style={styles.optionText}>Tomar foto</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => pickImage(false)}
          activeOpacity={0.8}
        >
          <Text style={styles.optionIcon}>🖼️</Text>
          <Text style={styles.optionText}>Seleccionar de galería</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.secondary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
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
    marginBottom: 40,
  },
  optionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
    ...shadows.soft,
  },
  optionIcon: {
    fontSize: 28,
  },
  optionText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.primary,
  },
});
